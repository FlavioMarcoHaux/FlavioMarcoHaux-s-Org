import React from 'react';
import { HeartHandshake } from 'lucide-react';

// This is a placeholder component for a feature that is not yet implemented.
const WellnessVisualizer: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center glass-pane rounded-2xl animate-fade-in">
            <HeartHandshake className="w-20 h-20 text-green-400 mb-6" />
            <h2 className="text-3xl font-bold text-green-300">Visualizador de Bem-Estar</h2>
            <p className="text-gray-400 mt-4 max-w-md">
                Em breve: Acompanhe sua jornada de bem-estar com gráficos e insights visuais sobre seu progresso físico, mental e espiritual.
            </p>
            <button onClick={onExit} className="mt-8 bg-green-600 text-white font-bold py-2 px-6 rounded-full">
                Voltar
            </button>
        </div>
    );
};

export default WellnessVisualizer;
