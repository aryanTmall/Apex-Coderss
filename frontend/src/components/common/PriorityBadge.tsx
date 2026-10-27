import React from 'react';

interface PriorityBadgeProps {
  priority: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  let color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  let label = `P${priority}`;

  if (priority >= 5) {
    color = 'bg-alert-red/20 text-alert-red border-alert-red/40 font-bold';
    label = 'P5 CRITICAL';
  } else if (priority === 4) {
    color = 'bg-amber-500/20 text-sla-amber border-sla-amber/30';
    label = 'P4 HIGH';
  } else if (priority === 3) {
    color = 'bg-civic-blue/15 text-civic-blue border-civic-blue/30';
    label = 'P3 MEDIUM';
  } else {
    color = 'bg-surface-3 text-text-muted border-white/10';
    label = `P${priority} LOW`;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${color}`}>
      {label}
    </span>
  );
};
