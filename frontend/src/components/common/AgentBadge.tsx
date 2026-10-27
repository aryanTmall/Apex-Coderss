import React from 'react';
import { Bot, User, Cpu } from 'lucide-react';

interface AgentBadgeProps {
  actor: string;
}

export const AgentBadge: React.FC<AgentBadgeProps> = ({ actor }) => {
  const isAgent = actor.startsWith('AGENT:');
  const isSystem = actor.startsWith('SYSTEM:');
  const isHuman = actor.startsWith('HUMAN:');

  const cleanName = actor.includes(':') ? actor.split(':')[1] : actor;

  let bg = 'bg-surface-3 text-text-muted border-white/10';
  let Icon = Cpu;

  if (isAgent) {
    bg = 'bg-agent-violet/10 text-agent-violet border-agent-violet/25';
    Icon = Bot;
  } else if (isSystem) {
    bg = 'bg-verified-teal/10 text-verified-teal border-verified-teal/25';
    Icon = Cpu;
  } else if (isHuman) {
    bg = 'bg-civic-blue/10 text-civic-blue border-civic-blue/25';
    Icon = User;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${bg}`}>
      <Icon className="w-3 h-3" />
      <span>{cleanName}</span>
    </span>
  );
};
