import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { Chat } from '@google/genai';

import {
    AgentId,
    Message,
    Schedule,
    Session,
    ToastMessage,
    ToolStates,
    UserStateVector,
    View,
} from './types';
import { generateAgentResponse } from './services/geminiService.ts';
import { createDoshaChat, startDoshaConversation, continueDoshaConversation } from './services/geminiDoshaService.ts';
import { createRoutineAlignerChat, startRoutineAlignerConversation, continueRoutineAlignerConversation } from './services/geminiRoutineAlignerService.ts';
import { AGENTS } from './constants.tsx';
import { getFriendlyErrorMessage } from './utils/errorUtils.ts';
import { useAistudioKey } from './hooks/useAistudioKey.ts';

// Helper to calculate UCS
const calculateUcs = (usv: UserStateVector): number => {
    const { spiritual, emotional, physical, financial } = usv;
    // Emotional is inverted (higher is worse), so we use (100 - emotional)
    const avg = (spiritual + (100 - emotional) + physical + financial) / 4;
    return Math.round(avg);
};

// Helper to get recommendation
const getRecommendation = (usv: UserStateVector): AgentId => {
    const dimensions: { key: AgentId, value: number }[] = [
        { key: AgentId.COHERENCE, value: usv.spiritual },
        { key: AgentId.HEALTH, value: usv.physical },
        { key: AgentId.EMOTIONAL_FINANCE, value: 100 - usv.emotional }, // Invert emotional for recommendation
        { key: AgentId.INVESTMENTS, value: usv.financial },
        // FIX: Corrected a reference error by changing `emotional` to `usv.emotional`.
        { key: AgentId.SELF_KNOWLEDGE, value: (usv.spiritual + (100 - usv.emotional)) / 2 } // Self-knowledge is a mix
    ];
    // Find the dimension with the lowest score
    const lowest = dimensions.sort((a, b) => a.value - b.value)[0];
    return lowest.key;
};

// Centralized error handler to check for API key issues
const handleApiError = (error: any, defaultMessage: string, addToast: AppState['addToast']): string => {
    const friendlyMessage = getFriendlyErrorMessage(error, defaultMessage);
    if (friendlyMessage.includes("API") && friendlyMessage.includes("inválida")) {
        // This is a key error. Reset the key state to force re-selection.
        useAistudioKey.getState().resetKey();
    }
    addToast(friendlyMessage, 'error');
    return friendlyMessage;
};


interface AppState {
    usv: UserStateVector;
    ucs: number;
    recommendation: AgentId | null;
    activeView: View;
    currentSession: Session | null;
    lastAgentContext: AgentId | null;
    chatHistories: Record<AgentId, Message[]>;
    isLoadingMessage: boolean;
    toolStates: ToolStates;
    toasts: ToastMessage[];
    doshaChat: Chat | null;
    routineAlignerChat: Chat | null;
    isOnboardingVisible: boolean;
    schedules: Schedule[];

