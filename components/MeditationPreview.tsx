import React from 'react';
import { Meditation } from '../types.ts';
import { ArrowLeft, Play, X } from 'lucide-react';

interface MeditationPreviewProps {
  meditation: Meditation;
  backgroundImage: string;
  onStart: () => void;
  onGoBack: () => void;
  onBack: () => void;
  onExit: () => void;
  isLoading: boolean;
}

const MeditationPreview: React.FC<MeditationPreviewProps> = ({ meditation, backgroundImage, onStart, onGoBack, onBack, onExit, isLoading }) => {
  return (
    <div className="relative h-full w-full flex flex-col p-6">
      <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20" />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <header className="flex items-center justify-between">
         <button
          onClick={onGoBack}
          className="bg-gray-700/50 hover:bg-gray-600/50 text-white p-2 rounded-full transition-colors disabled:opacity-50"
          aria-label="Voltar para configuração"
          disabled={isLoading}
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-4">
            <button
                onClick={onBack}
                className="text-gray-300 hover:text-white transition-colors text-sm font-semibold py-1 px-3 rounded-md border border-gray-600 hover:border-gray-400 bg-black/20"
                aria-label="Voltar para o Mentor"
            >
                Voltar
            </button>
            <button onClick={onExit} className="bg-gray-700/50 hover:bg-gray-600/50 text-white p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in">{meditation.title}</h1>
        <p className="text-lg text-gray-300 mb-10 max-w-2xl animate-fade-in [animation-delay:0.2s]">
          Encontre uma posição confortável. Respire fundo. Quando estiver pronto(a), pressione iniciar para começar sua jornada.
        </p>

        <button
          onClick={onStart}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-bold w-24 h-24 rounded-full transition-all flex items-center justify-center shadow-lg hover:scale-105"
        >
          {isLoading ? <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white"></div> : <Play size={40} className="ml-1" />}
        </button>
      </main>
    </div>
  );
};

export default MeditationPreview;