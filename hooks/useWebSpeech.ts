// hooks/useWebSpeech.ts
import { useState, useEffect, useRef, useCallback } from 'react';

// Define the interface for the speech recognition object to support vendor prefixes
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

// FIX: Added a check for the existence of `window` before accessing it.
// This prevents errors in server-side rendering or non-browser environments.
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export const useWebSpeech = (lang = 'pt-BR') => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            setError('A API de Reconhecimento de Fala não é suportada neste navegador.');
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event) => {
            const fullTranscript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setTranscript(fullTranscript);
        };
        
        recognition.onerror = (event) => {
            let errorMessage = `Erro no reconhecimento de fala: ${event.error}`;
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                errorMessage = "A permissão para usar o microfone foi negada. Verifique as configurações do seu navegador e do sistema.";
            }
            setError(errorMessage);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current = recognition;

    }, [lang]);
    
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
            setError(null);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);
    
    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;

            const setVoiceAndSpeak = () => {
                const voices = window.speechSynthesis.getVoices();
                const portugueseVoice = voices.find(voice => voice.lang === 'pt-BR' || voice.lang.startsWith('pt-'));
                if (portugueseVoice) {
                    utterance.voice = portugueseVoice;
                }
                window.speechSynthesis.speak(utterance);
            };

            window.speechSynthesis.cancel();
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
            } else {
                setVoiceAndSpeak();
            }
        } else {
             setError('A API de Síntese de Fala não é suportada neste navegador.');
        }
    }, [lang]);

    return {
        transcript,
        isListening,
        startListening,
        stopListening,
        error,
        speak
    };
};
