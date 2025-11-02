import React, { useState, useMemo, useEffect } from 'react';
import { generatePrayerPill } from '../services/geminiPrayerPillsService.ts';
import { generateSpeech } from '../services/geminiTtsService.ts';
import { generateImage } from '../services/geminiImagenService.ts';
import { useStore } from '../store.ts';
import { UserStateVector, AgentId } from '../types.ts';
import { decode, encodeWAV } from '../utils/audioUtils.ts';
import { getFriendlyErrorMessage } from '../utils/errorUtils.ts';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface PrayerPillsProps {
    onExit: () => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const getPrayerSuggestions = (usv: UserStateVector): string[] => {
    const suggestions: { key: keyof UserStateVector | 'emotional_inverted', value: number, themes: string[] }[] = [
        { key: 'spiritual', value: usv.spiritual, themes: ["Conexão espiritual", "Propósito"] },
        { key: 'emotional_inverted', value: 100 - usv.emotional, themes: ["Paz interior", "Aliviar ansiedade"] },
        { key: 'physical', value: usv.physical, themes: ["Cura e saúde", "Força"] },
        { key: 'financial', value: usv.financial, themes: ["Prosperidade", "Gratidão"] },
    ];
    const sortedStates = suggestions.sort((a, b) => a.value - b.value);
    const finalSuggestions = new Set<string>();
    sortedStates.forEach(state => {
        state.themes.forEach(theme => finalSuggestions.add(theme));
    });
    return Array.from(finalSuggestions).slice(0, 4);
};

const PrayerPills: React.FC<PrayerPillsProps> = ({ onExit }) => {
    const { usv, chatHistories, lastAgentContext, goBackToAgentRoom } = useStore(state => ({
        usv: state.usv,
        chatHistories: state.chatHistories,
        lastAgentContext: state.lastAgentContext,
        goBackToAgentRoom: state.goBackToAgentRoom,
    }));
    const agentIdForContext = lastAgentContext ?? AgentId.COHERENCE;
    const chatHistory = chatHistories[agentIdForContext];

    const [theme, setTheme] = useState('');
    const [pill, setPill] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioData, setAudioData] = useState<{ url: string; error: string | null }>({ url: '', error: null });
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageData, setImageData] = useState<{ url: string; error: string | null }>({ url: '', error: null });
    const [imageAspectRatio, setImageAspectRatio] = useState<AspectRatio>('1:1');

    const suggestions = useMemo(() => getPrayerSuggestions(usv), [usv]);

     useEffect(() => {
        return () => {
            if (audioData.url.startsWith('blob:')) {
                URL.revokeObjectURL(audioData.url);
            }
        };
    }, [audioData.url]);

    const handleGenerate = async (inputTheme: string) => {
        if (!inputTheme.trim()) return;
        setTheme(inputTheme);
        setIsLoading(true);
        setError(null);
        setPill('');
        setAudioData({ url: '', error: null });
        setImageData({ url: '', error: null });
        window.scrollTo(0, 0);
        try {
            const result = await generatePrayerPill(inputTheme, chatHistory);
            setPill(result);
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err, "Falha ao gerar a pílula de oração.");
            setError(friendlyError);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateRandom = () => {
        const randomTheme = "um tema universal de fé e esperança, escolhido para mim neste momento";
        setTheme('');
        handleGenerate(randomTheme);
    };

    const handleGenerateAudio = async () => {
        if (!pill) return;
        setIsGeneratingAudio(true);
        setAudioData({ url: '', error: null });
        try {
            const result = await generateSpeech(pill, 'Kore');
            if (result) {
                const pcmBytes = decode(result.data);
                const wavBlob = encodeWAV(pcmBytes, 24000, 1, 16);
                const wavUrl = URL.createObjectURL(wavBlob);
                setAudioData({ url: wavUrl, error: null });
            } else {
                throw new Error("A geração de áudio não retornou dados.");
            }
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err, "Falha ao gerar áudio.");
            setAudioData({ url: '', error: friendlyError });
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!pill) return;
        setIsGeneratingImage(true);
        setImageData({ url: '', error: null });
        try {
            const imagePrompt = `Gere uma imagem fotorrealista, serena e inspiradora para a seguinte oração curta em português: "${pill}"`;
            const result = await generateImage(imagePrompt, imageAspectRatio);
            setImageData({ url: result, error: null });
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err, "Falha ao gerar imagem.");
            setImageData({ url: '', error: friendlyError });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <h1 className="text-xl font-bold text-gray-200">Pílulas de Oração</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBackToAgentRoom}
                        className="text-gray-300 hover:text-white transition-colors text-sm font-semibold py-1 px-3 rounded-md border border-gray-600 hover:border-gray-400"
                        aria-label="Voltar para o Mentor"
                    >
                        Voltar
                    </button>
                    <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Exit Prayer Pills"><X size={24} /></button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-2 sm:p-6 no-scrollbar">
                 <div className="max-w-3xl mx-auto text-center">
                    <p className="text-gray-400 mt-2">Receba uma dose rápida de inspiração. Deixe a oração escolher um tema universal para você, ou defina sua própria intenção.</p>
                    <div className="my-6"><button onClick={handleGenerateRandom} disabled={isLoading} className="w-full max-w-sm mx-auto bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">Dose Rápida</button></div>
                    <div className="flex items-center my-6"><div className="flex-grow border-t border-gray-600"></div><span className="flex-shrink mx-4 text-gray-500">ou</span><div className="flex-grow border-t border-gray-600"></div></div>
                    <div className="space-y-4">
                        <label htmlFor="theme-input" className="block text-gray-300">Defina sua intenção:</label>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <input id="theme-input" type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="ex: 'força' ou 'gratidão'" className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 text-base" disabled={isLoading} />
                            <button onClick={() => handleGenerate(theme)} disabled={isLoading || !theme.trim()} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex-shrink-0">Gerar Pílula</button>
                        </div>
                    </div>
                    <div className="my-6">
                        <h3 className="text-sm text-gray-400 mb-3">Ou comece com uma sugestão:</h3>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {suggestions.map(suggestion => (<button key={suggestion} onClick={() => handleGenerate(suggestion)} disabled={isLoading} className="px-4 py-2 bg-gray-700/80 border border-gray-600/90 text-gray-300 rounded-full text-sm hover:bg-gray-600/80 hover:border-cyan-500/50 transition-colors disabled:opacity-50"><Sparkles className="inline w-4 h-4 mr-2 text-cyan-500/80" />{suggestion}</button>))}
                        </div>
                    </div>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </div>

                {isLoading && (<div className="text-center my-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-cyan-500 mx-auto"></div><p className="text-gray-400 mt-4">Gerando sua pílula...</p></div>)}

                {pill && !isLoading && (
                    <div className="animate-fade-in mt-10 max-w-3xl mx-auto border-t border-gray-700 pt-8">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">Sua Pílula de Oração</h2>
                        <div className="bg-gray-800/50 p-4 rounded-lg"><p className="whitespace-pre-wrap text-gray-200 leading-relaxed text-center text-xl">{pill}</p></div>
                         <div className="mt-10 border-t border-gray-700 pt-8">
                            <h3 className="text-xl font-bold text-center mb-6 text-gray-300">Opções de Geração</h3>
                            <div className="space-y-8 p-6 glass-pane rounded-lg">
                                <div>
                                    <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full max-w-xs mx-auto bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800/50 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                                        {isGeneratingAudio && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Gerar Áudio
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2 text-center">A geração de áudio é uma operação gratuita para este modelo.</p>
                                    {audioData.error && <p className="text-red-400 text-center mt-2">{audioData.error}</p>}
                                    {audioData.url && <audio controls src={audioData.url} className="w-full mt-4" />}
                                </div>
                                <div>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <div>
                                            <label htmlFor="aspect-ratio-pills" className="text-sm text-gray-400 mr-2">Proporção da Tela:</label>
                                            <select id="aspect-ratio-pills" value={imageAspectRatio} onChange={(e) => setImageAspectRatio(e.target.value as AspectRatio)} className="bg-gray-700 border border-gray-600 rounded-md p-2">
                                                <option value="1:1">1:1 (Square)</option>
                                                <option value="16:9">16:9 (Landscape)</option>
                                                <option value="9:16">9:16 (Portrait)</option>
                                                <option value="4:3">4:3 (Standard)</option>
                                                <option value="3:4">3:4 (Tall)</option>
                                            </select>
                                        </div>
                                        <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800/50 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center">
                                            {isGeneratingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Gerar Imagem
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">Nota: A geração de imagem usa um modelo que pode exigir uma conta faturada.</p>
                                    {imageData.error && <p className="text-red-400 text-center mt-2">{imageData.error}</p>}
                                    {imageData.url && <img src={imageData.url} alt="Pílula de oração gerada" className="mt-4 rounded-lg mx-auto max-w-full h-auto" />}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PrayerPills;