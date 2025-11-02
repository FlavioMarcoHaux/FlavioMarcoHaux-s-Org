import { GoogleGenAI, Type } from "@google/genai";
import { Message, DissonanceAnalysisResult } from '../types.ts';

const ANALYSIS_MODEL = 'gemini-2.5-flash';

const DISSONANCE_ANALYSIS_PROMPT = `
Você é o Analisador de Dissonância, uma ferramenta do Mentor de Coerência. Sua missão é traduzir a linguagem do usuário em padrões de informação dissonantes (baixo Φ), seguindo o Princípio da Informação Consciente (PIC) e o Metamodelo da PNL.

OBJETIVO DA ANÁLISE:
1. Detectar padrões de Dissonância (Crenças Limitantes) no texto do usuário.
2. Identificar o Tema Emocional Central que está causando o baixo Φ.
3. Gerar um Insight Terapêutico de alta Coerência (Alto Φ).

MÉTODO DE ANÁLISE (Metamodelo da PNL):
- OMISSÃO: Omissão de sujeitos ("Não consigo"). Omissão de comparação ("É difícil").
- GENERALIZAÇÃO: Uso de quantificadores universais ("Sempre", "Nunca", "Todos").
- DISTORÇÃO: Leitura Mental ("Ele deve estar pensando..."). Causa-Efeito ("A situação me deixa ansioso.").

Sua resposta DEVE ser um objeto JSON válido, sem nenhum texto ou formatação adicional (como \`\`\`json).
`;

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        tema: {
            type: Type.STRING,
            description: 'O Tema Emocional Central (O Insight). Ex: Medo da Escassez e Impotência.',
        },
        padrao: {
            type: Type.STRING,
            description: 'O Padrão de Dissonância Principal detectado. Ex: Generalização ("Nunca", "Impossível").',
        },
        insight: {
            type: Type.STRING,
            description: 'O Insight Terapêutico (A "Pílula de Coerência"). Ex: "Seu sistema de crenças está operando sob uma regra de informação absoluta (\'nunca\'). Para restaurar a coerência (Φ), identifique um único momento na vida onde a regra foi quebrada. Sua verdade não é \'nunca\', mas sim a possibilidade de escolha."',
        },
    },
    required: ['tema', 'padrao', 'insight'],
};

const formatChatHistoryForAnalysis = (chatHistory: Message[]): string => {
    if (!chatHistory || chatHistory.length === 0) return 'Nenhuma conversa para analisar.';
    // Filter for user messages and join them.
    return chatHistory
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .join('\n');
};

export const analyzeDissonance = async (chatHistory: Message[]): Promise<DissonanceAnalysisResult> => {
  try {
    // Instantiate client right before the call to use the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userConversation = formatChatHistoryForAnalysis(chatHistory);

    const fullPrompt = `${DISSONANCE_ANALYSIS_PROMPT}\n\n--- CONVERSA DO USUÁRIO PARA ANÁLISE ---\n${userConversation}\n--- FIM DA CONVERSA ---`;

    const response = await ai.models.generateContent({
        model: ANALYSIS_MODEL,
        contents: fullPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
        },
    });
    
    const jsonText = response.text.trim();
    const cleanJsonText = jsonText.startsWith('```json') ? jsonText.replace(/```json\n?/, '').replace(/```$/, '') : jsonText;

    const parsedResponse = JSON.parse(cleanJsonText) as DissonanceAnalysisResult;

    if (!parsedResponse.tema || !parsedResponse.padrao || !parsedResponse.insight) {
         throw new Error("Formato de análise inválido recebido da API.");
    }
    
    return parsedResponse;

  } catch (error) {
      console.error(`Error analyzing dissonance:`, error);
      throw error;
  }
};
