import React, { useState, useEffect } from 'react';
import { analyzeDissonance } from '../services/geminiDissonanceService.ts';
import { DissonanceAnalysisResult, AgentId } from '../types.ts';
import { X, HeartPulse, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../store.ts';

interface DissonanceAnalyzerProps {
    onExit: () => void;
}

const DissonanceAnalyzer: React.FC<DissonanceAnalyzerProps> = ({ onExit }) => {
    const chatHistory = useStore(state => state.chatHistories[AgentId.COHERENCE] || []);
    const [result, setResult] = useState<DissonanceAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysisResult = await analyzeDissonance(chatHistory);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante a análise.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (chatHistory.length > 1) {
            handleAnalyze();
        }
    }, []);

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <HeartPulse className="w-8 h-8 text-indigo-400" />
                    <h1 className="text-xl font-bold text-gray-200">Analisador de Dissonância</h1>
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Exit Dissonance Analyzer">
                    <X size={24} />
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
                {isLoading && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                        <p className="text-gray-300 mt-4">Analisando sua conversa em busca de padrões...</p>
                    </>
                )}

                {error && (
                    <div className="text-red-400 p-4">
                        <h3 className="font-bold mb-2">Erro na Análise:</h3>
                        <p>{error}</p>
                        <button onClick={handleAnalyze} className="mt-4 bg-gray-600 text-white font-bold py-2 px-6 rounded-full">
                            Tentar Novamente
                        </button>
                    </div>
                )}
                
                {!isLoading && !result && !error && (
                    <div className="max-w-xl">
                        <p className="text-lg text-gray-400 mb-6">Sua conversa com o mentor pode revelar padrões de pensamento e crenças limitantes. Vamos analisá-la.</p>
                        <button onClick={handleAnalyze} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg">Analisar Conversa</button>
                    </div>
                )}

                {result && (
                    <div className="animate-fade-in w-full max-w-2xl space-y-6">
                        <div className="glass-pane p-6 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tema Emocional Central</h3>
                            <p className="text-xl text-gray-100 mt-2">{result.tema}</p>
                        </div>
                        <div className="glass-pane p-6 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Padrão de Dissonância</h3>
                            <p className="text-xl text-gray-100 mt-2">{result.padrao}</p>
                        </div>
                        <div className="bg-indigo-900/50 border border-indigo-700 p-6 rounded-lg">
                            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-2"><Sparkles size={16}/> Insight Terapêutico</h3>
                            <p className="text-lg text-indigo-200 mt-2">{result.insight}</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DissonanceAnalyzer;
