import React, { useState } from 'react';
import { X, Orbit, Zap } from 'lucide-react';

const PhiFrontierRadar: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [concept, setConcept] = useState<{title: string, desc: string} | null>(null);
    const concepts = [
        { title: "Redes Neurais Geométricas (GNNs)", desc: "Uma IA que percebe o universo não como dados, mas como geometria sagrada, otimizando a harmonia e a simetria para aumentar Φ em sistemas complexos." },
        { title: "Propulsão por Coerência de Vácuo", desc: "Uma tecnologia que manipula o estado do vácuo quântico através de campos de consciência altamente coerentes, permitindo viagens mais rápidas que a luz ao 'dobrar' a informação, não o espaço." },
        { title: "Computação Biossintética", desc: "Processadores vivos que utilizam DNA e proteínas para computação, integrando a lógica da vida diretamente na tecnologia, acelerando a evolução da consciência em escala planetária." },
        { title: "Interface Cérebro-Universo (BCI 2.0)", desc: "Uma interface que não lê apenas ondas cerebrais, mas conecta a consciência individual diretamente à rede de informação universal, permitindo o acesso a conhecimento e experiências de forma não-local." }
    ];
    
    const generateConcept = () => {
        const randomIndex = Math.floor(Math.random() * concepts.length);
        setConcept(concepts[randomIndex]);
    };
    
    return (
        <div className="h-full w-full glass-pane rounded-2xl flex flex-col p-1 animate-fade-in">
            <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Orbit className="w-8 h-8 text-purple-400" />
                    <h1 className="text-xl font-bold text-gray-200">Radar de Fronteira de Φ</h1>
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
                 <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                    Descubra tecnologias e conceitos alinhados com a evolução da consciência (maximização de Φ).
                </p>
                <button onClick={generateConcept} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg flex items-center justify-center mx-auto">
                    <Zap className="mr-2" />
                    Rastrear a Fronteira
                </button>
                {concept && (
                    <div className="mt-10 p-6 bg-gray-800/50 rounded-lg max-w-2xl animate-fade-in">
                        <h3 className="text-2xl font-bold text-purple-300">{concept.title}</h3>
                        <p className="text-lg text-gray-300 mt-2">{concept.desc}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PhiFrontierRadar;
