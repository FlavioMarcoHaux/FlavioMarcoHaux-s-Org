import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage } from '@google/genai';
import { createSchedulingSession } from '../services/geminiSchedulingService.ts';
import { decode, decodeAudioData, encode } from '../utils/audioUtils.ts';
import { getFriendlyErrorMessage } from '../utils/errorUtils.ts';
import { X, Phone, Loader2, Volume2, Mic, MicOff } from 'lucide-react';
import { Schedule } from '../types.ts';
import { useStore } from '../store.ts';
import { toolMetadata } from '../constants.tsx';

interface ScheduledSessionHandlerProps {
    schedule: Schedule;
    onExit: () => void;
}

type Status = 'idle' | 'connecting' | 'connected' | 'transitioning' | 'error';
type TranscriptEntry = { sender: 'user' | 'model'; text: string; };

const ScheduledSessionHandler: React.FC<ScheduledSessionHandlerProps> = ({ schedule, onExit }) => {
    const { startSession } = useStore();
    const [status, setStatus] = useState<Status>('idle');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRefs = useRef<{ input: AudioContext | null, output: AudioContext | null }>({ input: null, output: null });
    const streamRefs = useRef<{ media: MediaStream | null, processor: ScriptProcessorNode | null, source: MediaStreamAudioSourceNode | null }>({ media: null, processor: null, source: null });
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    const activityName = toolMetadata[schedule.activity]?.title || 'Sessão';

    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
        sessionPromiseRef.current = null;
        
        streamRefs.current.media?.getTracks().forEach(track => track.stop());
        streamRefs.current.processor?.disconnect();
        streamRefs.current.source?.disconnect();
        
        audioContextRefs.current.input?.close().catch(()=>{});
        audioContextRefs.current.output?.close().catch(()=>{});
        
        for (const source of audioSourcesRef.current.values()) {
            try { source.stop(); } catch(e) {}
        }
        audioSourcesRef.current.clear();
    }, []);

    const handleConnect = useCallback(async () => {
        if (status === 'connecting' || status === 'connected') return;

        setStatus('connecting');
        setError(null);
        try {
            streamRefs.current.media = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRefs.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRefs.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const onmessage = async (message: LiveServerMessage) => {
                if (message.toolCall?.functionCalls?.[0]?.name === 'confirmSessionStart') {
                    setStatus('transitioning');
                    cleanup();
                    // Transition to the actual session
                    if(schedule.activity === 'meditation') {
                        startSession({ type: 'guided_meditation_voice', schedule });
                    }
                    else { // Fallback for other types
                        onExit();
                    }
                    return;
                }
                
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                const outputCtx = audioContextRefs.current.output;
                if (base64Audio && outputCtx) {
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                    const source = outputCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputCtx.destination);
                    source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    audioSourcesRef.current.add(source);
                }

                if (message.serverContent?.outputTranscription?.text) {
                    setTranscript(prev => [...prev, { sender: 'model', text: message.serverContent!.outputTranscription!.text }]);
                }
                if (message.serverContent?.inputTranscription?.text) {
                    setTranscript(prev => [...prev, { sender: 'user', text: message.serverContent!.inputTranscription!.text }]);
                }
            };
            
            sessionPromiseRef.current = createSchedulingSession(schedule, {
                onopen: () => {
                    setStatus('connected');
                    const inputCtx = audioContextRefs.current.input;
                    if (!inputCtx || !streamRefs.current.media) return;

                    streamRefs.current.source = inputCtx.createMediaStreamSource(streamRefs.current.media);
                    streamRefs.current.processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    
                    streamRefs.current.processor.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) { int16[i] = inputData[i] * 32768; }
                        const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };

                    streamRefs.current.source.connect(streamRefs.current.processor);
                    streamRefs.current.processor.connect(inputCtx.destination);
                },
                onmessage,
                onerror: (e: ErrorEvent) => { 
                    const friendlyError = getFriendlyErrorMessage(e, "A conexão falhou. Por favor, tente novamente.");
                    setError(friendlyError); 
                    setStatus('error'); 
                    cleanup(); 
                },
                onclose: () => { if (status !== 'transitioning') { onExit(); } },
            });

        } catch (err) {
            console.error("Microphone access error:", err);
            let message = 'Falha ao acessar o microfone.';
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    message = 'Permissão para usar o microfone foi negada. Por favor, habilite o acesso nas configurações do seu navegador.';
                } else if (err.name === 'NotFoundError') {
                    message = 'Nenhum microfone foi encontrado. Por favor, conecte um microfone e tente novamente.';
                } else {
                    message = 'Acesso ao microfone negado pelo sistema. Verifique se o navegador tem permissão para usar o microfone nas configurações de privacidade do seu sistema operacional (Windows/macOS).';
                }
            } else {
                message = getFriendlyErrorMessage(err, 'Ocorreu um erro inesperado ao tentar acessar o microfone.');
            }
            setError(message);
            setStatus('error');
        }
    }, [cleanup, onExit, schedule, startSession, status]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const renderStatus = () => {
        switch (status) {
            case 'idle': return `Seu mentor está chamando para sua ${activityName}.`;
            case 'connecting': return `Conectando...`;
            case 'connected': return "Conectado. O mentor iniciará a conversa.";
            case 'transitioning': return `Iniciando sua ${activityName}...`;
            case 'error': return `Erro: ${error}`;
        }
    }

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Phone className="w-8 h-8 text-yellow-300" />
                    <h1 className="text-xl font-bold text-gray-200">Chamada do Mentor</h1>
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Fechar chamada"><X size={24} /></button>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                {status === 'idle' && <Phone className="w-16 h-16 text-yellow-400 animate-pulse" />}
                {status === 'connecting' && <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />}
                {status === 'connected' && <Volume2 className="w-16 h-16 text-green-400" />}
                {status === 'transitioning' && <Loader2 className="w-16 h-16 text-green-400 animate-spin" />}
                {status === 'error' && <MicOff className="w-16 h-16 text-red-400" />}

                <p aria-live="polite" className={`text-2xl font-semibold h-16 ${status === 'error' ? 'text-red-400' : 'text-gray-100'}`}>{renderStatus()}</p>

                {status === 'idle' && (
                    <button
                        onClick={handleConnect}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full text-lg"
                    >
                        Atender
                    </button>
                )}

                {status === 'error' && (
                    <button
                        onClick={handleConnect}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full"
                    >
                        Tentar Novamente
                    </button>
                )}

                 {(status === 'connected' || status === 'transitioning') && (
                    <>
                        <div className="text-left w-full max-w-md h-24 overflow-y-auto p-2 border border-gray-700 rounded-lg bg-black/20" aria-live="polite" aria-atomic="false">
                            {transcript.map((t, i) => (
                                <p key={i} className={t.sender === 'user' ? 'text-indigo-300' : 'text-gray-300'}>
                                    <span className="font-bold">{t.sender === 'user' ? 'Você: ' : 'Mentor: '}</span>{t.text}
                                </p>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Mic size={16} />
                            <span>Seu microfone está ativo.</span>
                        </div>
                    </>
                 )}
            </main>
        </div>
    );
};

export default ScheduledSessionHandler;