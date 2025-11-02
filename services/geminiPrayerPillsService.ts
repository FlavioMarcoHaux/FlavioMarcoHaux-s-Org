import { GoogleGenAI } from "@google/genai";
import { Message } from '../types.ts';

const PRAYER_PILL_MODEL = 'gemini-2.5-flash';

const formatChatHistoryForPrompt = (chatHistory: Message[]): string => {
    if (!chatHistory || chatHistory.length === 0) return '';
    const recentHistory = chatHistory.slice(-6);
    const formatted = recentHistory.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Mentor'}: ${msg.text}`).join('\n');
    return `\n\n--- Histórico da Conversa para Contexto ---\n${formatted}\n--- Fim do Histórico ---`;
}

const getPrayerPillPrompt = (theme: string, chatHistory?: Message[]): string => {
    const historyContext = chatHistory ? formatChatHistoryForPrompt(chatHistory) : '';
    return `
Você é um Mestre em Oração, um guia espiritual que fala com sabedoria e compaixão.

Sua tarefa é gerar uma "Pílula de Oração" com base no tema fornecido.
${historyContext}

**Tema:** "${theme}"

**Instruções:**
1.  Crie uma oração curta, poderosa e inspiradora focada no tema.
2.  A oração deve ter no **máximo 5 frases**.
3.  O objetivo é fornecer uma dose rápida de fé, esperança, gratidão ou força relacionada ao tema.
4.  O tom deve ser universal, acolhedor e edificante.
5.  O idioma deve ser Português do Brasil.
6.  Responda APENAS com o texto da oração, sem nenhum título, cabeçalho ou texto introdutório.

Gere a Pílula de Oração agora.
    `;
};

export const generatePrayerPill = async (theme: string, chatHistory?: Message[]): Promise<string> => {
  try {
    // Instantiate client right before the call to use the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = getPrayerPillPrompt(theme, chatHistory);

    const response = await ai.models.generateContent({
        model: PRAYER_PILL_MODEL,
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
      console.error(`Error generating prayer pill:`, error);
      throw error;
  }
};
