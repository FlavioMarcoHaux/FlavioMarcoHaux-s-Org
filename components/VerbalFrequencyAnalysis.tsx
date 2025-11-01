import React, { useState, useEffect } from 'react';
import { analyzeVerbalFrequency } from '../services/geminiVerbalFrequencyService.ts';
import { VerbalFrequencyAnalysisResult, AgentId } from '../types.ts';
import { X, Waves, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../store.ts';

interface VerbalFrequencyAnalysisProps {
    onExit: () => void;
}

const VerbalFrequencyAnalysis: React.FC<VerbalFrequencyAnalysisProps> = ({ onExit }) => {
    const { chatHistories } = useStore();
    const chatHistory = [
        ...(chatHistories[AgentId.COHERENCE] || []),
        ...(chatHistories[AgentId.SELF_KNOWLEDGE] || [])
    ];
    
    const [result, setResult] = useState<VerbalFrequencyAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysisResult = await analyzeVerbalFrequency(chatHistory);
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
    }, [chatHistory.length]);

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Waves className="w-8 h-8 text-purple-400" />
                    <h1 className="text-xl font-bold text-gray-200">Análise de Frequência Verbal</h1>
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Exit Verbal Frequency Analysis">
                    <X size={24} />
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
                {isLoading && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                        <p className="text-gray-300 mt-4">Medindo a frequência da sua conversa...</p>
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
                
                {!isLoading && !result && !error && chatHistory.length <= 1 && (
                    <div className="max-w-xl">
                        <p className="text-lg text-gray-400 mb-6">Esta ferramenta analisa a frequência emocional de uma conversa. Inicie um diálogo com um mentor para ativá-la.</p>
                         <button onClick={onExit} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg">Voltar</button>
                    </div>
                )}

                {result && (
                    <div className="animate-fade-in w-full max-w-2xl space-y-6">
                        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                            <div className={`absolute inset-0 bg-purple-500/10 rounded-full animate-ping`}></div>
                            <div className={`absolute inset-2 bg-purple-500/20 rounded-full`}></div>
                            <span className="text-7xl font-bold text-purple-300">{result.coerencia_score}</span>
                            <span className="absolute bottom-4 text-sm text-purple-400">/ 10</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-100">Frequência Detectada: {result.frequencia_detectada}</h2>
                        
                        <div className="glass-pane p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Insight Imediato</h3>
                            <p className="text-lg text-gray-200 mt-2">{result.insight_imediato}</p>
                        </div>
                        
                        <div className="bg-purple-900/50 border border-purple-700 p-4 rounded-lg">
                             <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider flex items-center justify-center gap-2"><Sparkles size={16}/> Ação de Coerência Recomendada (PAC)</h3>
                             <p className="text-lg text-purple-200 mt-2">Para elevar sua coerência, sugerimos a ferramenta: <strong className="font-bold">{result.acao_pac_recomendada}</strong></p>
                        </div>
                        
                        <p className="text-gray-500 italic">"{result.mensagem_guia}"</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VerbalFrequencyAnalysis;
