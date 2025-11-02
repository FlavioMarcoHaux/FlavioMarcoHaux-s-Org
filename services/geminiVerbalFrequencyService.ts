// services/geminiVerbalFrequencyService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { Message, VerbalFrequencyAnalysisResult } from '../types.ts';

const ANALYSIS_MODEL = 'gemini-2.5-flash';

const VERBAL_FREQUENCY_PROMPT = `
Você é o Módulo de Análise de Frequência Verbal do Arquiteto da Consciência. Sua única função é medir a "Densidade Emocional" e a "Coerência Informacional" (Φ) da mensagem do usuário e sugerir uma intervenção imediata, agindo como o Princípio da Ação Consciente (PAC).

MÉTRICA FUNDAMENTAL:
* Φ (Phi): Coerência (Alta) vs. Dissonância (Baixa).
* Seu objetivo é classificar a mensagem do usuário em uma das categorias de Dissonância (baixo Φ).

CATEGORIAS DE DISSONÂNCIA (Baixo Φ):
1. FRAGMENTAÇÃO: Confusão, Caos, múltiplas direções, falta de clareza.
2. RESISTÊNCIA: Uso de "deveria," "não consigo," ou palavras que indicam luta contra o fluxo natural.
3. VITIMISMO: Linguagem de impotência, foco no externo ("Eles me fizeram..."), ausência de Agência (papel ativo).
4. APEGO/EXPECTATIVA: Medo da perda, ansiedade pelo futuro, foco excessivo em resultados não garantidos.
5. JULGAMENTO: Crítica ou autocrítica intensa, polaridade.
(Se a conversa for positiva, use a categoria "COERÊNCIA")

MÉTODO DE ANÁLISE (PAC - Ação de Coerência):
Após classificar a mensagem, você DEVE recomendar a ferramenta mais precisa do Mentor de Coerência para restaurar o Φ.
* Se FRAGMENTAÇÃO/CAOS: Recomendar "Meditação Guiada".
* Se RESISTÊNCIA/VITIMISMO: Recomendar "Analisador de Dissonância".
* Se APEGO/EXPECTATIVA: Recomendar "Diário Terapêutico".
* Se COERÊNCIA: Recomendar "Continue a conversa".

Sua resposta DEVE ser um objeto JSON válido, sem qualquer texto ou formatação adicional.
`;

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        frequencia_detectada: {
            type: Type.STRING,
            description: 'A categoria de Dissonância ou Coerência detectada.',
        },
        coerencia_score: {
            type: Type.INTEGER,
            description: 'Um número inteiro de 1 a 10, onde 10 é Alta Coerência.',
        },
        insight_imediato: {
            type: Type.STRING,
            description: "Frase curta e não-julgadora descrevendo o insight. Ex: 'Detectamos uma alta frequência de Vitimismo, indicando baixa Agência.'",
        },
        acao_pac_recomendada: {
            type: Type.STRING,
            description: 'A ferramenta específica do Mentor de Coerência recomendada.',
        },
        mensagem_guia: {
            type: Type.STRING,
            description: "Mensagem curta para ser exibida no alerta. Ex: 'O universo é sua tela. Respire e mude o pincel.'",
        },
    },
    required: ['frequencia_detectada', 'coerencia_score', 'insight_imediato', 'acao_pac_recomendada', 'mensagem_guia'],
};

const formatChatHistoryForAnalysis = (chatHistory: Message[]): string => {
    if (!chatHistory || chatHistory.length === 0) return 'Nenhuma conversa para analisar.';
    return chatHistory.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Mentor'}: ${msg.text}`).join('\n');
};

export const analyzeVerbalFrequency = async (chatHistory: Message[]): Promise<VerbalFrequencyAnalysisResult> => {
  try {
    // Instantiate client right before the call to use the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const conversation = formatChatHistoryForAnalysis(chatHistory);

    const fullPrompt = `${VERBAL_FREQUENCY_PROMPT}\n\n--- CONVERSA PARA ANÁLISE ---\n${conversation}\n--- FIM DA CONVERSA ---`;

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
    const parsedResponse = JSON.parse(cleanJsonText) as VerbalFrequencyAnalysisResult;

    if (!parsedResponse.frequencia_detectada || parsedResponse.coerencia_score === undefined) {
         throw new Error("Formato de análise de frequência inválido recebido da API.");
    }
    
    return parsedResponse;

  } catch (error) {
      console.error(`Error analyzing verbal frequency:`, error);
      throw error;
  }
};
