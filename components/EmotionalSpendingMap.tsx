import React from 'react';
import { Wallet } from 'lucide-react';

// This is a placeholder component for a feature that is not yet implemented.
const EmotionalSpendingMap: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center glass-pane rounded-2xl animate-fade-in">
            <Wallet className="w-20 h-20 text-pink-400 mb-6" />
            <h2 className="text-3xl font-bold text-pink-300">Mapa Emocional de Gastos</h2>
            <p className="text-gray-400 mt-4 max-w-md">
                Em breve: Conecte suas transações financeiras aos seus estados emocionais para descobrir padrões e tomar decisões mais conscientes.
            </p>
            <button onClick={onExit} className="mt-8 bg-pink-600 text-white font-bold py-2 px-6 rounded-full">
                Voltar
            </button>
        </div>
    );
};

export default EmotionalSpendingMap;
