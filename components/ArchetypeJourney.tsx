// components/ArchetypeJourney.tsx
import React, { useState } from 'react';
import { analyzeNarrative } from '../services/geminiArchetypeService.ts';
import { ArchetypeAnalysisResult } from '../types.ts';
import { X, Map, Loader2, Send, Sparkles } from 'lucide-react';

interface ArchetypeJourneyProps {
    onExit: () => void;
}

const ArchetypeJourney: React.FC<ArchetypeJourneyProps> = ({ onExit }) => {
    const [narrative, setNarrative] = useState('');
    const [feedback, setFeedback] = useState<ArchetypeAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!narrative.trim()) return;
        setIsLoading(true);
        setError(null);
        setFeedback(null);

        try {
            const analysisResult = await analyzeNarrative(narrative);
            setFeedback(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante a análise.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setNarrative('');
        setFeedback(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Map className="w-8 h-8 text-purple-400" />
                    <h1 className="text-xl font-bold text-gray-200">Jornada do Arquétipo</h1>
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Exit Archetype Journey">
                    <X size={24} />
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                        <p className="text-gray-300 mt-4">Mapeando sua jornada...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-400 p-4">
                        <h3 className="font-bold mb-2">Erro na Análise:</h3>
                        <p>{error}</p>
                        <button onClick={handleReset} className="mt-4 bg-gray-600 text-white font-bold py-2 px-6 rounded-full">
                            Tentar Novamente
                        </button>
                    </div>
                )}

                {!isLoading && feedback && (
                     <div className="animate-fade-in max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-100">Seu Insight Mitológico</h2>
                        <div className="space-y-4">
                           <div className="p-4 bg-gray-800 rounded-lg">
                               <h3 className="font-semibold text-lg text-gray-300">A Lente Arquetípica:</h3>
                               <p className="text-gray-400 mt-1">{feedback.lente}</p>
                           </div>
                            <div className="p-4 bg-gray-800 rounded-lg">
                               <h3 className="font-semibold text-lg text-gray-300">A Dissonância e o Potencial:</h3>
                               <p className="text-gray-400 mt-1">{feedback.dissonancia}</p>
                           </div>
                           <div className="p-4 bg-purple-900/50 border border-purple-700 rounded-lg">
                               <h3 className="font-semibold text-lg text-purple-300 flex items-center gap-2"><Sparkles size={16}/> O Próximo Passo do Herói:</h3>
                               <p className="text-purple-200 mt-1">{feedback.passo}</p>
                           </div>
                        </div>
                        <div className="text-center mt-6">
                            <button onClick={handleReset} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full">
                                Analisar Outro Desafio
                            </button>
                        </div>
                    </div>
                )}

                {!isLoading && !feedback && (
                    <div className="max-w-3xl mx-auto">
                        <p className="text-center text-lg text-gray-400 mb-6">
                            Descreva um desafio ou uma situação atual em sua vida. O Arquiteto irá revelar a jornada mítica por trás da sua experiência.
                        </p>
                        <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder="Ex: 'Sinto que estou paralisado em minha carreira e não sei qual direção tomar...'"
                            className="w-full h-48 bg-gray-800/80 border border-gray-600 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/80 text-lg"
                        />
                        <div className="text-center mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={!narrative.trim()}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-colors text-lg flex items-center justify-center mx-auto"
                            >
                                <Send size={20} className="mr-2" />
                                Analisar Minha Jornada
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArchetypeJourney;