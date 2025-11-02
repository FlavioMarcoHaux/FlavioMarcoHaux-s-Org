import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import AgentDirectory from './components/AgentDirectory.tsx';
import ToolsDirectory from './components/ToolsDirectory.tsx';
import AgentRoom from './components/AgentRoom.tsx';
import GuidedMeditation from './components/GuidedMeditation.tsx';
import ContentAnalyzer from './components/ContentAnalyzer.tsx';
import GuidedPrayer from './components/GuidedPrayer.tsx';
import PrayerPills from './components/PrayerPills.tsx';
import DissonanceAnalyzer from './components/DissonanceAnalyzer.tsx';
import TherapeuticJournal from './components/TherapeuticJournal.tsx';
import QuantumSimulator from './components/QuantumSimulator.tsx';
import PhiFrontierRadar from './components/PhiFrontierRadar.tsx';
import DoshaDiagnosis from './components/DoshaDiagnosis.tsx';
import WellnessVisualizer from './components/WellnessVisualizer.tsx';
import BeliefResignifier from './components/BeliefResignifier.tsx';
import EmotionalSpendingMap from './components/EmotionalSpendingMap.tsx';
import RiskCalculator from './components/RiskCalculator.tsx';
import ArchetypeJourney from './components/ArchetypeJourney.tsx';
import LiveConversation from './components/LiveConversation.tsx';
import Onboarding from './components/Onboarding.tsx';
import Toast from './components/Toast.tsx';
import Scheduler from './components/Scheduler.tsx';
import ScheduledSessionHandler from './components/ScheduledSessionHandler.tsx';
import GuidedMeditationVoice from './components/GuidedMeditationVoice.tsx';
import RoutineAligner from './components/RoutineAligner.tsx';
import ApiKeyWrapper from './components/ApiKeyWrapper.tsx'; // Import the wrapper
import { useStore } from './store.ts';
import { AGENTS, toolMetadata } from './constants.tsx';
// FIX: Import the missing 'VerbalFrequencyAnalysis' component to resolve a reference error.
import VerbalFrequencyAnalysis from './components/VerbalFrequencyAnalysis.tsx';

const App: React.FC = () => {
    const { 
        currentSession, 
        endSession, 
        toasts, 
        removeToast, 
        isOnboardingVisible,
        closeOnboarding,
        activeView
    } = useStore();
    
    // Proactive check for scheduled sessions
    useEffect(() => {
        const checkSchedulesInterval = setInterval(() => {
            const { currentSession, schedules, updateScheduleStatus, startSession, addToast } = useStore.getState();
            
            if (currentSession) return;

            const now = Date.now();
            const dueSchedule = schedules.find(s => s.status === 'scheduled' && s.time <= now);
            
            if (dueSchedule) {
                updateScheduleStatus(dueSchedule.id, 'completed');
                const activityName = toolMetadata[dueSchedule.activity]?.title || 'sessão';
                addToast(`Seu mentor está ligando para a sua ${activityName}.`, 'info');
                startSession({ type: 'scheduled_session_handler', schedule: dueSchedule });
            }
        }, 5000);

        return () => clearInterval(checkSchedulesInterval);
    }, []);


    const renderView = () => {
        switch (activeView) {
            case 'agents':
                return <AgentDirectory />;
            case 'tools':
                return <ToolsDirectory />;
            case 'dashboard':
            default:
                return <Dashboard />;
        }
    };

    const renderSession = () => {
        if (!currentSession) return null;

        const sessionProps = { onExit: endSession };

        const wrapInApiKeyCheck = (component: React.ReactNode) => (
            <ApiKeyWrapper>{component}</ApiKeyWrapper>
        );

        switch (currentSession.type) {
            case 'agent':
                const agent = AGENTS[currentSession.id];
                if (!agent) return null;
                return wrapInApiKeyCheck(<AgentRoom agent={agent} {...sessionProps} />);
            case 'meditation':
                return wrapInApiKeyCheck(<GuidedMeditation {...sessionProps} />);
            case 'content_analyzer':
                return wrapInApiKeyCheck(<ContentAnalyzer {...sessionProps} />);
            case 'guided_prayer':
                return wrapInApiKeyCheck(<GuidedPrayer {...sessionProps} />);
            case 'prayer_pills':
                return wrapInApiKeyCheck(<PrayerPills {...sessionProps} />);
            case 'dissonance_analyzer':
                return wrapInApiKeyCheck(<DissonanceAnalyzer {...sessionProps} />);
            case 'therapeutic_journal':
                return wrapInApiKeyCheck(<TherapeuticJournal {...sessionProps} />);
            case 'quantum_simulator':
                return wrapInApiKeyCheck(<QuantumSimulator {...sessionProps} />);
            case 'phi_frontier_radar':
                // This tool doesn't use the API, so it doesn't need the wrapper.
                return <PhiFrontierRadar {...sessionProps} />;
            case 'dosha_diagnosis':
                return wrapInApiKeyCheck(<DoshaDiagnosis {...sessionProps} />);
            case 'wellness_visualizer':
                // This tool doesn't use the API.
                return <WellnessVisualizer {...sessionProps} />;
            case 'routine_aligner':
                return wrapInApiKeyCheck(<RoutineAligner {...sessionProps} />);
            case 'belief_resignifier':
                 // This tool is currently mocked, but will need the wrapper when implemented.
                return <BeliefResignifier {...sessionProps} />;
            case 'emotional_spending_map':
                // This is a placeholder.
                return <EmotionalSpendingMap {...sessionProps} />;
            case 'risk_calculator':
                 // This tool is currently mocked, but will need the wrapper when implemented.
                return <RiskCalculator {...sessionProps} />;
            case 'archetype_journey':
                return wrapInApiKeyCheck(<ArchetypeJourney {...sessionProps} />);
            case 'verbal_frequency_analysis':
                return wrapInApiKeyCheck(<VerbalFrequencyAnalysis {...sessionProps} />);
            case 'live_conversation':
                return wrapInApiKeyCheck(<LiveConversation {...sessionProps} />);
            case 'scheduled_session':
                 // Scheduler itself doesn't need a key, but the handler will.
                return <Scheduler {...sessionProps} />;
            case 'scheduled_session_handler':
                return wrapInApiKeyCheck(<ScheduledSessionHandler schedule={currentSession.schedule} {...sessionProps} />);
             case 'guided_meditation_voice':
                return wrapInApiKeyCheck(<GuidedMeditationVoice schedule={currentSession.schedule} {...sessionProps} />);
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-gray-900 text-white font-sans w-screen h-screen overflow-hidden flex">
             <Onboarding show={isOnboardingVisible} onClose={closeOnboarding} />
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto relative no-scrollbar">
                {renderView()}
            </main>
            
            {currentSession && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in">
                    <div className="w-full h-full max-w-7xl max-h-[90vh] my-auto">
                         {renderSession()}
                    </div>
                </div>
            )}
            
             {/* Toast Container */}
            <div className="fixed top-5 right-5 z-[101] w-full max-w-sm space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </div>
    );
};

export default App;