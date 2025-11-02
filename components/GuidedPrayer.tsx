import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store.ts';
import { UserStateVector, AgentId } from '../types.ts';
import { generateGuidedPrayer, recommendPrayerTheme } from '../services/geminiPrayerService.ts';
import { generateImagePromptForPrayer } from '../services/geminiContentService.ts';
import { generateImage } from '../services/geminiImagenService.ts';
import { generateSpeech } from '../services/geminiTtsService.ts';
import { decode, encodeWAV } from '../utils/audioUtils.ts';
import { getFriendlyErrorMessage } from '../utils/errorUtils.ts';
import { X, Sparkles, BookOpen, Volume2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface GuidedPrayerProps {
    onExit: () => void;
}

type PrayerState = 'config' | 'generating' | 'display' | 'error';

const getPrayerSuggestions = (usv: UserStateVector): string[] => {
    const suggestions: { key: keyof UserStateVector | 'emotional_inverted', value: number, themes: string[] }[] = [
        { key: 'spiritual', value: usv.spiritual, themes: ["fortalecer minha fé", "encontrar meu propósito"] },
        { key: 'emotional_inverted', value: 100 - usv.emotional, themes: ["paz para um coração ansioso", "cura para feridas emocionais"] },
        { key: 'physical', value: usv.physical, themes: ["restauração da saúde", "forças para o corpo"] },
        { key: 'financial', value: usv.financial, themes: ["abertura de caminhos financeiros", "sabedoria para prosperar"] },
    ];
    const sortedStates = suggestions.sort((a, b) => a.value - b.value);
    const finalSuggestions = new Set<string>();
    sortedStates.forEach(state => {
        state.themes.forEach(theme => finalSuggestions.add(theme));
    });
    return Array.from(finalSuggestions).slice(0, 4);
};

const GuidedPrayer: React.FC<GuidedPrayerProps> = ({ onExit }) => {
    const { usv, chatHistories, lastAgentContext, goBackToAgentRoom } = useStore(state => ({
        usv: state.usv,
        chatHistories: state.chatHistories,
        lastAgentContext: state.lastAgentContext,
        goBackToAgentRoom: state.goBackToAgentRoom,
    }));
    const agentIdForContext = lastAgentContext ?? AgentId.COHERENCE;
    const chatHistory = chatHistories[agentIdForContext];

    const [state, setState] = useState<PrayerState>('config');
    const [theme, setTheme] = useState('');
    const [prayerText, setPrayerText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isRecommending, setIsRecommending] = useState(false);

    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);

    const suggestions = useMemo(() => getPrayerSuggestions(usv), [usv]);
    
    useEffect(() => {
        return () => {
            if (audioUrl && audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate, audioUrl]);

    const handleGeneratePrayer = async (inputTheme: string) => {
        if (!inputTheme.trim()) return;
        setTheme(inputTheme);
        setState('generating');
        setError(null);
        setPrayerText('');
        setAudioUrl(null);
        setImageUrl(null);
        
        try {
            const result = await generateGuidedPrayer(inputTheme, chatHistory);
            setPrayerText(result);
            setState('display');
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err, "Falha ao gerar a oração.");
            setError(friendlyError);
            setState('error');
        }
    };

    const handleRecommend = async () => {
        setIsRecommending(true);
        setError(null);
        try {
            const recommendedTheme = await recommendPrayerTheme(usv, chatHistory);
            await handleGeneratePrayer(recommendedTheme);
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err, "Falha ao obter uma recomendação.");
            setError(friendlyError);
            setState('error');
        } finally {
            setIsRecommending(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!prayerText) return;
        setIsGeneratingAudio(true);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        
        try {
            const paragraphs = prayerText.split(/\n+/).filter(p => p.trim().length > 0);
            const audioResults = await Promise.all(paragraphs.map(p => generateSpeech(p, 'Kore')));
            
            const pcmByteArrays = audioResults.map(result => {
                if(result?.data) return decode(result.data);
                return new Uint8Array(0);
            });
            
            const totalLength = pcmByteArrays.reduce((acc, arr) => acc + arr.length, 0);
            const combinedPcm = new Uint8Array(totalLength);
            let offset = 0;
            pcmByteArrays.forEach(arr => {
                combinedPcm.set(arr, offset);
                offset += arr.length;
            });

            if (combinedPcm.length > 0) {
                 const wavBlob = encodeWAV(combinedPcm, 24000, 1, 16);
                 const newAudioUrl = URL.createObjectURL(wavBlob);
                 setAudioUrl(newAudioUrl);
            } else {
                throw new Error("A geração de áudio não retornou dados válidos.");
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingAudio(false);
        }
    };
    
    const handleGenerateImage = async () => {
        if (!prayerText) return;
        setIsGeneratingImage(true);
        setImageUrl(null);
        try {
            const imagePrompt = await generateImagePromptForPrayer(prayerText);
            const result = await generateImage(imagePrompt, '16:9');
            setImageUrl(result);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleReset = () => {
        setState('config');
        setTheme('');
        setPrayerText('');
        setError(null);
        setAudioUrl(null);
        setImageUrl(null);
    };

    const renderContent = () => {
        switch (state) {
            case 'generating':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                        <p className="mt-4 text-lg text-gray-300">Criando sua oração...</p>
                        <p className="text-sm text-gray-500">Isso pode levar alguns instantes.</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <h2 className="text-2xl text-red-400 mb-4">Ocorreu um Erro</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button onClick={handleReset} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-full">Tentar Novamente</button>
                    </div>
                );
            case 'display':
                return (
                    <div className="flex flex-col h-full">
                         <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
                            <h2 className="text-3xl font-bold text-center mb-6 text-gray-100">Oração sobre "{theme}"</h2>
                            
                            {imageUrl && <img src={imageUrl} alt="Visualização da oração" className="w-full aspect-video object-cover rounded-lg mb-6 shadow-lg" />}
                            
                            <div className="p-6 bg-gray-900/50 rounded-lg max-h-[50vh] overflow-y-auto">
                                <p className="whitespace-pre-wrap text-gray-300 leading-relaxed text-lg">{prayerText}</p>
                            </div>
                         </div>
                         <div className="p-4 border-t border-gray-700/50 bg-gray-900/30">
                             <div className="flex items-center justify-center gap-4 mb-4">
                                <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full transition-colors disabled:opacity-50">
                                    {isGeneratingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 size={20} />}
                                    {isGeneratingAudio ? 'Gerando...' : 'Ouvir Oração'}
                                </button>
                                <button onClick={handleGenerateImage} disabled={isGeneratingImage} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-full transition-colors disabled:opacity-50">
                                    {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon size={20} />}
                                    {isGeneratingImage ? 'Gerando...' : 'Gerar Imagem'}
                                </button>
                             </div>
                             {audioUrl && (
                                 <div className="w-full max-w-lg mx-auto space-y-3">
                                     <audio ref={audioRef} controls src={audioUrl} className="w-full" />
                                     <div className="flex items-center justify-center gap-2">
                                         <span className="text-sm text-gray-400">Velocidade:</span>
                                         {[0.75, 1, 1.25, 1.5].map(rate => (
                                             <button
                                                 key={rate}
                                                 onClick={() => setPlaybackRate(rate)}
                                                 className={`px-3 py-1 text-xs rounded-full transition-colors ${playbackRate === rate ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                             >
                                                 {rate}x
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             )}
                         </div>
                    </div>
                );
            case 'config':
            default:
                return (
                    <div className="flex flex-col items-center p-6 pt-12 text-center">
                        <div className="max-w-xl w-full">
                            <BookOpen className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
                            <h2 className="text-3xl font-bold text-gray-100">Oração Guiada</h2>
                            <p className="text-lg text-gray-400 mt-2 mb-8">
                                Qual tema você gostaria de trazer para sua oração hoje?
                            </p>
                            <div className="space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        onClick={handleRecommend}
                                        disabled={isRecommending}
                                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
                                    >
                                        {isRecommending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4" />
                                        )}
                                        Me recomende
                                    </button>
                                    <input
                                        type="text"
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value)}
                                        placeholder="Auto apreciação, auto desenvolvimento, auto regulação..."
                                        className="w-full bg-gray-800/80 border border-gray-600 rounded-xl p-4 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/80 text-lg"
                                        disabled={isRecommending}
                                    />
                                </div>
                                <button
                                    onClick={() => handleGeneratePrayer(theme)} 
                                    disabled={!theme.trim() || isRecommending}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-colors text-lg"
                                >
                                    Gerar Oração
                                </button>
                            </div>
                            <div className="my-6">
                                <h3 className="text-sm text-gray-400 mb-3">Ou comece com uma sugestão para seu momento:</h3>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {suggestions.map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleGeneratePrayer(suggestion)}
                                            disabled={isRecommending}
                                            className="px-4 py-2 bg-gray-700/80 border border-gray-600/90 text-gray-300 rounded-full text-sm hover:bg-gray-600/80 hover:border-indigo-500/50 transition-colors disabled:opacity-50"
                                        >
                                            <Sparkles className="inline w-4 h-4 mr-2 text-indigo-500/80" />
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <h1 className="text-xl font-bold text-indigo-400">Oração Guiada</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBackToAgentRoom}
                        className="text-gray-300 hover:text-white transition-colors text-sm font-semibold py-1 px-3 rounded-md border border-gray-600 hover:border-gray-400"
                        aria-label="Voltar para o Mentor"
                    >
                        Voltar
                    </button>
                    <button
                        onClick={onExit}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Exit Guided Prayer"
                    >
                        <X size={24} />
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                {renderContent()}
            </main>
        </div>
    );
};

export default GuidedPrayer;