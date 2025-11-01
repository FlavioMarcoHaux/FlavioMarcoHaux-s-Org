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
        { key: AgentId.SELF_KNOWLEDGE, value: (usv.spiritual + (100 - usv.emotional)) / 2 } // Self-knowledge is a mix
    ];
    // Find the dimension with the lowest score
    const lowest = dimensions.sort((a, b) => a.value - b.value)[0];
    return lowest.key;
};

interface AppState {
    usv: UserStateVector;
    ucs: number;
    recommendation: AgentId | null;
    activeView: View;
    currentSession: Session | null;
    chatHistories: Record<AgentId, Message[]>;
    isLoadingMessage: boolean;
    toolStates: ToolStates;
    toasts: ToastMessage[];
    doshaChat: Chat | null;
    isOnboardingVisible: boolean;
    schedules: Schedule[];

    // Actions
    setView: (view: View) => void;
    startSession: (session: Session) => void;
    endSession: () => void;
    switchAgent: (agentId: AgentId) => void;
    handleSendMessage: (agentId: AgentId, text: string) => Promise<void>;
    handleDoshaSendMessage: (text: string) => Promise<void>;
    initDoshaChat: () => Promise<void>;
    setToolState: <T extends keyof ToolStates>(toolId: T, state: ToolStates[T]) => void;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
    closeOnboarding: () => void;
    addSchedule: (schedule: Omit<Schedule, 'id' | 'status'>) => void;
    updateScheduleStatus: (scheduleId: string, status: Schedule['status']) => void;
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
            },
            toasts: [],
            doshaChat: null,
            isOnboardingVisible: true,
            schedules: [],

            // Actions
            setView: (view) => set({ activeView: view }),

            startSession: (session) => {
                if (session.type === 'dosha_diagnosis' && !get().doshaChat) {
                    get().initDoshaChat();
                }
                set({ currentSession: session });
            },

            endSession: () => set({ currentSession: null }),
            
            switchAgent: (agentId) => set({ currentSession: { type: 'agent', id: agentId } }),

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
                    console.error("Error sending message:", error);
                    const errorMessage: Message = { id: `agent-error-${Date.now()}`, sender: 'agent', text: 'Desculpe, não consegui processar sua mensagem. Tente novamente.', timestamp: Date.now() };
                    set(produce((draft: AppState) => {
                        draft.chatHistories[agentId].push(errorMessage);
                    }));
                    get().addToast('Erro ao se comunicar com o mentor.', 'error');
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
                    const errorMsg = error instanceof Error ? error.message : "Failed to start session.";
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
                        if(draft.toolStates.doshaDiagnosis) {
                           draft.toolStates.doshaDiagnosis.messages.push(agentMessage);
                           draft.toolStates.doshaDiagnosis.isFinished = isFinished;
                        }
                    }));
                } catch (error) {
                     const errorMsg = error instanceof Error ? error.message : "Failed to send message.";
                     set(produce((draft: AppState) => {
                        if(draft.toolStates.doshaDiagnosis) draft.toolStates.doshaDiagnosis.error = errorMsg;
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
        }),
        {
            name: 'coherence-hub-storage',
            // Do not persist the chat object
            partialize: (state) =>
                Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['doshaChat'].includes(key))
                ),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Recalculate derived state on rehydration
                    const ucs = calculateUcs(state.usv);
                    const recommendation = getRecommendation(state.usv);
                    state.ucs = ucs;
                    state.recommendation = recommendation;
                    // Ensure schedules are not reset on rehydration
                    // The persisted state will automatically be merged.
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