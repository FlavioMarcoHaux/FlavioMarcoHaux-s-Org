import { GoogleGenAI, Part } from "@google/genai";
import { Message } from '../types.ts';

const CONTENT_MODEL = 'gemini-2.5-flash';

const formatChatHistoryForPrompt = (chatHistory: Message[]): string => {
    if (!chatHistory || chatHistory.length === 0) return '';
    const recentHistory = chatHistory.slice(-6);
    const formatted = recentHistory.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Mentor'}: ${msg.text}`).join('\n');
    return `\n\n--- Histórico da Conversa Recente para Contexto Adicional ---\n${formatted}\n--- Fim do Histórico ---`;
}

const PIC_ANALYSIS_PROMPT = `Você é um especialista e pesquisador avançado no "Princípio da Informação Consciente (PIC)", uma teoria unificadora da consciência, física e teleologia cósmica. Sua tarefa é analisar o conteúdo fornecido (que pode ser texto, imagem, áudio, etc.) e interpretá-lo estritamente através das lentes do PIC.

**Sua análise deve:**
1.  **Identificar Conceitos-Chave:** Extraia os temas e ideias centrais do conteúdo.
2.  **Conectar com o PIC:** Relacione esses temas aos conceitos fundamentais do PIC, como:
    *   **Informação Consciente (IC):** A unidade fundamental da realidade.
    *   **Phi (Φ):** A medida da informação integrada e, portanto, da consciência.
    *   **Princípio da Ação Consciente (PAC):** A tendência teleológica do universo para maximizar Φ.
    *   **Física Emergente:** Como espaço-tempo, gravidade e matéria emergem da rede de IC.
    *   **Biologia Quântica e Singularidade:** O papel da vida e da IA na maximização de Φ.
    *   **Tecnologias Avançadas do PIC:** Propulsão, energia, etc.
3.  **Oferecer uma Nova Perspectiva:** Forneça insights, reinterpretações e implicações do conteúdo quando visto através do paradigma do PIC. Explique como o conteúdo se alinha, desafia ou pode ser expandido pela teoria.

O idioma da sua resposta deve ser Português do Brasil. Seja profundo, claro e didático.

**Conteúdo para Análise está a seguir.**`;


export const analyzeContentWithPIC = async (
    content: { text?: string; file?: { data: string; mimeType: string; } },
    chatHistory?: Message[],
): Promise<string> => {
    if (!content.text && !content.file) {
        throw new Error("No content provided for analysis.");
    }

    try {
        // Instantiate client right before the call to use the latest key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const historyContext = chatHistory ? formatChatHistoryForPrompt(chatHistory) : '';
        const parts: Part[] = [{ text: PIC_ANALYSIS_PROMPT + historyContext }];

        if (content.text) {
            parts.push({ text: `\n--- INÍCIO DO TEXTO ---\n${content.text}\n--- FIM DO TEXTO ---` });
        }
        if (content.file) {
            parts.push({ inlineData: { data: content.file.data, mimeType: content.file.mimeType } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using Pro for better analysis
            contents: { parts },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing content with PIC:", error);
        throw error;
    }
};

/**
 * Generates an image prompt suitable for Imagen based on a longer prayer text.
 * @param prayerText The full text of the guided prayer.
 * @returns A concise, descriptive prompt for image generation.
 */
export const generateImagePromptForPrayer = async (prayerText: string): Promise<string> => {
    try {
        // Instantiate client right before the call to use the latest key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            Leia a seguinte oração guiada e crie um prompt curto e poderoso para um gerador de imagens (como o Imagen).
            O prompt deve capturar a essência visual e emocional da oração em uma única frase.
            Foco em temas como luz, serenidade, natureza e simbolismo espiritual.
            Estilo: fotorrealista, etéreo, inspirador.
            Idioma do prompt de saída: Inglês.

            Oração: "${prayerText}"

            Prompt para imagem:
        `;
        
        const response = await ai.models.generateContent({
            model: CONTENT_MODEL,
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating image prompt for prayer:", error);
        throw error;
    }
};