    // Actions
    setView: (view: View) => void;
    startSession: (session: Session) => void;
    endSession: () => void;
    switchAgent: (agentId: AgentId) => void;
    addInitialMessage: (agentId: AgentId) => void;
    handleSendMessage: (agentId: AgentId, text: string) => Promise<void>;
    handleDoshaSendMessage: (text: string) => Promise<void>;
    initDoshaChat: () => Promise<void>;
    handleRoutineAlignerSendMessage: (text: string) => Promise<void>;
    initRoutineAlignerChat: () => Promise<void>;
    setToolState: <T extends keyof ToolStates>(toolId: T, state: ToolStates[T]) => void;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
    closeOnboarding: () => void;
    addSchedule: (schedule: Omit<Schedule, 'id' | 'status'>) => void;
    updateScheduleStatus: (scheduleId: string, status: Schedule['status']) => void;
    updateUsvDimensions: (updates: Partial<Pick<UserStateVector, 'physical' | 'emotional'>>) => void;
    goBackToAgentRoom: () => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // State
            usv: { spiritual: 75, emotional: 40, physical: 60, financial: 50 },
            ucs: 61,
            recommendation: AgentId.EMOTIONAL_FINANCE,
            activeView: 'dashboard',
            currentSession: null,
            lastAgentContext: null,
            chatHistories: {
                [AgentId.COHERENCE]: [],
                [AgentId.SELF_KNOWLEDGE]: [],
                [AgentId.HEALTH]: [],
                [AgentId.EMOTIONAL_FINANCE]: [],
                [AgentId.INVESTMENTS]: [],
            },
            isLoadingMessage: false,
            toolStates: {
                therapeuticJournal: { entry: '', feedback: null, error: null },
                doshaDiagnosis: { messages: [], isFinished: false, error: null },
                routineAligner: { messages: [], isFinished: false, error: null },
                doshaResult: null,
            },
            toasts: [],
            doshaChat: null,
            routineAlignerChat: null,
            isOnboardingVisible: true,
            schedules: [],

            // Actions
            setView: (view) => set({ activeView: view }),

            startSession: (session) => {
                // For interactive chat tools, always re-initialize to get fresh context
                if (session.type === 'dosha_diagnosis') {
                    get().initDoshaChat();
                }
                if (session.type === 'routine_aligner') {
                    get().initRoutineAlignerChat();
                }

                if (session.type === 'agent') {
                    set({ currentSession: session, lastAgentContext: session.id });
                    get().addInitialMessage(session.id);
                } else {
                    set({ currentSession: session });
                }
            },

            endSession: () => set({ currentSession: null }),
            
            switchAgent: (agentId) => {
                set({ 
                    currentSession: { type: 'agent', id: agentId },
                    lastAgentContext: agentId,
                });
                get().addInitialMessage(agentId);
            },

            addInitialMessage: (agentId) => {
                set(produce((draft: AppState) => {
                    const agent = AGENTS[agentId];
                    if (agent?.initialMessage && draft.chatHistories[agentId]?.length === 0) {
                        const initialMessage: Message = {
                            id: `agent-initial-${agentId}`,
                            sender: 'agent',
                            text: agent.initialMessage,
                            timestamp: Date.now()
                        };
                        draft.chatHistories[agentId].push(initialMessage);
                    }
                }));
            },

            handleSendMessage: async (agentId, text) => {
                const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text, timestamp: Date.now() };
                
                set(produce((draft: AppState) => {
                    if (!draft.chatHistories[agentId]) draft.chatHistories[agentId] = [];
                    draft.chatHistories[agentId].push(userMessage);
                    draft.isLoadingMessage = true;
                }));

