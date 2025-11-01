import React from 'react';
import { useStore } from '../store.ts';
import { Agent, AgentId } from '../types.ts';
import UsvRadar from './UsvRadar.tsx';
import { AGENTS } from '../constants.tsx';

const Dashboard: React.FC = () => {
    const { usv, ucs, recommendation, startSession } = useStore();
    const recommendedAgent = recommendation ? AGENTS[recommendation] : null;

    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-12">
                <h1 className="text-5xl font-bold text-gray-100">Hub de Coerência</h1>
                <p className="text-xl text-gray-400 mt-2">Bem-vindo(a) ao seu espaço de alinhamento interior.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-2 glass-pane rounded-2xl p-6 flex items-center justify-center">
                    <UsvRadar usv={usv} />
                </div>

                <div className="flex flex-col gap-8">
                    <div className="glass-pane rounded-2xl p-6 text-center">
                        <p className="text-gray-400 text-lg">Sua Coerência (Φ)</p>
                        <p className="text-6xl font-bold text-indigo-400 my-2">{ucs}</p>
                        <p className="text-gray-500">Um reflexo de sua harmonia interior.</p>
                    </div>

                    {recommendedAgent && (
                        <div className="glass-pane rounded-2xl p-6 animate-fade-in">
                             <h3 className="font-bold text-xl mb-4 text-indigo-400">Recomendação do Dia</h3>
                             <div 
                                className="flex items-center gap-4 cursor-pointer group"
                                onClick={() => startSession({ type: 'agent', id: recommendedAgent.id })}
                             >
                                 <recommendedAgent.icon className={`w-12 h-12 ${recommendedAgent.themeColor} transition-transform group-hover:scale-110`} />
                                 <div>
                                     <h4 className="font-semibold text-lg">{recommendedAgent.name}</h4>
                                     <p className="text-sm text-gray-400">Focar em {Object.entries(usv).find(([key, val]) => key === (recommendation === 'emotional_finance' ? 'emotional' : recommendation))?.[0]} pode aumentar sua coerência.</p>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
