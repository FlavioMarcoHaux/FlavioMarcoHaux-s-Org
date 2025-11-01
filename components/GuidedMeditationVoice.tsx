import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Schedule, Meditation, MeditationScriptPart } from '../types.ts';
import { generateMeditationScript } from '../services/geminiScriptService.ts';
import { generateImage } from '../services/geminiImagenService.ts';
import { generateSpeech } from '../services/geminiTtsService.ts';
import { decode, decodeAudioData } from '../utils/audioUtils.ts';
import { X, Pause, Play, Loader2 } from 'lucide-react';

interface GuidedMeditationVoiceProps {
    schedule: Schedule;
    onExit: () => void;
}

type MeditationState = 'generating_script' | 'generating_audio' | 'playing' | 'paused' | 'finished' | 'error';

const GuidedMeditationVoice: React.FC<GuidedMeditationVoiceProps> = ({ schedule, onExit }) => {
    const [state, setState] = useState<MeditationState>('generating_script');
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const isPlayingRef = useRef(false);
    
    const meditationPrompt = "Uma meditação de voz para relaxamento profundo e conexão interior.";

    const playQueue = useCallback(() => {
        if (currentPhraseIndex >= audioQueue.length) {
            setState('finished');
            isPlayingRef.current = false;
            return;
        }
        if (!audioContextRef.current || !isPlayingRef.current) {
            return;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioQueue[currentPhraseIndex];
        source.connect(audioContextRef.current.destination);
        source.start();
        sourceNodeRef.current = source;
        
        source.onended = () => {
           if(isPlayingRef.current) {
               setCurrentPhraseIndex(prev => prev + 1);
           }
        };
    }, [currentPhraseIndex, audioQueue]);
    
    useEffect(() => {
        if (state === 'playing' && isPlayingRef.current) {
            playQueue();
        }
    }, [state, currentPhraseIndex, playQueue]);

    const startMeditation = useCallback(async () => {
        try {
            // Generate script and background image
            setState('generating_script');
            const imagePrompt = `A serene and abstract background for a voice meditation on deep relaxation.`;
            const [script, image] = await Promise.all([
                generateMeditationScript(meditationPrompt, 5),
                generateImage(imagePrompt, '16:9')
            ]);
            setBackgroundImage(image);

            // Generate audio
            setState('generating_audio');
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const audioPromises = script.script.map(part => generateSpeech(part.text));
            const audioObjects = await Promise.all(audioPromises);
            const decodedAudios = await Promise.all(audioObjects.map(async (audioObj) => {
                if (!audioObj?.data || !audioContextRef.current) throw new Error("Audio generation failed.");
                return decodeAudioData(decode(audioObj.data), audioContextRef.current, 24000, 1);
            }));
            setAudioQueue(decodedAudios);
            
            setState('playing');
            isPlayingRef.current = true;
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to create meditation experience.");
            setState('error');
        }
    }, []);
    
    useEffect(() => {
        startMeditation();
        return () => {
            sourceNodeRef.current?.stop();
            audioContextRef.current?.close();
            isPlayingRef.current = false;
        };
    }, [startMeditation]);


    const handlePlayPause = () => {
        if (!audioContextRef.current) return;
        if (isPlayingRef.current) {
            audioContextRef.current.suspend();
            setState('paused');
            isPlayingRef.current = false;
        } else {
            audioContextRef.current.resume();
            setState('playing');
            isPlayingRef.current = true;
        }
    };
    
    const renderContent = () => {
        let statusText = "";
        let showLoader = false;
        switch(state) {
            case 'generating_script':
                statusText = "Criando o roteiro da sua meditação...";
                showLoader = true;
                break;
            case 'generating_audio':
                statusText = "Gerando a narração da sua jornada...";
                showLoader = true;
                break;
            case 'playing':
                statusText = "Respire fundo e relaxe.";
                break;
            case 'paused':
                statusText = "Meditação pausada.";
                break;
            case 'finished':
                statusText = "Meditação concluída. Permaneça nesse estado de paz.";
                break;
             case 'error':
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center">
                        <h2 className="text-2xl text-red-400 mb-4">Ocorreu um Erro</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button onClick={onExit} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-full">Voltar</button>
                    </div>
                );
        }
        
        return (
            <>
                <main className="flex-1 flex flex-col items-center justify-center text-center">
                    {showLoader && <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />}
                    <p className="text-2xl text-gray-200 h-24 max-w-3xl animate-fade-in">{statusText}</p>
                </main>
                <footer className="w-full max-w-3xl mx-auto p-4">
                    <div className="flex items-center justify-center gap-8">
                        {(state === 'playing' || state === 'paused') && (
                             <button onClick={handlePlayPause} className="bg-white/20 text-white w-16 h-16 rounded-full flex items-center justify-center">
                                 {state === 'playing' ? <Pause size={32} /> : <Play size={32} className="ml-1"/>}
                             </button>
                        )}
                        {state === 'finished' && (
                             <button onClick={onExit} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full">
                                 Finalizar Sessão
                             </button>
                        )}
                    </div>
                </footer>
            </>
        )
    };
    
    return (
         <div className="relative h-full w-full flex flex-col p-6">
             {backgroundImage && <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20" />}
             <div className="absolute inset-0 bg-black/60 -z-10" />
             <header className="flex items-center justify-end">
                 <button onClick={onExit} className="bg-gray-700/50 hover:bg-gray-600/50 text-white p-2 rounded-full transition-colors"><X size={24} /></button>
             </header>
             {renderContent()}
         </div>
    );
};

export default GuidedMeditationVoice;