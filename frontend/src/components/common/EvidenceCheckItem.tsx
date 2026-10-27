import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { CheckDetail } from '../../api/types';

interface EvidenceCheckItemProps {
  check: CheckDetail;
}

export const EvidenceCheckItem: React.FC<EvidenceCheckItemProps> = ({ check }) => {
  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-verified-teal bg-verified-teal/10 border border-verified-teal/30">
      <CheckCircle2 className="w-3 h-3" />
      <span>PASSED</span>
    </span>
  );

  let icon = <CheckCircle2 className="w-4 h-4 text-verified-teal shrink-0 mt-0.5" />;
  let cardBg = 'bg-surface-2/40 border-white/5';

  if (check.status === 'FAILED') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-alert-red bg-alert-red/15 border border-alert-red/30">
        <XCircle className="w-3 h-3" />
        <span>FAILED</span>
      </span>
    );
    icon = <XCircle className="w-4 h-4 text-alert-red shrink-0 mt-0.5" />;
    cardBg = 'bg-alert-red/5 border-alert-red/20';
  } else if (check.status === 'NEEDS_REVIEW') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-sla-amber bg-sla-amber/15 border border-sla-amber/30">
        <AlertCircle className="w-3 h-3" />
        <span>NEEDS REVIEW</span>
      </span>
    );
    icon = <AlertCircle className="w-4 h-4 text-sla-amber shrink-0 mt-0.5" />;
    cardBg = 'bg-sla-amber/5 border-sla-amber/20';
  }

  const formattedName = check.name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className={`p-3 rounded-inner border ${cardBg} flex flex-col gap-1.5 transition-all`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-mono font-semibold text-text-primary">{formattedName}</span>
          {check.mandatory && (
            <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-text-muted">MANDATORY</span>
          )}
        </div>
        {statusBadge}
      </div>
      <p className="text-xs text-text-muted pl-6 leading-relaxed">
        {check.explanation}
      </p>
    </div>
  );
};
