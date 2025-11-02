import React from 'react';
import { useAistudioKeyManager } from '../hooks/useAistudioKey.ts';
import ApiKeySelector from './ApiKeySelector.tsx';
import { Loader2 } from 'lucide-react';

interface ApiKeyWrapperProps {
  children: React.ReactNode;
}

const ApiKeyWrapper: React.FC<ApiKeyWrapperProps> = ({ children }) => {
    const { hasKey, selectKey } = useAistudioKeyManager(true);

    if (hasKey === null) {
        return (
             <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
                <p className="text-gray-400 mt-4">Verificando API Key...</p>
            </div>
        );
    }
    
    if (!hasKey) {
        return <ApiKeySelector onKeySelect={selectKey} />;
    }

    return <>{children}</>;
};

export default ApiKeyWrapper;
