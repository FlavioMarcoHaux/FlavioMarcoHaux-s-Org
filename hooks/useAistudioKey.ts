import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';

// Use a simple zustand store to manage the key state globally
// This allows other parts of the app (like the main store's error handler)
// to reset the key state if an API call fails due to an invalid key.
interface AistudioKeyState {
    hasKey: boolean | null;
    setHasKey: (hasKey: boolean | null) => void;
    resetKey: () => void;
}
export const useAistudioKey = create<AistudioKeyState>((set) => ({
    hasKey: null,
    setHasKey: (hasKey) => set({ hasKey }),
    resetKey: () => set({ hasKey: false }),
}));


// This is the hook that components will use
export const useAistudioKeyManager = (enabled: boolean = true) => {
    const { hasKey, setHasKey } = useAistudioKey();

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
    }, [enabled, setHasKey]);
    
    useEffect(() => {
        // Only check the key on initial mount if the status is unknown
        if (hasKey === null) {
            checkKey();
        }
    }, [checkKey, hasKey]);
    
    const selectKey = useCallback(async () => {
        if (!enabled || !window.aistudio) return;
        try {
            await window.aistudio.openSelectKey();
            // Assume success and optimistically update state.
            // A subsequent API call will fail if they cancel, which will then reset the key state.
            setHasKey(true);
        } catch (error) {
            console.error("Error opening AI Studio key selection:", error);
        }
    }, [enabled, setHasKey]);

    return { hasKey, selectKey, checkKey };
};


declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio?: AIStudio;
    }
}
