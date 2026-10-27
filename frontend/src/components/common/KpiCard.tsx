import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral' | 'warning';
  subtext?: string;
  subValue?: string;
  progressPct?: number;
  icon: LucideIcon;
  variant?: 'blue' | 'teal' | 'amber' | 'red' | 'default';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'neutral',
  subtext,
  subValue,
  progressPct,
  icon: Icon,
  variant = 'default',
}) => {
  let accentColor = 'text-civic-blue';
  let barColor = 'bg-civic-blue';
  let glowColor = 'bg-civic-blue/10';

  if (variant === 'teal') {
    accentColor = 'text-verified-teal';
    barColor = 'bg-verified-teal';
    glowColor = 'bg-verified-teal/10';
  } else if (variant === 'amber') {
    accentColor = 'text-sla-amber';
    barColor = 'bg-sla-amber';
    glowColor = 'bg-sla-amber/15';
  } else if (variant === 'red') {
    accentColor = 'text-alert-red';
    barColor = 'bg-alert-red';
    glowColor = 'bg-alert-red/20';
  }

  return (
    <div className="bg-surface-1 rounded-card card-border p-4 flex flex-col justify-between relative overflow-hidden group hover:bg-surface-2 transition-all">
      <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full ${glowColor} pointer-events-none blur-xl`}></div>

      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono tracking-wider text-text-muted uppercase">{label}</span>
        <Icon className={`w-4 h-4 ${accentColor}`} />
      </div>

      {/* Main KPI metric */}
      <div className="flex items-baseline gap-2 my-1">
        <span className={`font-serif text-3xl font-medium tracking-tight ${accentColor}`}>
          {value}
        </span>
        {delta && (
          <span className={`text-[11px] font-mono flex items-center ${
            deltaType === 'warning' ? 'text-alert-red font-bold' :
            deltaType === 'positive' ? 'text-verified-teal' :
            deltaType === 'negative' ? 'text-sla-amber' : 'text-text-muted'
          }`}>
            {delta}
          </span>
        )}
      </div>

      {/* Subtext info */}
      {(subtext || subValue) && (
        <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-white/5">
          <span>{subtext}</span>
          {subValue && <span className="font-mono text-text-primary font-medium">{subValue}</span>}
        </div>
      )}

      {/* Micro progress bar */}
      {typeof progressPct === 'number' && (
        <div className="w-full bg-surface-3 h-1 rounded-full mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};
