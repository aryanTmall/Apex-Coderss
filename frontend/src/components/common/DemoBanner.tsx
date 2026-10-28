import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, X, Copy, Check, Shield, ArrowRight } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const credentials = [
    {
      role: 'Administrator',
      email: 'admin@civichelp.gov.in',
      pass: 'CivicHelp@Admin2026!',
      desc: 'Full municipal oversight & ops',
    },
    {
      role: 'Verification Reviewer',
      email: 'reviewer@civichelp.gov.in',
      pass: 'CivicHelp@Review2026!',
      desc: 'Visual QA & resolution review',
    },
    {
      role: 'PWD Operator',
      email: 'pwd.operator@civichelp.gov.in',
      pass: 'CivicHelp@Pwd2026!',
      desc: 'Roads, waste & SLA dispatch',
    },
    {
      role: 'Whistleblower Auditor',
      email: 'auditor@civichelp.gov.in',
      pass: 'CivicHelp@Auditor2026!',
      desc: 'Anti-corruption confidential desk',
    },
  ];

  return (
    <>
      <div className="w-full bg-[#0a0e17] border-b border-white/5 py-1 px-3 sm:px-4 text-center select-none flex items-center justify-between z-50">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-sla-amber uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sla-amber animate-pulse"></span>
          <span>DEMO ENVIRONMENT — SYNTHETIC DATA</span>
          <span className="text-white/20 hidden md:inline">|</span>
          <span className="text-text-muted hidden md:inline">NIGHT OPERATIONS ACTIVE // V2.4</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition-all cursor-pointer font-bold"
            title="View Evaluator Credentials"
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>Pass: Admin / Reviewer / Operator</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-text-muted">
            <span>NODE: US-EAST-01-FED</span>
            <span className="text-verified-teal">TLS/AES256</span>
          </div>
        </div>
      </div>

      {/* Evaluator Credentials Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-white/10 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-fade-in">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-serif text-lg text-white font-normal">
                Evaluation Passwords & Test Accounts
              </h3>
            </div>
            <p className="text-xs text-text-muted mb-4">
              All accounts below are pre-seeded in the database and pre-filled on the login screen for 1-click evaluation:
            </p>

            <div className="space-y-2 mb-5">
              {credentials.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-night border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{c.role}</span>
                      <span className="text-[10px] font-mono text-text-muted">({c.desc})</span>
                    </div>
                    <div className="text-[11px] font-mono text-text-muted mt-0.5">
                      Email: <span className="text-text-primary">{c.email}</span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 font-semibold mt-0.5">
                      Password: <code>{c.pass}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopy(c.pass, `pass-${i}`)}
                      className="px-2 py-1 rounded bg-surface-2 hover:bg-surface-3 border border-white/10 text-[10px] font-mono text-text-muted hover:text-white flex items-center gap-1 transition-colors"
                      title="Copy Password"
                    >
                      {copiedKey === `pass-${i}` ? (
                        <>
                          <Check className="w-3 h-3 text-verified-teal" />
                          <span className="text-verified-teal">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-[10px] font-mono text-text-muted">
                Tip: Login screen has 1-Click Instant Sign In
              </span>
              <Link
                to="/government/login"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-civic-blue/20 transition-all"
              >
                <span>Go to Government Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
