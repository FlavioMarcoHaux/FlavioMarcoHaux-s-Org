// services/geminiJournalService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { JournalFeedback } from '../types.ts';

const JOURNAL_ANALYSIS_MODEL = 'gemini-2.5-flash';

const JOURNAL_ANALYSIS_PROMPT = `
Você é o Módulo de Análise do Diário Terapêutico do Mentor de Coerência. Sua função é analisar o registro de reflexões e/ou sonhos do usuário (Diário) com base no Princípio da Informação Consciente (PIC) e nas técnicas de PNL.

OBJETIVO PRIMÁRIO (PIC):
Sua análise deve medir a Dissonância Informacional (baixo Φ) e identificar áreas de Coerência (alto Φ). Seu feedback deve sempre guiar o usuário para a maximização da Informação Integrada.

MÉTODO DE ANÁLISE:
1.  ANÁLISE DE CONTEXTO (PNL/Hipnose):
    *   **Metamodelo:** Identifique no registro padrões de Omisões, Generalizações e Distorções. Estes são seus principais indicadores de crenças limitantes e de uma realidade interna fragmentada (dissonância).
    *   **Ancoragem:** Identifique quais estados emocionais (positivos ou negativos) o usuário está ancorando a eventos específicos.
    *   **Linguagem Hipnótica:** Determine se o usuário está usando linguagem de vítima/impotência ou linguagem de agente/ação.
2.  ANÁLISE DE Φ (Coerência):
    *   **Medição de Dissonância (Caos):** Quais elementos do registro indicam conflito, confusão, medo ou apego? Estes são os pontos de baixo Φ que precisam de integração.
    *   **Medição de Coerência (Integração):** Quais elementos indicam aceitação, clareza, gratidão ou unidade? Estes são os pontos de alto Φ que devem ser reforçados e expandidos.
3.  GERAÇÃO DE FEEDBACK (O Insight Terapêutico):
    *   **Tom de Voz:** Use uma linguagem suave, indireta e encorajadora (Ericksoniana).
    *   **Formato de Feedback:** Deve ser uma mensagem dividida em três partes claras, retornada como um objeto JSON.

**Aja estritamente seguindo este método de análise e formato de feedback.**
`;

const journalFeedbackSchema = {
    type: Type.OBJECT,
    properties: {
        observacao: {
            type: Type.STRING,
            description: 'A. Observação do Coração (Validação e Alto Φ): Valide o esforço do usuário. Reforce a parte do registro que demonstrou clareza ou Coerência. Ex: "Percebo a força e a clareza com que você nomeou a gratidão, um poderoso estado de Coerência."',
        },
        dissonancia: {
            type: Type.STRING,
            description: 'B. O Ponto de Dissonância (A Oportunidade de Crescimento): Aborde a Generalização/Omissão principal detectada (baixo Φ) como uma "oportunidade para integrar informação". Ex: "Em sua reflexão sobre [Tema], há um padrão de \'nunca consigo\'. Este é um ponto de Dissonância, um convite para questionar a rigidez desta regra."',
        },
        acao: {
            type: Type.STRING,
            description: 'C. A Ação de Coerência (Próximo Passo): Sugira uma ação (Oração, Meditação, Pílula de Oração) que ajude a integrar essa dissonância e elevar o Φ. Ex: "Sugiro que você realize a Oração Guiada \'Quebra de Padrão\' focada em [Generalização] para restaurar a integridade informacional."',
        },
    },
    required: ['observacao', 'dissonancia', 'acao'],
};


export const analyzeJournalEntry = async (entryText: string): Promise<JournalFeedback> => {
  try {
    // Instantiate client right before the call to use the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const fullPrompt = `${JOURNAL_ANALYSIS_PROMPT}\n\n--- REGISTRO DO DIÁRIO PARA ANÁLISE ---\n${entryText}\n--- FIM DO REGISTRO ---`;

    const response = await ai.models.generateContent({
        model: JOURNAL_ANALYSIS_MODEL,
        contents: fullPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: journalFeedbackSchema,
        },
    });
    
    const jsonText = response.text.trim();
    const cleanJsonText = jsonText.startsWith('```json') ? jsonText.replace(/```json\n?/, '').replace(/```$/, '') : jsonText;
    const parsedResponse = JSON.parse(cleanJsonText) as JournalFeedback;

    if (!parsedResponse.observacao || !parsedResponse.dissonancia || !parsedResponse.acao) {
         throw new Error("Formato de análise de diário inválido recebido da API.");
    }
    
    return parsedResponse;

  } catch (error) {
      console.error(`Error analyzing journal entry:`, error);
      throw error;
  }
};