                try {
                    const history = get().chatHistories[agentId];
                    const agentResponseText = await generateAgentResponse(agentId, history);
                    
                    const agentMessage: Message = { id: `agent-${Date.now()}`, sender: 'agent', text: agentResponseText, timestamp: Date.now() };
                    
                    set(produce((draft: AppState) => {
                        draft.chatHistories[agentId].push(agentMessage);
                    }));

                } catch (error) {
                    const defaultMessage = `Desculpe, não consegui processar sua mensagem com ${AGENTS[agentId].name}.`;
                    const errorText = handleApiError(error, defaultMessage, get().addToast);
                    
                    const errorMessage: Message = { id: `agent-error-${Date.now()}`, sender: 'agent', text: errorText, timestamp: Date.now() };
                    set(produce((draft: AppState) => {
                        draft.chatHistories[agentId].push(errorMessage);
                    }));
                } finally {
                    set({ isLoadingMessage: false });
                }
            },
            
            initDoshaChat: async () => {
                set(produce((draft: AppState) => {
                    draft.isLoadingMessage = true;
                    draft.toolStates.doshaDiagnosis = { messages: [], isFinished: false, error: null };
                }));
                try {
                    const chat = createDoshaChat();
                    const firstMessage = await startDoshaConversation(chat);
                    set(produce((draft: AppState) => {
                        draft.doshaChat = chat as any; // Handle Zustand+Immer+Promise type issue
                        if(draft.toolStates.doshaDiagnosis) {
                            draft.toolStates.doshaDiagnosis.messages.push({
                                id: `agent-${Date.now()}`, sender: 'agent', text: firstMessage, timestamp: Date.now()
                            });
                        }
                    }));
                } catch (error) {
                    const errorMsg = handleApiError(error, "Não foi possível iniciar o diagnóstico. Tente novamente.", get().addToast);
                    set(produce((draft: AppState) => {
                         if(draft.toolStates.doshaDiagnosis) draft.toolStates.doshaDiagnosis.error = errorMsg;
                    }));
                } finally {
                    set({ isLoadingMessage: false });
                }
            },
            
            handleDoshaSendMessage: async (text) => {
                const chat = get().doshaChat;
                if (!chat) return;

                const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text, timestamp: Date.now() };

                set(produce((draft: AppState) => {
                    if(draft.toolStates.doshaDiagnosis) {
                        draft.toolStates.doshaDiagnosis.messages.push(userMessage);
                        draft.isLoadingMessage = true;
                        draft.toolStates.doshaDiagnosis.error = null;
                    }
                }));

                try {
                    const responseText = await continueDoshaConversation(chat, text);
                    const isFinished = responseText.includes("Dissonância Dominante");
                    const agentMessage: Message = { id: `agent-${Date.now()}`, sender: 'agent', text: responseText, timestamp: Date.now() };
                    
                    set(produce((draft: AppState) => {
                        const doshaDiagnosisState = draft.toolStates.doshaDiagnosis;
                        if(doshaDiagnosisState) {
                           doshaDiagnosisState.messages.push(agentMessage);
                           doshaDiagnosisState.isFinished = isFinished;
                           if (isFinished) {
                               const doshaMatch = responseText.match(/Dissonância Dominante \(Desequilíbrio\):\s*(\w+)/i);
                               if (doshaMatch && doshaMatch[1]) {
                                   const dosha = doshaMatch[1] as 'Vata' | 'Pitta' | 'Kapha';
                                   draft.toolStates.doshaResult = dosha;
                                   get().addToast(`Diagnóstico concluído: Desequilíbrio de ${dosha} detectado.`, 'info');
                               }
                           }
                        }
                    }));
                } catch (error) {
                     const errorMsg = handleApiError(error, "Ocorreu um erro ao processar sua resposta. Tente novamente.", get().addToast);
                     set(produce((draft: AppState) => {
                        if(draft.toolStates.doshaDiagnosis) draft.toolStates.doshaDiagnosis.error = errorMsg;
                    }));
                } finally {
                     set({ isLoadingMessage: false });
                }
            },

            initRoutineAlignerChat: async () => {
                set(produce((draft: AppState) => {
                    draft.isLoadingMessage = true;
                    draft.toolStates.routineAligner = { messages: [], isFinished: false, error: null };
                }));
                try {
                    const chat = createRoutineAlignerChat();
                    const doshaResult = get().toolStates.doshaResult;
                    const firstMessage = await startRoutineAlignerConversation(chat, doshaResult);
                    set(produce((draft: AppState) => {
                        draft.routineAlignerChat = chat as any;
                        if(draft.toolStates.routineAligner) {
                            draft.toolStates.routineAligner.messages.push({
                                id: `agent-${Date.now()}`, sender: 'agent', text: firstMessage, timestamp: Date.now()
                            });
                        }
                    }));
                } catch (error) {
                    const errorMsg = handleApiError(error, "Não foi possível iniciar o alinhador. Tente novamente.", get().addToast);
                    set(produce((draft: AppState) => {
                         if(draft.toolStates.routineAligner) draft.toolStates.routineAligner.error = errorMsg;
                    }));
                } finally {
                    set({ isLoadingMessage: false });
                }
            },
            
            handleRoutineAlignerSendMessage: async (text) => {
                const chat = get().routineAlignerChat;
                if (!chat) return;

                const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text, timestamp: Date.now() };

                set(produce((draft: AppState) => {
                    if(draft.toolStates.routineAligner) {
                        draft.toolStates.routineAligner.messages.push(userMessage);
                        draft.isLoadingMessage = true;
                        draft.toolStates.routineAligner.error = null;
                    }
                }));

                try {
                    const responseText = await continueRoutineAlignerConversation(chat, text);
                    const isFinished = responseText.includes("esta rotina é um algoritmo, não uma prisão");
                    const agentMessage: Message = { id: `agent-${Date.now()}`, sender: 'agent', text: responseText, timestamp: Date.now() };
                    
                    set(produce((draft: AppState) => {
                        if(draft.toolStates.routineAligner) {
                           draft.toolStates.routineAligner.messages.push(agentMessage);
                           draft.toolStates.routineAligner.isFinished = isFinished;
                        }
                    }));
                } catch (error) {
                     const errorMsg = handleApiError(error, "Ocorreu um erro ao processar sua resposta. Tente novamente.", get().addToast);
                     set(produce((draft: AppState) => {
                        if(draft.toolStates.routineAligner) draft.toolStates.routineAligner.error = errorMsg;
                    }));
                } finally {
                     set({ isLoadingMessage: false });
                }
            },
            
            setToolState: (toolId, state) => {
                set(produce((draft: AppState) => {
                    draft.toolStates[toolId] = state as any;
                }));
            },

            addToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
                const id = `toast-${Date.now()}`;
                const newToast: ToastMessage = { id, message, type };
                set(state => ({ toasts: [...state.toasts, newToast] }));
            },

            removeToast: (id) => {
                set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
            },

            closeOnboarding: () => set({ isOnboardingVisible: false }),

            addSchedule: (schedule) => {
                const newSchedule: Schedule = {
                    ...schedule,
                    id: `schedule-${Date.now()}`,
                    status: 'scheduled',
                };
                set(produce((draft: AppState) => {
                    draft.schedules.push(newSchedule);
                }));
                get().addToast(`Sessão agendada para ${new Date(schedule.time).toLocaleString()}`, 'success');
            },
            
            updateScheduleStatus: (scheduleId, status) => {
                set(produce((draft: AppState) => {
                    const schedule = draft.schedules.find(s => s.id === scheduleId);
                    if (schedule) {
                        schedule.status = status;
                    }
                }));
            },
            
            updateUsvDimensions: (updates) => {
                set(produce((draft: AppState) => {
                    if (updates.physical !== undefined) {
                        draft.usv.physical = Math.max(0, Math.min(100, updates.physical));
                    }
                    if (updates.emotional !== undefined) {
                        draft.usv.emotional = Math.max(0, Math.min(100, updates.emotional));
                    }
                }));
            },

            goBackToAgentRoom: () => {
                const lastAgentId = get().lastAgentContext;
                if (lastAgentId) {
                    get().startSession({ type: 'agent', id: lastAgentId });
                } else {
                    // Fallback: if there's no context, just end the session.
                    get().endSession();
                }
            },
        }),
        {
            name: 'coherence-hub-storage',
            // Do not persist chat objects
            partialize: (state) =>
                Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['doshaChat', 'routineAlignerChat'].includes(key))
                ),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Recalculate derived state on rehydration
                    const ucs = calculateUcs(state.usv);
                    const recommendation = getRecommendation(state.usv);
                    state.ucs = ucs;
                    state.recommendation = recommendation;
                }
            },
        }
    )
);

// Update derived state whenever USV changes
useStore.subscribe(
    (state, prevState) => {
        if (state.usv !== prevState.usv) {
            const newUcs = calculateUcs(state.usv);
            const newRecommendation = getRecommendation(state.usv);
            useStore.setState({ ucs: newUcs, recommendation: newRecommendation });
        }
    }
);