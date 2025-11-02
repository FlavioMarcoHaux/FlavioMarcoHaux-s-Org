

// utils/errorUtils.ts

/**
 * Parses Gemini API errors and returns a user-friendly message.
 * @param error The error object from a catch block.
 * @param defaultMessage A fallback message.
 * @returns A user-friendly error string.
 */
export const getFriendlyErrorMessage = (error: any, defaultMessage: string): string => {
    console.error("Handling Gemini Error:", error);

    let errorMessage = '';

    // Extract message from various error formats
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (error?.error?.message) {
        errorMessage = error.error.message;
    } else if (error && typeof error.toString === 'function') {
        errorMessage = error.toString();
    }
    
    // Check for quota exhausted error
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
        // Provide a more helpful message with a clickable link if possible in the UI
        return 'Você excedeu sua cota de uso da API. Por favor, verifique seu plano e faturamento. Para mais detalhes, acesse: ai.google.dev/gemini-api/docs/billing';
    }

    // Check for API key errors, including the "not found" case from Veo.
    if (errorMessage.includes("API key not found") || errorMessage.includes("permission denied") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("Requested entity was not found")) {
        return "Sua chave de API não foi encontrada ou é inválida. Por favor, selecione uma chave de API válida para continuar.";
    }
    
    // Check for bad request or invalid argument
    if (errorMessage.includes("400") && (errorMessage.includes("Invalid") || errorMessage.includes("request is invalid"))){
        return `Ocorreu um erro de requisição inválida. Por favor, verifique os dados e tente novamente.`
    }

    return defaultMessage;
};