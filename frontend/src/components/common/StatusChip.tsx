import React from 'react';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  let bg = 'bg-surface-3 text-text-muted border-white/10';
  let dot = 'bg-text-muted';

  switch (norm) {
    case 'NEW':
      bg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      dot = 'bg-blue-400';
      break;
    case 'ASSIGNED':
      bg = 'bg-civic-blue/15 text-civic-blue border-civic-blue/30';
      dot = 'bg-civic-blue';
      break;
    case 'IN_PROGRESS':
      bg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      dot = 'bg-amber-400 animate-pulse';
      break;
    case 'CLOSURE_SUBMITTED':
      bg = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      dot = 'bg-purple-300';
      break;
    case 'NEEDS_REVIEW':
      bg = 'bg-amber-500/20 text-sla-amber border-sla-amber/40';
      dot = 'bg-sla-amber animate-ping';
      break;
    case 'RESOLVED':
      bg = 'bg-verified-teal/15 text-verified-teal border-verified-teal/30';
      dot = 'bg-verified-teal';
      break;
    case 'REOPENED':
      bg = 'bg-alert-red/20 text-alert-red border-alert-red/40';
      dot = 'bg-alert-red animate-pulse';
      break;
    case 'ESCALATED':
      bg = 'bg-alert-red/25 text-alert-red border-alert-red/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
      dot = 'bg-alert-red animate-ping';
      break;
  }

  const heightCls = size === 'sm' ? 'h-5 px-2 text-[10px]' : 'h-6 px-2.5 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-mono font-medium tracking-wider uppercase border ${bg} ${heightCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      <span>{norm.replace('_', ' ')}</span>
    </span>
  );
};
