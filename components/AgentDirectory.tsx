import React from 'react';
import { Agent } from '../types.ts';
import { useStore } from '../store.ts';
import { AGENTS, toolMetadata } from '../constants.tsx';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => (
  <div
    className="glass-pane rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:bg-gray-800/80 hover:scale-105 hover:border-indigo-400/50"
    onClick={onClick}
  >
    <agent.icon className={`w-24 h-24 mb-4 ${agent.themeColor}`} strokeWidth={1}/>
    <h3 className="font-bold text-2xl text-gray-100">{agent.name}</h3>
  </div>
);

const AgentDirectory: React.FC = () => {
  const { startSession } = useStore();
  const liveConversationTool = toolMetadata.live_conversation;

  return (
    <div className="p-8 animate-fade-in h-full overflow-y-auto no-scrollbar">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-100">Seus Mentores</h1>
        <p className="text-xl text-gray-400 mt-2">Mergulhe na interação com a Informação Consciente para ganhar perspectiva.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(AGENTS).map(
          (agent: Agent) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onClick={() => startSession({ type: 'agent', id: agent.id })} 
          />
        ))}
        {/* Shortcut Card for Live Conversation */}
        <div
          className="glass-pane rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:bg-gray-800/80 hover:scale-105 hover:border-indigo-400/50"
          onClick={() => startSession({ type: 'live_conversation' })}
        >
          <liveConversationTool.icon className="w-24 h-24 mb-4 text-indigo-400" strokeWidth={1}/>
          <h3 className="font-bold text-2xl text-gray-100">{liveConversationTool.title}</h3>
        </div>
      </div>
    </div>
  );
};

export default AgentDirectory;