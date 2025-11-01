import { GoogleGenAI, Type } from '@google/genai';
import { Meditation, Message } from '../types.ts';

const SCRIPT_GENERATION_MODEL = 'gemini-2.5-flash';

// Define the schema for the meditation script
const meditationScriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Um título calmo e inspirador para a meditação.',
    },
    script: {
      type: Type.ARRAY,
      description: 'Uma série de frases para a meditação guiada.',
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: 'O texto a ser falado para esta parte da meditação. Deve ser uma frase curta e relaxante.',
          },
          duration: {
            type: Type.NUMBER,
            description: 'A duração estimada em milissegundos que esta frase deve levar para ser dita, incluindo uma pequena pausa depois. Entre 5000 e 10000ms.',
          },
        },
        required: ['text', 'duration'],
      },
    },
  },
  required: ['title', 'script'],
};


const formatChatHistoryForPrompt = (chatHistory: Message[]): string => {
    if (!chatHistory || chatHistory.length === 0) return '';
    const recentHistory = chatHistory.slice(-6); // Get last 6 messages for context
    const formatted = recentHistory.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Mentor'}: ${msg.text}`).join('\n');
    return `\n\n--- Histórico da Conversa Recente para Contexto ---\n${formatted}\n--- Fim do Histórico ---`;
}

export const generateMeditationScript = async (prompt: string, durationMinutes: number, chatHistory?: Message[]): Promise<Meditation> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const historyContext = chatHistory ? formatChatHistoryForPrompt(chatHistory) : '';

    const fullPrompt = `Gere um roteiro de meditação guiada com base no seguinte tema: "${prompt}".
A meditação deve ter aproximadamente ${durationMinutes} minutos de duração.
O roteiro deve ser uma série de frases curtas e relaxantes.
A resposta DEVE estar em formato JSON e seguir o schema fornecido.
O idioma deve ser Português do Brasil.
${historyContext}
`;

    const response = await ai.models.generateContent({
      model: SCRIPT_GENERATION_MODEL,
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: meditationScriptSchema,
      },
    });

    const jsonText = response.text.trim();
    // Gemini with JSON schema might still wrap the JSON in ```json ... ```
    const cleanJsonText = jsonText.startsWith('```json') ? jsonText.replace(/```json\n?/, '').replace(/```$/, '') : jsonText;
    
    const parsedResponse = JSON.parse(cleanJsonText);
    
    // Validate the response structure (simple check)
    if (!parsedResponse.title || !Array.isArray(parsedResponse.script)) {
        throw new Error("Invalid script format received from API.");
    }

    return {
      id: `gemini-meditation-${Date.now()}`,
      ...parsedResponse,
    };

  } catch (error) {
    console.error('Error generating meditation script:', error);
    throw new Error('Falha ao gerar o roteiro de meditação.');
  }
};