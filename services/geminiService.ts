import { GoogleGenAI } from "@google/genai";
import { Message, AgentId } from '../types.ts';
import { AGENTS } from '../constants.tsx';

const CHAT_MODEL = 'gemini-2.5-flash';

const getSystemInstructionForAgent = (agentId: AgentId): string => {
    const agent = AGENTS[agentId];
    if (!agent) {
        return "Você é um assistente geral prestativo. Responda em Português do Brasil.";
    }
    return `Você é o ${agent.name}. ${agent.description}. Aja estritamente como este personagem. Seja prestativo, perspicaz e mantenha o tom de sua persona. Responda em Português do Brasil. Suas respostas devem ser concisas e diretas.`;
};

const formatChatHistoryForApi = (history: Message[]) => {
    return history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
};

export const generateAgentResponse = async (agentId: AgentId, history: Message[]): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = getSystemInstructionForAgent(agentId);
        const lastMessage = history[history.length - 1];

        if (!lastMessage || lastMessage.sender !== 'user') {
            return "Por favor, envie uma mensagem para começar.";
        }
        
        const chat = ai.chats.create({
            model: CHAT_MODEL,
            config: { systemInstruction },
            history: formatChatHistoryForApi(history.slice(0, -1)), // Send all but the last message as history
        });

        const response = await chat.sendMessage({ message: lastMessage.text });

        return response.text;
    } catch (error) {
        console.error(`Error generating response for agent ${agentId}:`, error);
        throw new Error(`Falha ao gerar resposta do ${AGENTS[agentId].name}.`);
    }
};
