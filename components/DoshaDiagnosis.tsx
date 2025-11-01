import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { X, Stethoscope, Send, Loader2 } from 'lucide-react';
import { useStore } from '../store.ts';

interface DoshaDiagnosisProps {
    onExit: () => void;
}

const DoshaDiagnosis: React.FC<DoshaDiagnosisProps> = ({ onExit }) => {
    const { toolStates, isLoadingMessage, handleDoshaSendMessage } = useStore();
    const doshaState = toolStates.doshaDiagnosis;

    const messages = doshaState?.messages || [];
    const isFinished = doshaState?.isFinished || false;
    const error = doshaState?.error || null;
    
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoadingMessage || isFinished) return;
        handleDoshaSendMessage(input.trim());
        setInput('');
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Stethoscope className="w-8 h-8 text-green-400" />
                    <h1 className="text-xl font-bold text-gray-200">Diagnóstico Informacional</h1>
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors" aria-label="Exit Dosha Diagnosis">
                    <X size={24} />
                </button>
            </header>
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl px-4 py-3 rounded-2xl ${message.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoadingMessage && (
                         <div className="flex justify-start">
                            <div className="max-w-xl px-4 py-3 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        </div>
                    )}
                    {error && (
                         <div className="flex justify-start">
                             <div className="max-w-xl px-4 py-3 rounded-2xl bg-red-900/50 border border-red-500/50 text-red-300 rounded-bl-none">
                                 <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-700/50">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isFinished ? "Diagnóstico concluído." : "Digite sua resposta..."}
                            disabled={isLoadingMessage || isFinished}
                            className="flex-1 bg-gray-800/80 border border-gray-600 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isLoadingMessage || isFinished || !input.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default DoshaDiagnosis;
