import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Meditation, Message, AgentId } from '../types.ts';
import { generateMeditationScript } from '../services/geminiScriptService.ts';
import { generateImage } from '../services/geminiImagenService.ts'; // Updated to use Imagen service
import { generateSpeech } from '../services/geminiTtsService.ts';
import { decode, decodeAudioData } from '../utils/audioUtils.ts';
import MeditationGuideChat from './MeditationGuideChat.tsx';
import MeditationPreview from './MeditationPreview.tsx';
import { useStore } from '../store.ts';
import { X, Pause, Play } from 'lucide-react';

interface GuidedMeditationProps {
    onExit: () => void;
}

type MeditationState = 'config' | 'generating' | 'preview' | 'playing' | 'error';

const GuidedMeditation: React.FC<GuidedMeditationProps> = ({ onExit }) => {
    const chatHistory = useStore(state => state.chatHistories[AgentId.COHERENCE]);
    const [state, setState] = useState<MeditationState>('config');
    const [meditation, setMeditation] = useState<Meditation | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [audioQueue, setAudioQueue] = useState<{ buffer: AudioBuffer, duration: number }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const handleCreateMeditation = useCallback(async (prompt: string, duration: number) => {
        setState('generating');
        setError(null);
        try {
            const imagePrompt = `A serene and abstract background image for a meditation session with the theme: "${prompt}". The image should be calming, use soft colors, and be visually simple to not distract. Digital art style.`;
            const [script, image] = await Promise.all([
                generateMeditationScript(prompt, duration, chatHistory),
                generateImage(imagePrompt, '16:9')
            ]);
            setMeditation(script);
            setBackgroundImage(image);
            setState('preview');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to create meditation.");
            setState('error');
        }
    }, [chatHistory]);

    const handleStartMeditation = async () => {
        if (!meditation) return;
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        setState('generating'); 
        try {
            const audioPromises = meditation.script.map(part => generateSpeech(part.text));
            const audioObjects = await Promise.all(audioPromises);

            const decodedAudios = await Promise.all(audioObjects.map(async (audioObj) => {
                const b64 = audioObj?.data;
                if (!b64 || !audioContextRef.current) throw new Error("Audio generation failed for a part.");
                const bytes = decode(b64);
                return decodeAudioData(bytes, audioContextRef.current, 24000, 1);
            }));

            const queue = decodedAudios.map((buffer, index) => ({
                buffer,
                duration: meditation.script[index].duration
            }));

            setAudioQueue(queue);
            setState('playing');
            setIsPlaying(true);
            setCurrentPhraseIndex(0);
        } catch (err) {
             console.error(err);
             setError(err instanceof Error ? err.message : "Failed to generate audio.");
             setState('error');
        }
    };

    useEffect(() => {
        if (state === 'playing' && isPlaying && currentPhraseIndex < audioQueue.length) {
            const playCurrentPhrase = () => {
                if (!audioContextRef.current) return;

                const { buffer } = audioQueue[currentPhraseIndex];
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.start();
                sourceNodeRef.current = source;
                
                source.onended = () => {
                   setCurrentPhraseIndex(prev => prev + 1);
                };

                return () => {
                    if (sourceNodeRef.current) {
                        sourceNodeRef.current.onended = null;
                        try {
                           sourceNodeRef.current.stop();
                        } catch (e) { /* already stopped */ }
                    }
                };
            };
            const cleanup = playCurrentPhrase();
            return cleanup;
        } else if (state === 'playing' && currentPhraseIndex >= audioQueue.length) {
            setIsPlaying(false);
        }
    }, [state, isPlaying, currentPhraseIndex, audioQueue]);

    const handlePlayPause = () => {
        if (!audioContextRef.current) return;
        if (isPlaying) {
            audioContextRef.current.suspend();
        } else {
            audioContextRef.current.resume();
        }
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setState('config');
        setMeditation(null);
        setBackgroundImage('');
        setAudioQueue([]);
        setError(null);
        setCurrentPhraseIndex(0);
        setIsPlaying(false);
        sourceNodeRef.current?.stop();
    };

    const renderContent = () => {
        switch (state) {
            case 'config':
                return <MeditationGuideChat onCreate={handleCreateMeditation} onExit={onExit} />;
            case 'generating':
                if (!meditation) {
                    return (
                        <div className="h-full w-full flex items-center justify-center glass-pane rounded-2xl">
                            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
                            <p className="ml-4 text-lg">Gerando sua experiência...</p>
                        </div>
                    );
                }
            case 'preview':
                if (meditation) {
                    return <MeditationPreview meditation={meditation} backgroundImage={backgroundImage} onStart={handleStartMeditation} onGoBack={handleReset} isLoading={state === 'generating'} />;
                }
                return null;
            case 'playing':
                 if (!meditation) return null;
                 const currentText = meditation.script[currentPhraseIndex]?.text || (currentPhraseIndex >= audioQueue.length ? "Meditação concluída." : "Preparando...");
                 const totalDuration = meditation.script.reduce((acc, part) => acc + part.duration, 0);
                 const elapsedDuration = meditation.script.slice(0, currentPhraseIndex).reduce((acc, part) => acc + part.duration, 0);
                 const progress = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
                 return (
                     <div className="relative h-full w-full flex flex-col p-6">
                         <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20" />
                         <div className="absolute inset-0 bg-black/60 -z-10" />
                         <header className="flex items-center justify-end">
                             <button onClick={onExit} className="bg-gray-700/50 hover:bg-gray-600/50 text-white p-2 rounded-full transition-colors"><X size={24} /></button>
                         </header>
                         <main className="flex-1 flex flex-col items-center justify-center text-center">
                             <p className="text-2xl text-gray-200 h-24 max-w-3xl animate-fade-in">{currentText}</p>
                         </main>
                         <footer className="w-full max-w-3xl mx-auto">
                             <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-4">
                                 <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s linear' }}></div>
                             </div>
                             <div className="flex items-center justify-center gap-8">
                                 <button onClick={handlePlayPause} className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center">
                                     {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1"/>}
                                 </button>
                             </div>
                         </footer>
                     </div>
                 );
            case 'error':
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center glass-pane rounded-2xl p-4 text-center">
                        <h2 className="text-2xl text-red-400 mb-4">Ocorreu um Erro</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button onClick={handleReset} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-full">Tentar Novamente</button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return renderContent();
};

export default GuidedMeditation;
