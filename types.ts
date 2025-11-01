import React from 'react';

/**
 * Enum for unique agent identifiers.
 */
export enum AgentId {
  COHERENCE = 'coherence',
  SELF_KNOWLEDGE = 'self_knowledge',
  HEALTH = 'health',
  EMOTIONAL_FINANCE = 'emotional_finance',
  INVESTMENTS = 'investments',
}

/**
 * Represents the IDs for the available tools.
 */
export type ToolId = 
  | 'meditation' 
  | 'content_analyzer' 
  | 'guided_prayer' 
  | 'prayer_pills' 
  | 'dissonance_analyzer'
  | 'therapeutic_journal'
  | 'quantum_simulator'
  | 'phi_frontier_radar'
  | 'dosha_diagnosis'
  | 'wellness_visualizer'
  | 'belief_resignifier'
  | 'emotional_spending_map'
  | 'risk_calculator'
  | 'archetype_journey'
  | 'verbal_frequency_analysis'
  | 'live_conversation'
  | 'scheduled_session';

/**
 * Represents the structure of an AI agent's persona.
 */
export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  themeColor: string;
  icon: React.ElementType;
  tools?: ToolId[];
}

/**
 * Defines the user's state across different life dimensions.
 */
export interface UserStateVector {
  spiritual: number;
  emotional: number;
  physical: number;
  financial: number;
}

/**
 * Represents a single message in a chat conversation.
 */
export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

/**
 * Represents a single spoken part of a guided meditation script.
 */
export interface MeditationScriptPart {
  text: string;
  duration: number;
}

/**
 * Represents a complete guided meditation, including its title and script.
 */
export interface Meditation {
  id: string;
  title: string;
  script: MeditationScriptPart[];
}

// Represents the main view the user is currently seeing.
export type View = 'dashboard' | 'agents' | 'tools';


// A discriminated union to handle different full-screen "sessions" the user can enter.
export type Session =
  | { type: 'agent'; id: AgentId }
  | { type: 'meditation' }
  | { type: 'content_analyzer' }
  | { type: 'guided_prayer' }
  | { type: 'prayer_pills' }
  | { type: 'dissonance_analyzer' }
  | { type: 'therapeutic_journal' }
  | { type: 'quantum_simulator' }
  | { type: 'phi_frontier_radar' }
  | { type: 'dosha_diagnosis' }
  | { type: 'wellness_visualizer' }
  | { type: 'belief_resignifier' }
  | { type: 'emotional_spending_map' }
  | { type: 'risk_calculator' }
  | { type: 'archetype_journey' }
  | { type: 'verbal_frequency_analysis' }
  | { type: 'live_conversation' }
  | { type: 'scheduled_session' }
  | { type: 'scheduled_session_handler', schedule: Schedule }
  | { type: 'guided_meditation_voice', schedule: Schedule };


/**
 * Represents the structured result from the Dissonance Analyzer AI.
 */
export interface DissonanceAnalysisResult {
    tema: string;
    padrao: string;
    insight: string;
}

/**
 * Represents the structured feedback from the Therapeutic Journal AI.
 */
export interface JournalFeedback {
  observacao: string;
  dissonancia: string;
  acao: string;
}

/**
 * Represents the structured result from the Archetype Journey AI.
 */
export interface ArchetypeAnalysisResult {
    lente: string;
    dissonancia: string;
    passo: string;
}

/**
 * Represents the structured result from the Verbal Frequency Analysis AI.
 */
export interface VerbalFrequencyAnalysisResult {
    frequencia_detectada: string;
    coerencia_score: number;
    insight_imediato: string;
    acao_pac_recomendada: string;
    mensagem_guia: string;
}

/**
 * Represents a single toast notification message.
 */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Defines the structure for storing the state of various tools.
 */
export type ToolStates = {
    therapeuticJournal?: { entry: string; feedback: JournalFeedback | null; error: string | null };
    doshaDiagnosis?: { messages: Message[]; isFinished: boolean; error: string | null; };
};

/**
 * Represents a single scheduled session.
 */
export interface Schedule {
  id: string;
  activity: 'meditation' | 'guided_prayer' | 'prayer_pills';
  time: number; // as timestamp
  status: 'scheduled' | 'completed' | 'missed';
}