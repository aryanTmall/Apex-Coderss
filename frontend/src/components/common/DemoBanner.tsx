import React from 'react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="w-full bg-[#0a0e17] border-b border-white/5 py-1 px-4 text-center select-none flex items-center justify-between z-50">
      <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-sla-amber uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-sla-amber animate-pulse"></span>
        <span>DEMO ENVIRONMENT — SYNTHETIC DATA</span>
        <span className="text-white/20">|</span>
        <span className="text-text-muted">NIGHT OPERATIONS ACTIVE // V2.4</span>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-text-muted">
        <span>NODE: US-EAST-01-FED</span>
        <span className="text-verified-teal">ENCRYPTED-TLS/AES256</span>
      </div>
    </div>
  );
};
