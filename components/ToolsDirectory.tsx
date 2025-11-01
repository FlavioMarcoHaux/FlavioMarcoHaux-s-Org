import React from 'react';
import { Session } from '../types.ts';
import { AGENTS, toolMetadata } from '../constants.tsx';
import { AgentId } from '../types.ts';
import { useStore } from '../store.ts';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  themeColor: string;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: Icon, themeColor, onClick }) => (
  <div
    className="glass-pane rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:bg-gray-800/80 hover:scale-105 hover:border-indigo-400/50"
    onClick={onClick}
  >
    <Icon className={`w-20 h-20 mb-4 ${themeColor}`} strokeWidth={1.5}/>
    <h3 className="font-bold text-xl text-gray-100">{title}</h3>
    <p className="text-sm text-gray-400 mt-2 flex-1">{description}</p>
  </div>
);

const ToolsDirectory: React.FC = () => {
  const { startSession } = useStore();
  
  const agentOrder: AgentId[] = [
    AgentId.COHERENCE,
    AgentId.SELF_KNOWLEDGE,
    AgentId.HEALTH,
    AgentId.EMOTIONAL_FINANCE,
    AgentId.INVESTMENTS,
  ];

  return (
    <div className="p-8 animate-fade-in h-full overflow-y-auto no-scrollbar">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-100">Ferramentas da Alma</h1>
        <p className="text-xl text-gray-400 mt-2">Instrumentos para cultivar sua coerência interior.</p>
      </header>

      <div className="space-y-12">
        {agentOrder.map(agentId => {
          const agent = AGENTS[agentId];
          if (!agent.tools || agent.tools.length === 0) return null;
          
          return (
            <section key={agent.id}>
              <h2 className="text-3xl font-bold text-gray-300 mb-6 flex items-center gap-4 border-b border-gray-700 pb-3">
                  <agent.icon className={`w-8 h-8 ${agent.themeColor}`} />
                  Ferramentas de {agent.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agent.tools.map(toolId => {
                  const tool = toolMetadata[toolId];
                  if (!tool) return null;
                  return (
                    <ToolCard 
                      key={toolId} 
                      title={tool.title} 
                      description={tool.description}
                      icon={tool.icon}
                      themeColor={agent.themeColor}
                      onClick={() => startSession({ type: toolId as any })} 
                    />
                  );
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  );
};

export default ToolsDirectory;
