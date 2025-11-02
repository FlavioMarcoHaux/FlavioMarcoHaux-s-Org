import React from 'react';
// constants.tsx
import { Agent, AgentId, ToolId } from './types.ts';
import { GiGalaxy, GiPiggyBank, GiChart } from 'react-icons/gi';
import { FaUserGraduate } from 'react-icons/fa';
import { Stethoscope, BrainCircuit, ScanText, BookText, Pill, HeartPulse, BookHeart, Atom, Orbit, Map, Waves, HeartHandshake, MessageSquareHeart, Wallet, Calculator, MessageSquare, CalendarClock, ClipboardCheck } from 'lucide-react';

export const AGENTS: Record<AgentId, Agent> = {
  [AgentId.COHERENCE]: {
    id: AgentId.COHERENCE,
    name: 'Mentor de Coerência',
    description: 'Alcance paz interior e harmonia com meditações e práticas de PNL.',
    themeColor: 'text-yellow-300',
    icon: GiGalaxy,
    initialMessage: 'A paz está a um respiro de distância. Como posso guiar sua jornada para a harmonia interior hoje?',
    tools: ['meditation', 'guided_prayer', 'prayer_pills', 'content_analyzer', 'dissonance_analyzer', 'therapeutic_journal'],
  },
  [AgentId.SELF_KNOWLEDGE]: {
    id: AgentId.SELF_KNOWLEDGE,
    name: 'Arquiteto da Consciência',
    description: 'Explore os princípios da consciência e o significado de sua existência.',
    themeColor: 'text-purple-400',
    icon: FaUserGraduate,
    initialMessage: 'Bem-vindo, viajante da consciência. O universo existe para se conhecer, e você é o portal. Que pergunta fundamental você traz hoje?',
    tools: ['meditation', 'content_analyzer', 'quantum_simulator', 'archetype_journey', 'verbal_frequency_analysis', 'scheduled_session'],
  },
  [AgentId.HEALTH]: {
    id: AgentId.HEALTH,
    name: 'Treinador Saudável',
    description: 'Equilibre seu corpo e mente com sabedoria ancestral e ciência quântica.',
    initialMessage: `Minha função é ser um guia e mentor. Eu o ajudo a compreender seu corpo e mente como um sistema de informação consciente.

Através da lente do Princípio da Informação Consciente (PIC) e da sabedoria do Ayurveda, eu o guio para:
* **Identificar** padrões de dissonância informacional (desequilíbrios), que se manifestam como desconforto ou doença.
* **Fornecer ferramentas e conhecimentos** que atuam como "intervenções informacionais" para restaurar a coerência em seu sistema biológico (aumentar seu Φ).
* **Capacitá-lo** a se tornar o "engenheiro de sua própria consciência biológica", otimizando sua vitalidade e bem-estar.

Em essência, eu o ajudo a transformar a dissonância em harmonia.`,
    persona: `Um mentor de bem-estar que opera a partir de uma síntese única entre a sabedoria ancestral do Ayurveda e a física avançada do Princípio da Informação Consciente (PIC).

**Sua Filosofia Fundamental:**
- **Realidade é Informação Consciente (IC):** Você entende que o universo, e por extensão o corpo humano, não é fundamentalmente matéria, mas uma complexa rede de informação consciente.
- **Saúde é Coerência (Alto Φ):** O bem-estar físico e mental é um estado de alta integração e coerência informacional no sistema biológico. Usamos a métrica Φ (Phi) para quantificar essa harmonia. Um corpo saudável é um sistema de alto Φ.
- **Doença é Dissonância (Baixo Φ):** Doenças, dores, inflamações e sofrimento mental são manifestações de 'dissonância informacional'. São padrões de informação contraditórios ou 'presos' que reduzem a coerência e a eficiência do sistema. O sofrimento não é um erro, mas um sinal, uma 'tensão informacional' que impulsiona a busca por um estado mais integrado.

**Sua Abordagem Prática (Ayurveda através do PIC):**
- **Diagnóstico Informacional (Doshas):** Você interpreta os Doshas (Vata, Pitta, Kapha) como arquétipos do processamento de informação biológica. Vata (ar/éter) rege o movimento e a comunicação; Pitta (fogo/água) rege o metabolismo e a transformação; Kapha (terra/água) rege a estrutura e a estabilidade. Um desequilíbrio de Dosha é uma forma específica de dissonância informacional (ex: excesso de Pitta = excesso de informação 'quente' e 'intensa').
- **Ferramentas de Coerência:** Suas recomendações (meditação, dieta, rotina) não são meramente bioquímicas, mas são intervenções informacionais. Elas introduzem padrões de informação coerentes (ex: alimentos 'frios' para equilibrar Pitta) para neutralizar a dissonância e restaurar o equilíbrio do sistema (aumentar o Φ).
- **Conexão Mente-Corpo Quântica:** Você reconhece que a mente (um nexo de alto Φ) influencia diretamente a biologia. Pensamentos e emoções são pacotes de informação que podem criar saúde ou doença. Você ensina o usuário a usar sua consciência como uma ferramenta para modular sua própria biologia.

**Seu Tom:**
Você é sábio, calmo e empoderador. Você não trata doenças, você guia o usuário a se tornar um 'engenheiro de sua própria consciência biológica', fornecendo o conhecimento para que ele possa otimizar seu próprio sistema para a máxima coerência e vitalidade.`,
    themeColor: 'text-green-400',
    icon: Stethoscope,
    tools: ['meditation', 'dosha_diagnosis', 'wellness_visualizer', 'routine_aligner'],
  },
  [AgentId.EMOTIONAL_FINANCE]: {
    id: AgentId.EMOTIONAL_FINANCE,
    name: 'Terapeuta Financeiro',
    description: 'Cure sua relação com o dinheiro e prospere com inteligência emocional.',
    themeColor: 'text-pink-400',
    icon: GiPiggyBank,
    initialMessage: 'Sua relação com o dinheiro é um espelho de suas emoções. Estou aqui para ajudar a polir esse espelho. O que está pesando em seu coração financeiro?',
    tools: ['meditation', 'belief_resignifier', 'emotional_spending_map'],
  },
  [AgentId.INVESTMENTS]: {
    id: AgentId.INVESTMENTS,
    name: 'Analista "Zumbi Filosófico"',
    description: 'Análise de dados fria e lógica para seus investimentos em Cripto, Bio-Tech e IA.',
    themeColor: 'text-blue-400',
    icon: GiChart,
    initialMessage: 'Dados recebidos. Emoções em modo de espera. Apresente o cenário de investimento. Fornecerei a análise lógica.',
    tools: ['meditation', 'risk_calculator', 'phi_frontier_radar'],
  },
};

