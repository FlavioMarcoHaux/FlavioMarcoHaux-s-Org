import React, { useState, useCallback } from 'react';
import { analyzeContentWithPIC } from '../services/geminiContentService.ts';
import { readFileAsBase64 } from '../utils/fileUtils.ts';
import { Message, AgentId } from '../types.ts';
import { X, ScanText, Loader2, UploadCloud, FileText, Send, Trash2 } from 'lucide-react';
import { useStore } from '../store.ts';

interface ContentAnalyzerProps {
    onExit: () => void;
}

const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({ onExit }) => {
    const { chatHistories } = useStore();
    
    const [text, setText] = useState('');
    const [file, setFile] = useState<{ data: string; mimeType: string; name: string; } | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            try {
                setIsLoading(true);
                const { data, mimeType } = await readFileAsBase64(selectedFile);
                setFile({ data, mimeType, name: selectedFile.name });
            } catch (err) {
                setError("Falha ao carregar o arquivo.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!text.trim() && !file) {
            setError("Por favor, forneça um texto ou um arquivo para análise.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const relevantChatHistory = [
                ...(chatHistories[AgentId.COHERENCE] || []),
                ...(chatHistories[AgentId.SELF_KNOWLEDGE] || [])
            ];
            const analysisResult = await analyzeContentWithPIC({ text, file: file || undefined }, relevantChatHistory);
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante a análise.');
        } finally {
            setIsLoading(false);
        }
    }, [text, file, chatHistories]);

    const handleReset = () => {
        setText('');
        setFile(null);
        setResult(null);
        setError(null);
        setIsLoading(false);
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <ScanText className="w-8 h-8 text-indigo-400" />
                    <h1 className="text-xl font-bold text-gray-200">Analisador Consciente</h1>
                </div>
                <button
                    onClick={onExit}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Exit Content Analyzer"
                >
                    <X size={24} />
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {isLoading && !result && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                        <p className="text-gray-300 mt-4">Analisando conteúdo sob a ótica do PIC...</p>
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

                {!isLoading && result && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-100">Análise pelo Princípio da Informação Consciente</h2>
                        <div className="p-6 bg-gray-900/50 rounded-lg max-h-[60vh] overflow-y-auto no-scrollbar">
                            <p className="whitespace-pre-wrap text-gray-300 leading-relaxed text-lg">{result}</p>
                        </div>
                        <div className="text-center mt-6">
                            <button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full">
                                Analisar Outro Conteúdo
                            </button>
                        </div>
                    </div>
                )}

                {!isLoading && !result && (
                    <div className="max-w-3xl mx-auto">
                        <p className="text-center text-lg text-gray-400 mb-6">
                            Forneça um texto, um arquivo (imagem, áudio, etc.) ou ambos para analisá-los através das lentes do Princípio da Informação Consciente (PIC).
                        </p>

                        <div className="space-y-4">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Cole seu texto aqui..."
                                className="w-full h-40 bg-gray-800/80 border border-gray-600 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/80 text-lg"
                                rows={5}
                            />

                            {!file ? (
                                <label className="w-full flex flex-col items-center justify-center h-32 text-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800/50">
                                    <UploadCloud className="w-10 h-10 text-gray-500 mb-2" />
                                    <span className="text-gray-400">Arraste um arquivo ou clique para carregar</span>
                                    <input type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-gray-300" />
                                        <span className="text-gray-300">{file.name}</span>
                                    </div>
                                    <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="text-center mt-6">
                            <button
                                onClick={handleAnalyze}
                                disabled={!text.trim() && !file}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-colors text-lg flex items-center justify-center mx-auto"
                            >
                                <Send size={20} className="mr-2" />
                                Analisar Agora
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ContentAnalyzer;
