import React from 'react';
import { Clock } from 'lucide-react';

interface SlaTimerProps {
  dueAt?: string | null;
  status: string;
}

export const SlaTimer: React.FC<SlaTimerProps> = ({ dueAt, status }) => {
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-verified-teal">
        <Clock className="w-3.5 h-3.5" />
        <span>COMPLIANT // RESOLVED</span>
      </span>
    );
  }

  if (!dueAt) {
    return <span className="text-[11px] font-mono text-text-muted">NO SLA SET</span>;
  }

  const now = new Date();
  const due = new Date(dueAt);
  const diffMs = due.getTime() - now.getTime();
  const isOverdue = diffMs <= 0;

  const absDiff = Math.abs(diffMs);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  let color = 'text-verified-teal bg-verified-teal/10 border-verified-teal/20';
  let label = `T-${timeStr}`;

  if (isOverdue) {
    color = 'text-alert-red bg-alert-red/15 border-alert-red/30 animate-pulse font-bold';
    label = `BREACHED +${timeStr}`;
  } else if (hours < 2) {
    color = 'text-sla-amber bg-sla-amber/15 border-sla-amber/30 font-semibold';
    label = `RISK T-${timeStr}`;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${color}`}>
      <Clock className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
};
