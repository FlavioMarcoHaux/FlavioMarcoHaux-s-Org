import React, { useState } from 'react';
import { analyzeJournalEntry } from '../services/geminiJournalService.ts';
import { JournalFeedback } from '../types.ts';
import { X, BookHeart, Loader2, Send } from 'lucide-react';
import { useStore } from '../store.ts';
import { getFriendlyErrorMessage } from '../utils/errorUtils.ts';

interface TherapeuticJournalProps {
    onExit: () => void;
}

const TherapeuticJournal: React.FC<TherapeuticJournalProps> = ({ onExit }) => {
    const { toolStates, setToolState, goBackToAgentRoom } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    
    const journalState = toolStates.therapeuticJournal;
    const entry = journalState?.entry || '';
    const feedback = journalState?.feedback || null;
    const error = journalState?.error || null;

    const setEntry = (newEntry: string) => {
        setToolState('therapeuticJournal', { ...journalState, entry: newEntry });
    }

    const handleAnalyze = async () => {
        if (!entry.trim()) return;
        setIsLoading(true);
        setToolState('therapeuticJournal', { entry, feedback: null, error: null });

        try {
            const analysisResult = await analyzeJournalEntry(entry);
            setToolState('therapeuticJournal', { entry, feedback: analysisResult, error: null });
        } catch (err) {
            const errorMsg = getFriendlyErrorMessage(err, 'Ocorreu um erro desconhecido durante a análise.');
            setToolState('therapeuticJournal', { entry, feedback: null, error: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setToolState('therapeuticJournal', { entry: '', feedback: null, error: null });
        setIsLoading(false);
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <BookHeart className="w-8 h-8 text-indigo-400" />
                    <h1 className="text-xl font-bold text-gray-200">Diário Terapêutico</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBackToAgentRoom}
                        className="text-gray-300 hover:text-white transition-colors text-sm font-semibold py-1 px-3 rounded-md border border-gray-600 hover:border-gray-400"
                        aria-label="Voltar para o Mentor"
                    >
                        Voltar
                    </button>
                    <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Exit Therapeutic Journal">
                        <X size={24} />
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                        <p className="text-gray-300 mt-4">Analisando suas reflexões...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-400 p-4">
                        <h3 className="font-bold mb-2">Erro na Análise:</h3>
                        <p>{error}</p>

                        <button onClick={handleAnalyze} className="mt-4 bg-gray-600 text-white font-bold py-2 px-6 rounded-full">
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {!isLoading && feedback && (
                     <div className="animate-fade-in max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-100">Feedback do seu Mentor</h2>
                        <div className="space-y-4">
                           <div className="p-4 bg-gray-800 rounded-lg">
                               <h3 className="font-semibold text-lg text-gray-300">Observação do Coração:</h3>
                               <p className="text-gray-400 mt-1">{feedback.observacao}</p>
                           </div>
                            <div className="p-4 bg-gray-800 rounded-lg">
                               <h3 className="font-semibold text-lg text-gray-300">O Ponto de Dissonância:</h3>
                               <p className="text-gray-400 mt-1">{feedback.dissonancia}</p>
                           </div>
                           <div className="p-4 bg-indigo-900/50 border border-indigo-700 rounded-lg">
                               <h3 className="font-semibold text-lg text-indigo-300">Ação de Coerência:</h3>
                               <p className="text-indigo-200 mt-1">{feedback.acao}</p>
                           </div>
                        </div>
                        <div className="text-center mt-6">
                            <button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full">
                                Escrever Nova Entrada
                            </button>
                        </div>
                    </div>
                )}

                {!isLoading && !feedback && (
                    <div className="max-w-3xl mx-auto">
                        <p className="text-center text-lg text-gray-400 mb-6">
                            Escreva sobre seu dia, seus sentimentos ou um sonho. Seu mentor oferecerá um insight para aumentar sua coerência.
                        </p>
                        <textarea
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                            placeholder="Comece a escrever aqui..."
                            className="w-full h-64 bg-gray-800/80 border border-gray-600 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/80 text-lg"
                        />
                        <div className="text-center mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={!entry.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-colors text-lg flex items-center justify-center mx-auto"
                            >
                                <Send size={20} className="mr-2" />
                                Salvar e Analisar
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TherapeuticJournal;