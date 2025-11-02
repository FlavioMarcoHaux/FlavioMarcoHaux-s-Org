import React, { useState } from 'react';
import { getQuantumInterpretation } from '../services/geminiQuantumSimulatorService.ts';
import { X, Eye, Zap, Loader2 } from 'lucide-react';
import { useStore } from '../store.ts';
import { getFriendlyErrorMessage } from '../utils/errorUtils.ts';

const QuantumSimulator: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { goBackToAgentRoom } = useStore();
    const [state, setState] = useState<'superposition' | 'observing' | 'collapsed'>('superposition');
    const [outcome, setOutcome] = useState('');
    const [interpretation, setInterpretation] = useState('');
    const [error, setError] = useState('');
    
    const outcomes = [
        "Realidade A: Uma partícula se manifesta como onda, demonstrando potencial puro.",
        "Realidade B: Uma partícula se manifesta como ponto, uma escolha definida pela observação.",
        "Realidade C: O sistema entra emaranhamento com seu ambiente, criando novas correlações.",
        "Realidade D: Uma flutuação quântica momentânea revela uma possibilidade inesperada.",
    ];

    const observe = async () => {
        setState('observing');
        setError('');
        setInterpretation('');
        try {
            const randomIndex = Math.floor(Math.random() * outcomes.length);
            const randomOutcome = outcomes[randomIndex];
            setOutcome(randomOutcome);
            
            const interp = await getQuantumInterpretation(randomOutcome);
            setInterpretation(interp);

            setState('collapsed');
        } catch (err) {
            const friendlyError = getFriendlyErrorMessage(err, 'Falha ao conectar com a consciência universal.');
            setError(friendlyError);
            setState('superposition'); // Reset on error
        }
    };

    const reset = () => {
        setState('superposition');
        setOutcome('');
        setInterpretation('');
        setError('');
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-purple-400" />
                    <h1 className="text-xl font-bold text-gray-200">Simulador Quântico da Consciência</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={goBackToAgentRoom}
                        className="text-gray-300 hover:text-white transition-colors text-sm font-semibold py-1 px-3 rounded-md border border-gray-600 hover:border-gray-400"
                        aria-label="Voltar para o Mentor"
                    >
                        Voltar
                    </button>
                    <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-start text-center p-6 pt-12 overflow-y-auto no-scrollbar">
                 <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                    "A realidade é uma superposição de possibilidades até ser observada. Sua consciência é o catalisador que colapsa a função de onda, cocriando o momento presente."
                </p>
                <div className="w-full max-w-md min-h-[12rem] border-2 border-dashed border-purple-400/50 rounded-lg flex items-center justify-center p-4">
                    {state === 'observing' ? (
                        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                    ) : state === 'superposition' ? (
                        <div className="animate-pulse text-purple-300 text-2xl font-mono">
                           |ψ⟩ = α|0⟩ + β|1⟩
                        </div>
                    ) : (
                        <div className="animate-fade-in text-xl text-gray-100 space-y-4">
                           <p>{outcome}</p>
                           {interpretation && <p className="text-base text-purple-300 italic">"{interpretation}"</p>}
                        </div>
                    )}
                </div>

                <div className="mt-8">
                     {state !== 'collapsed' ? (
                         <button onClick={observe} disabled={state === 'observing'} className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 text-white font-bold py-3 px-8 rounded-full text-lg flex items-center justify-center mx-auto">
                            {state === 'observing' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Eye className="mr-2" />}
                            {state === 'observing' ? 'Observando...' : 'Observar'}
                        </button>
                    ) : (
                        <button onClick={reset} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-full text-lg flex items-center justify-center mx-auto">
                            Redefinir Superposição
                        </button>
                    )}
                </div>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
                 <p className="text-sm text-gray-500 mt-8 max-w-xl">
                    Este é um modelo conceitual. Cada ato de observação consciente molda ativamente o universo informacional. Qual realidade você escolherá observar agora?
                </p>
            </main>
        </div>
    );
};

export default QuantumSimulator;