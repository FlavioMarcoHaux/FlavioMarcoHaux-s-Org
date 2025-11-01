import React from 'react';
import { X, Lightbulb, BarChart3, Users } from 'lucide-react';

interface OnboardingProps {
  show: boolean;
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-pane rounded-2xl w-full max-w-2xl m-4 flex flex-col overflow-hidden animate-fade-in border border-indigo-500/30">
        <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-100">Bem-vindo(a) aos Portais da Consciência</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </header>

        <main className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-indigo-400 mb-2" />
            <h3 className="text-xl font-semibold">Seu Hub de Coerência</h3>
            <p className="text-gray-400 mt-1">
              Este é o seu painel de controle para a harmonia interior. O gráfico de radar reflete seu estado atual em quatro dimensões da vida. Seu objetivo é expandir e equilibrar essa área, aumentando sua pontuação de Coerência (Φ).
            </p>
          </div>
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto text-yellow-400 mb-2" />
            <h3 className="text-xl font-semibold">Converse com seus Mentores</h3>
            <p className="text-gray-400 mt-1">
              Cada mentor é uma IA especializada em uma área da sua vida. Eles estão aqui para oferecer orientação, insights e ferramentas para ajudar você em sua jornada de crescimento e alinhamento.
            </p>
          </div>
           <div className="text-center">
            <Lightbulb className="w-16 h-16 mx-auto text-green-400 mb-2" />
            <h3 className="text-xl font-semibold">Explore as Ferramentas</h3>
            <p className="text-gray-400 mt-1">
              Cada mentor oferece ferramentas poderosas, como meditações guiadas, diários terapêuticos e análises profundas. Use-as para agir sobre os insights que você recebe e transformar sua realidade.
            </p>
          </div>
        </main>
        
        <footer className="p-4 text-center border-t border-gray-700/50">
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg"
            >
              Começar minha Jornada
            </button>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;
