import React, { useState, useMemo, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useStore } from '../store.ts';
import { UserStateVector } from '../types.ts';

interface MeditationGuideChatProps {
    onCreate: (prompt: string, duration: number) => void;
    onExit: () => void;
    onBack: () => void;
    initialPrompt?: string;
    isSummarizing?: boolean;
}

const getMeditationSuggestions = (usv: UserStateVector): string[] => {
    const suggestions: { key: keyof UserStateVector | 'emotional_inverted', value: number, themes: string[] }[] = [
        { key: 'spiritual', value: usv.spiritual, themes: ["Conexão e propósito", "Expansão da consciência"] },
        { key: 'emotional_inverted', value: 100 - usv.emotional, themes: ["Aliviar ansiedade", "Paz interior", "Amor-próprio e aceitação"] },
        { key: 'physical', value: usv.physical, themes: ["Relaxamento profundo do corpo", "Energia e vitalidade"] },
        { key: 'financial', value: usv.financial, themes: ["Mentalidade de abundância", "Gratidão e prosperidade"] },
    ];

    const sortedStates = suggestions.sort((a, b) => a.value - b.value);
    const finalSuggestions = new Set<string>();
    sortedStates.forEach(state => {
        state.themes.forEach(theme => finalSuggestions.add(theme));
    });

    return Array.from(finalSuggestions).slice(0, 4);
};

const MeditationGuideChat: React.FC<MeditationGuideChatProps> = ({ onCreate, onExit, onBack, initialPrompt = '', isSummarizing = false }) => {
    const usv = useStore(state => state.usv);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [duration, setDuration] = useState(5);

    useEffect(() => {
        setPrompt(initialPrompt);
    }, [initialPrompt]);

    const suggestions = useMemo(() => getMeditationSuggestions(usv), [usv]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onCreate(prompt.trim(), duration);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
        onCreate(suggestion, duration);
    }

    return (
        <div className="h-full w-full flex flex-col">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <h1 className="text-xl font-bold text-indigo-400">Criar Meditação</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="text-gray-300 hover:text-white transition-colors text-sm font-semibold py-1 px-3 rounded-md border border-gray-600 hover:border-gray-400"
                        aria-label="Voltar para o Mentor"
                    >
                        Voltar
                    </button>
                    <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center p-6 pt-12 text-center">
                <div className="max-w-xl w-full">
                    <p className="text-lg text-gray-300 mb-8">
                        Qual é a sua intenção para a meditação de hoje?
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={isSummarizing ? "Analisando sua conversa para sugerir uma intenção..." : "Ex: 'Aliviar a ansiedade e encontrar a paz interior'"}
                            className="w-full bg-gray-800/80 border border-gray-600 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/80 text-lg"
                            rows={3}
                            disabled={isSummarizing}
                        />
                        <div>
                            <label htmlFor="duration" className="block text-gray-300 mb-2">Duração: {duration} minutos</label>
                            <input
                                type="range" id="duration" min="1" max="15" value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                        <button
                            type="submit" disabled={!prompt.trim() || isSummarizing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-colors text-lg"
                        >
                            Gerar Meditação
                        </button>
                    </form>
                    <div className="my-6">
                        <h3 className="text-sm text-gray-400 mb-3">Ou comece com uma sugestão para seu momento:</h3>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {suggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="px-4 py-2 bg-gray-700/80 border border-gray-600/90 text-gray-300 rounded-full text-sm hover:bg-gray-600/80 hover:border-indigo-500/50 transition-colors disabled:opacity-50"
                                    disabled={isSummarizing}
                                >
                                    <Sparkles className="inline w-4 h-4 mr-2 text-indigo-500/80" />
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MeditationGuideChat;