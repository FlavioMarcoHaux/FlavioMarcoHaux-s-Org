import React from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface ApiKeySelectorProps {
    onKeySelect: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelect }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-800/50 rounded-lg">
            <KeyRound className="w-16 h-16 text-yellow-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Selecione sua Chave de API</h2>
            <p className="text-gray-400 max-w-md mb-6">
                Para usar esta ferramenta, você precisa selecionar sua própria chave de API do Gemini. Isso garante que o uso seja associado à sua conta.
            </p>
            <button
                onClick={onKeySelect}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-6 rounded-full text-lg transition-colors"
            >
                Selecionar Chave de API
            </button>
            <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-sm text-gray-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
            >
                Informações sobre faturamento <ExternalLink size={14} />
            </a>
        </div>
    );
};

export default ApiKeySelector;
