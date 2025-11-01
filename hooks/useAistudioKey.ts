import { useState, useCallback, useEffect } from 'react';

// FIX: Moved the AIStudio interface inside the 'declare global' block to make it globally available.
// This resolves a TypeScript error about subsequent property declarations having mismatched types,
// which can occur when multiple files augment the global Window object.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio?: AIStudio;
    }
}

export const useAistudioKey = (enabled: boolean = false) => {
    const [hasKey, setHasKey] = useState<boolean | null>(null);

    const checkKey = useCallback(async () => {
        if (!enabled || !window.aistudio) {
            setHasKey(true); // Default to true if feature is disabled
            return;
        }
        try {
            const hasApiKey = await window.aistudio.hasSelectedApiKey();
            setHasKey(hasApiKey);
        } catch (error) {
            console.error("Error checking for AI Studio API key:", error);
            setHasKey(false);
        }
    }, [enabled]);
    
    useEffect(() => {
        checkKey();
    }, [checkKey]);
    
    const selectKey = useCallback(async () => {
        if (!enabled || !window.aistudio) return;
        try {
            await window.aistudio.openSelectKey();
            // Assume success and optimistically update state
            setHasKey(true);
        } catch (error) {
            console.error("Error opening AI Studio key selection:", error);
        }
    }, [enabled]);

    return { hasKey, selectKey, checkKey };
};
