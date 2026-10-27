import React from 'react';
import { AuditEvent } from '../../api/types';
import { AgentBadge } from './AgentBadge';
import { StatusChip } from './StatusChip';
import { ShieldCheck, Lock } from 'lucide-react';

interface TimelineItemProps {
  event: AuditEvent;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast = false }) => {
  const date = new Date(event.timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="relative flex gap-3 pb-6 group">
      {/* Vertical hairline track */}
      {!isLast && (
        <div className="absolute left-2.5 top-5 bottom-0 w-[1px] bg-white/10 group-hover:bg-white/20 transition-colors"></div>
      )}

      {/* Node indicator */}
      <div className="relative mt-1 z-10 w-5 h-5 rounded-full bg-surface-2 border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-civic-blue"></span>
      </div>

      {/* Content */}
      <div className="flex-1 bg-surface-1/60 rounded-inner card-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <AgentBadge actor={event.actor} />
            <span className="text-xs font-mono text-text-primary font-semibold">{event.action}</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">{timeStr}</span>
        </div>

        <p className="text-xs text-text-primary/90 leading-relaxed mb-2">{event.reason}</p>

        {(event.from_status || event.to_status) && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted pt-1 border-t border-white/5">
            <span>State transition:</span>
            {event.from_status && <StatusChip status={event.from_status} size="sm" />}
            <span>→</span>
            {event.to_status && <StatusChip status={event.to_status} size="sm" />}
          </div>
        )}

        {/* Cryptographic SHA-256 Audit Chain Verification */}
        {event.event_hash && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono text-text-muted">
            <span className="flex items-center gap-1.5 text-verified-teal">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider text-text-muted">Audit Hash:</span>
              <span className="font-bold text-white px-1.5 py-0.2 bg-verified-teal/15 rounded border border-verified-teal/30">
                {event.event_hash}
              </span>
            </span>
            {event.previous_hash && (
              <span
                className="text-[9px] text-text-muted truncate max-w-[130px] flex items-center gap-1"
                title={`Previous Hash: ${event.previous_hash}`}
              >
                <Lock className="w-2.5 h-2.5" />
                PREV: {event.previous_hash.slice(0, 8)}...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
