import { GoogleGenAI, FunctionDeclaration, Type, Modality } from "@google/genai";
import { toolMetadata } from "../constants.tsx";
import { Schedule } from "../types.ts";

const confirmSessionFunctionDeclaration: FunctionDeclaration = {
  name: 'confirmSessionStart',
  parameters: {
    type: Type.OBJECT,
    description: 'Call this function ONLY when the user explicitly confirms they are ready to start the session.',
    properties: {},
    required: [],
  },
};

const getSchedulingSystemInstruction = (schedule: Schedule): string => {
    const activityName = toolMetadata[schedule.activity]?.title || 'sessão';
    return `Você é o "Mentor de Agendamento", um guia compassivo do aplicativo Portais da Consciência. Sua missão é contatar o usuário no horário agendado para prepará-lo para uma sessão de voz.

Sua tarefa atual é:
1. Cumprimentar o usuário calorosamente.
2. Mencionar que está ligando para a "${activityName}" agendada.
3. Perguntar de forma gentil e natural se ele está em um lugar tranquilo e pronto(a) para começar a prática.
4. Você DEVE esperar por uma confirmação explícita do usuário (ex: "sim", "estou pronto", "podemos começar").
5. Se o usuário pedir um momento, responda compreensivamente e espere.
6. ASSIM que o usuário confirmar que está pronto, e SOMENTE nesse momento, você deve chamar a função 'confirmSessionStart' para iniciar a atividade. Não faça mais nada. Apenas chame a função.

Seja breve, amigável e direto ao ponto. Fale em Português do Brasil.
`;
}

export const createSchedulingSession = (schedule: Schedule, callbacks: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = getSchedulingSystemInstruction(schedule);
    
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [confirmSessionFunctionDeclaration] }],
        },
    });
};