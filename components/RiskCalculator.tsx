import React, { useState } from 'react';
import { X, Calculator, ShieldCheck } from 'lucide-react';
import { AgentId } from '../types.ts';
import { useStore } from '../store.ts';

interface RiskCalculatorProps {
    onExit: () => void;
}

const RiskCalculator: React.FC<RiskCalculatorProps> = ({ onExit }) => {
    const { switchAgent, goBackToAgentRoom } = useStore();
    const [scenario, setScenario] = useState('');
    const [analysis, setAnalysis] = useState('');
    
    const handleCalculate = () => {
        if (!scenario.trim()) return;
        setAnalysis(`Análise Lógica para "${scenario}":\n\n- Volatilidade de Mercado: Alta. O ativo está sujeito a flutuações significativas devido a fatores macroeconômicos e sentimento do mercado.\n- Risco Tecnológico: Médio. A tecnologia subjacente é promissora, mas ainda em desenvolvimento, com possíveis vulnerabilidades.\n- Risco Regulatório: Alto. A incerteza regulatória no setor pode impactar negativamente o valor do ativo.\n\nRecomendação: Diversifique a alocação e considere este um investimento de alto risco. Para uma análise mais profunda, converse com o Analista.`);
    };
    
    const handleSwitch = () => {
        switchAgent(AgentId.INVESTMENTS);
    };

    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-blue-400" />
                    <h1 className="text-xl font-bold text-gray-200">Calculadora de Risco Lógico</h1>
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
            <main className="flex-1 overflow-y-auto p-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <p className="text-lg text-gray-400 mb-6">
                        Descreva um ativo ou cenário de investimento. O sistema fornecerá uma análise fria e lógica dos riscos potenciais.
                    </p>
                    <textarea
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                        placeholder="Ex: 'Investir em uma nova criptomoeda de IA'"
                        className="w-full h-24 bg-gray-800/80 border border-gray-600 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/80 text-lg"
                    />
                    <button onClick={handleCalculate} disabled={!scenario.trim()} className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white font-bold py-3 px-8 rounded-full text-lg flex items-center justify-center mx-auto">
                        <ShieldCheck className="mr-2" />
                        Analisar Risco
                    </button>
                </div>
                {analysis && (
                    <div className="mt-10 p-6 bg-gray-800/50 rounded-lg max-w-3xl mx-auto animate-fade-in text-left">
                        <p className="text-lg text-blue-200 whitespace-pre-wrap">{analysis}</p>
                        <div className="text-center mt-6">
                            <button onClick={handleSwitch} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-full">
                                Discutir com o Analista
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RiskCalculator;