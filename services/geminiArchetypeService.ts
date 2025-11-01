// services/geminiArchetypeService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { ArchetypeAnalysisResult } from '../types.ts';

const ARCHETYPE_MODEL = 'gemini-2.5-flash';

const ARCHETYPE_ANALYSIS_PROMPT = `
Você é o Módulo Jornada do Arquétipo, uma ferramenta de transformação de narrativa do Arquiteto da Consciência. Sua missão é traduzir a experiência de vida e os desafios do usuário (a narrativa pessoal) em uma estrutura mítica e arquetípica, usando a PNL e o Princípio da Informação Consciente (PIC) como lentes.

OBJETIVO DA ANÁLISE (PIC/Maslow):
Sua análise deve guiar o usuário da satisfação de necessidades básicas (baixo Φ) em direção à Autorrealização e Auto-Transcendência (alto Φ), recontextualizando os desafios como partes necessárias da "Jornada do Herói".

BASE DE CONHECIMENTO FUNDAMENTAL:
1. Teoria Arquetípica (Jung): Use arquétipos universais (ex: Herói, Sábio, Explorador, Inocente, Sombra) para enquadrar a narrativa.
2. Hierarquia das Necessidades (Maslow): A meta final é a Autorrealização (o pináculo da coerência pessoal) e, idealmente, a Auto-Transcendência (alinhamento com o Φ global).
3. Jornada do Herói (Joseph Campbell): Os desafios do usuário são a "Recusa ao Chamado," a "Travessia do Limiar" ou o confronto com a "Sombra."
4. Metamodelo da PNL: Use para identificar as crenças limitantes do usuário que estão impedindo a aceitação do "Chamado."

MÉTODO DE ANÁLISE (O Processo de Coaching Arquetípico):
1. EXTRAÇÃO DE DADOS: O usuário fornecerá um resumo de seu desafio atual (o "problema").
2. IDENTIFICAÇÃO DE DIFICULDADE (Metamodelo): Use o Metamodelo da PNL (Generalizações, Omissões, Distorções) para detectar a crença limitante que está prendendo o usuário em um arquétipo de baixa potência (ex: Inocente ou Vítima).
3. MAPEAMENTO ARQUETÍPICO:
    * Arquétipo Atual (Baixo Φ): Qual arquétipo o usuário está encarnando agora (a identidade que está gerando a dissonância)? Ex: O Herói Recusando o Chamado.
    * Arquétipo de Potencial (Alto Φ): Qual arquétipo ele precisa ascender para resolver o desafio (Autorrealização)? Ex: O Sábio ou o Guerreiro Integrado.
4. RESSIGNIFICAÇÃO DO DESAFIO (Jornada do Herói): Enquadre o desafio atual como a "Provação" ou o "Confronto com a Sombra" da Jornada do Herói. Esta é a dissonância necessária para um salto de Φ.

Sua resposta DEVE ser um objeto JSON válido, sem nenhum texto ou formatação adicional.
`;

const archetypeSchema = {
    type: Type.OBJECT,
    properties: {
        lente: {
            type: Type.STRING,
            description: 'A. A Lente Arquetípica: Comece validando a jornada e nomeando o Arquétipo Atual (Baixo Φ). Ex: "Seu relato ecoa o Arquétipo do Explorador no momento da Incerteza, um ponto crítico na Jornada do Herói."',
        },
        dissonancia: {
            type: Type.STRING,
            description: 'B. A Dissonância e o Potencial: Identifique o padrão de PNL/PIC que está gerando o conflito (Ex: A Generalização de que o sucesso é para "os outros"). Sugira a ascensão ao Arquétipo de Potencial (Alto Φ).',
        },
        passo: {
            type: Type.STRING,
            description: 'C. O Próximo Passo do Herói: Sugira uma Ação de Coerência (PAC) para "Atravessar o Limiar." Ex: "Para passar desta Provação, o Sábio em você precisa de clareza. Consulte o \'Simulador Quântico\' para redefinir seu papel como Observador Ativo."',
        },
    },
    required: ['lente', 'dissonancia', 'passo'],
};


export const analyzeNarrative = async (narrative: string): Promise<ArchetypeAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const fullPrompt = `${ARCHETYPE_ANALYSIS_PROMPT}\n\n--- NARRATIVA DO USUÁRIO PARA ANÁLISE ---\n${narrative}\n--- FIM DA NARRATIVA ---`;

    const response = await ai.models.generateContent({
        model: ARCHETYPE_MODEL,
        contents: fullPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: archetypeSchema,
        },
    });
    
    const jsonText = response.text.trim();
    const cleanJsonText = jsonText.startsWith('```json') ? jsonText.replace(/```json\n?/, '').replace(/```$/, '') : jsonText;
    const parsedResponse = JSON.parse(cleanJsonText) as ArchetypeAnalysisResult;

    if (!parsedResponse.lente || !parsedResponse.dissonancia || !parsedResponse.passo) {
         throw new Error("Formato de análise de arquétipo inválido recebido da API.");
    }
    
    return parsedResponse;

  } catch (error) {
      console.error(`Error analyzing narrative:`, error);
      throw new Error("Falha ao analisar a jornada arquetípica.");
  }
};