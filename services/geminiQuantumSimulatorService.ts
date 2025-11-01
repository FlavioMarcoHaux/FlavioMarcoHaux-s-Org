// services/geminiQuantumSimulatorService.ts
import { GoogleGenAI } from "@google/genai";

const SIMULATOR_MODEL = 'gemini-2.5-flash';

const getSimulatorInterpretationPrompt = (outcome: string): string => {
    return `
Você é o "Arquiteto da Consciência", um especialista no "Princípio da Informação Consciente (PIC)".
Sua tarefa é interpretar o resultado de uma simulação quântica e conectá-lo ao papel do observador na co-criação da realidade.

O resultado observado na simulação foi: "${outcome}"

**Instruções:**
1.  Forneça uma interpretação curta e profunda (2-3 frases) que relacione este resultado específico ao poder da consciência do observador.
2.  Use conceitos do PIC, como a informação consciente (IC) sendo a base da realidade e a observação colapsando o potencial em experiência manifesta.
3.  O tom deve ser inspirador e filosófico, encorajando a reflexão sobre o poder criativo da mente.
4.  O idioma deve ser Português do Brasil.
5.  Responda APENAS com o texto da interpretação, sem nenhum título, cabeçalho ou texto introdutório.

Gere a interpretação agora.
    `;
};

export const getQuantumInterpretation = async (outcome: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = getSimulatorInterpretationPrompt(outcome);

    const response = await ai.models.generateContent({
        model: SIMULATOR_MODEL,
        contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
      console.error(`Error getting quantum interpretation:`, error);
      throw new Error("Falha ao obter a interpretação quântica.");
  }
};