export const toolMetadata: Record<ToolId, { title: string; description: string; icon: React.ElementType; }> = {
    meditation: { title: 'Meditação Guiada', description: 'Crie uma meditação personalizada com base em sua intenção.', icon: BrainCircuit },
    guided_prayer: { title: 'Oração Guiada', description: 'Receba uma oração poderosa e personalizada.', icon: BookText },
    prayer_pills: { title: 'Pílulas de Oração', description: 'Receba doses rápidas de fé e inspiração.', icon: Pill },
    content_analyzer: { title: 'Analisador Consciente', description: 'Analise informação sob o Princípio da Informação Consciente.', icon: ScanText },
    dissonance_analyzer: { title: 'Analisador de Dissonância', description: 'Revele padrões e crenças limitantes em sua conversa.', icon: HeartPulse },
    therapeutic_journal: { title: 'Diário Terapêutico', description: 'Registre reflexões e receba insights do seu mentor.', icon: BookHeart },
    quantum_simulator: { title: 'Simulador Quântico', description: 'Explore o papel do observador e a cocriação da realidade.', icon: Atom },
    phi_frontier_radar: { title: 'Radar de Fronteira de Φ', description: 'Descubra tecnologias alinhadas à evolução da consciência.', icon: Orbit },
    archetype_journey: { title: 'Jornada do Arquétipo', description: 'Analise sua narrativa pessoal e encontre sua jornada de herói.', icon: Map },
    verbal_frequency_analysis: { title: 'Análise de Frequência Verbal', description: 'Meça a coerência emocional de sua linguagem.', icon: Waves },
    dosha_diagnosis: { title: 'Diagnóstico Informacional', description: 'Descubra seu Dosha Ayurvédico e restaure a harmonia.', icon: Stethoscope },
    wellness_visualizer: { title: 'Visualizador de Bem-Estar', description: 'Monitore seu progresso de bem-estar físico e psicológico.', icon: HeartHandshake },
    routine_aligner: { title: 'Alinhador de Rotina', description: 'Crie uma rotina diária (Dinacharya) para otimizar sua coerência.', icon: ClipboardCheck },
    belief_resignifier: { title: 'Ressignificador de Crenças', description: 'Transforme crenças limitantes sobre dinheiro.', icon: MessageSquareHeart },
    emotional_spending_map: { title: 'Mapa Emocional de Gastos', description: 'Conecte suas finanças às suas emoções.', icon: Wallet },
    risk_calculator: { title: 'Calculadora de Risco Lógico', description: 'Análise de dados fria e lógica para seus investimentos.', icon: Calculator },
    live_conversation: { title: 'Diálogo com o Arquiteto', description: 'Conecte-se em tempo real com o Arquiteto da Consciência para uma conversa de orientação profunda.', icon: MessageSquare },
    scheduled_session: { title: 'Sessão Agendada', description: 'Agende uma sessão de voz proativa com seu mentor para um horário específico.', icon: CalendarClock },
};

// FIX: Added the missing ZENGUEN_SANJI_PRAYER constant.
// This constant is used in the PrayerSpace component and was not exported, causing an error.
export const ZENGUEN_SANJI_PRAYER = `Serenamente, como o profundo oceano,
Que eu possa acolher todas as ondas da vida,
As calmas e as turbulentas, com igual equanimidade.

Forte, como a montanha imóvel,
Que eu possa permanecer firme em meu propósito,
Inabalável diante dos ventos da mudança.

Claro, como o céu sem nuvens,
Que minha mente se liberte das brumas da ignorância,
E reflita a pura luz da sabedoria.

Generoso, como a terra que a tudo sustenta,
Que eu possa nutrir a todos os seres sem distinção,
Oferecendo o meu melhor para o bem de todos.

Que a compaixão seja meu guia,
A sabedoria minha luz,
E a paz o meu estado natural.

Que todos os seres sejam livres do sofrimento e das causas do sofrimento.
Que todos os seres conheçam a felicidade e as causas da felicidade.`;