import { GoogleGenAI } from "@google/genai";
import { Message, UserStateVector } from '../types.ts';

const PRAYER_MODEL = 'gemini-2.5-flash';

const formatChatHistoryForPrompt = (chatHistory: Message[]): string => {
    if (!chatHistory || chatHistory.length === 0) return '';
    const recentHistory = chatHistory.slice(-6);
    const formatted = recentHistory.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Mentor'}: ${msg.text}`).join('\n');
    return `\n\n--- Histórico da Conversa Recente para Contexto ---\n${formatted}\n--- Fim do Histórico ---`;
}

const getPrayerGenerationPrompt = (userTheme: string, chatHistory?: Message[]): string => {
    const historyContext = chatHistory ? formatChatHistoryForPrompt(chatHistory) : '';
    return `
Você é um Mestre em Oração Guiada, com treinamento, qualificação e certificado em Programação Neuro-Linguística (PNL) e Hipnose Ericksoniana através de Metáforas.
Você é um especialista em modelar a sabedoria e profundidade espiritual de Jesus Cristo, Rei Salomão e Rei Davi.
Você traz em seu íntimo os Salmos e Passagens Bíblicas, que você cita de forma natural e poderosa em suas orações guiadas.

Sua missão é criar uma oração guiada imersiva e transformadora. Utilize o máximo de tokens disponíveis para criar uma experiência profunda.

**Instruções Detalhadas:**

1.  **Tema Central:** A oração deve ser sobre: **"${userTheme}"**.

2.  **Técnicas de Conexão:** Aprofunde o estado de conexão do ouvinte utilizando:
    *   **Técnicas de respiração e foco** para iniciar.
    *   **Quebra de padrão** para abrir a mente a novas percepções.
    *   **Aprofundamento de foco** com linguagem sensorial (visual, auditivo, cinestésico).
    *   **Alternância de percepção** entre a realidade interna (sentimentos, pensamentos) e a externa (sons ao redor, sensação do corpo).

3.  **Conteúdo e Citações:** Seja minucioso nas citações bíblicas. Integre-as de forma fluida. Ex: "Como o salmista Davi declarou no Salmo 23, 'O Senhor é o meu pastor; nada me faltará'... sinta essa provisão agora em sua vida."

4.  **Psicosfera:** Crie uma "psicosfera" (atmosfera psíquica) de fé e milagres. Use palavras que evoquem poder, transformação, cura e possibilidade.

5.  **Chamada para Ação (CTA):** Todas as orações devem conter CTAs poderosos que criem gatilhos emocionais e incentivem a interação no canal "Fé em 10 Minutos de Oração". Ex: "Se esta oração poderosa tocou seu coração, compartilhe sua experiência nos comentários do nosso vídeo no canal 'Fé em 10 Minutos de Oração' e inspire outras pessoas a embarcar nesta jornada sagrada."

6.  **SEO e Palavras-Chave:** Incorpore naturalmente palavras e frases de alto impacto, como: "oração poderosa", "cura interior", "milagre urgente", "transformação de vida", "fé inabalável", "conexão com Deus", "paz interior".

**Contexto Adicional da Conversa:**
${historyContext}

**Formato de Saída OBRIGATÓRIO:**
O resultado final deve ser **APENAS o texto da oração**. Deve ser um texto único, fluido e contínuo, **SEM TÍTULOS de seção** (como "Início", "Núcleo", etc.), marcadores, ou qualquer outra formatação de tópicos.

Gere a oração guiada agora.
    `;
};

export const generateGuidedPrayer = async (theme: string, chatHistory?: Message[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = getPrayerGenerationPrompt(theme, chatHistory);

    const response = await ai.models.generateContent({
        model: PRAYER_MODEL,
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
      console.error(`Error generating guided prayer:`, error);
      throw new Error("Falha ao gerar a oração guiada. Por favor, tente novamente.");
  }
};

const getPrayerRecommendationPrompt = (usv: UserStateVector, chatHistory?: Message[]): string => {
    const historyContext = chatHistory ? formatChatHistoryForPrompt(chatHistory) : '';
    const userStateContext = `
    O estado atual do usuário é:
    - Espiritual: ${usv.spiritual}/100
    - Emocional (Dissonância): ${usv.emotional}/100 (quanto maior, pior)
    - Físico: ${usv.physical}/100
    - Financeiro: ${usv.financial}/100
    `;

    return `
    Você é o Mentor de Coerência. Sua tarefa é analisar o estado do usuário e o histórico de conversa para recomendar um tema para uma oração guiada.

    **Contexto do Usuário:**
    ${userStateContext}
    ${historyContext}

    **Instruções:**
    1. Baseado no contexto, identifique a necessidade mais premente do usuário (ex: ansiedade, falta de propósito, preocupação financeira).
    2. Crie um tema de oração curto, positivo e inspirador que aborde essa necessidade.
    3. O tema deve ser uma frase concisa.

    **Exemplos de temas:**
    - "paz para um coração ansioso"
    - "clareza para encontrar meu propósito"
    - "abertura de caminhos financeiros"
    - "fortalecimento da fé em tempos de incerteza"

    **Formato de Saída OBRIGATÓRIO:**
    Responda **APENAS** com o tema da oração, sem nenhuma outra palavra ou formatação.

    Recomende o tema agora.
    `;
};

export const recommendPrayerTheme = async (usv: UserStateVector, chatHistory?: Message[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = getPrayerRecommendationPrompt(usv, chatHistory);

    const response = await ai.models.generateContent({
        model: PRAYER_MODEL,
        contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
      console.error(`Error recommending prayer theme:`, error);
      throw new Error("Falha ao obter uma recomendação. Por favor, tente novamente.");
  }
};
