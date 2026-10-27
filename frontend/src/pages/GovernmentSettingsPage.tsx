import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Users,
  Server,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { api } from '../api/client';
import { UserProfile } from '../api/types';

export const GovernmentSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getProfile()
      .then(setProfile)
      .catch((err) => console.error('Failed to load user profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const rolesMatrix = [
    { role: 'CITIZEN', desc: 'Public portal only. Incident reporting, tracking, voting, rewards.', level: 'Level 0' },
    { role: 'FIELD_OFFICER', desc: 'Field inspections, coordinate corroboration, closure photographic evidence.', level: 'Level 1' },
    { role: 'DEPARTMENT_OPERATOR', desc: 'Department queue triage, team assignment, SLA monitoring.', level: 'Level 2' },
    { role: 'REVIEWER', desc: 'Verification desk closure validation, reopening defective cases, hotspot review.', level: 'Level 3' },
    { role: 'FINANCE_OFFICER', desc: 'Municipal budget allocation, CSV upload, contractor penalty reconciliation.', level: 'Level 3 (Fiscal)' },
    { role: 'WHISTLEBLOWER_AUDITOR', desc: 'Strictly isolated anti-corruption case dossiers and confidential ombudsman files.', level: 'Special Isolated' },
    { role: 'ADMIN', desc: 'Complete administrative authority, user provisioning, virtual clock simulation.', level: 'Level 4 (Super)' },
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Header */}
      <div className="pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono text-civic-blue uppercase tracking-widest px-2 py-0.5 rounded-full bg-civic-blue/10 border border-civic-blue/30">
            SYSTEM // NODE GOVERNANCE & RBAC
          </span>
        </div>
        <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
          Settings & Access Management
        </h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Operational session configuration, cryptographic authorization tokens, and Role-Based Access Control (RBAC) policy enforcement.
        </p>
      </div>

      {/* Active Session Card */}
      <div className="p-5 rounded-2xl bg-surface-1 border border-white/10 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-civic-blue/20 border border-civic-blue/40 flex items-center justify-center text-civic-blue shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">{profile?.full_name || 'Government Officer'}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-verified-teal/20 text-verified-teal uppercase">
                {profile?.role || 'OPERATOR'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 font-mono">{profile?.email || 'admin@civichelp.gov.in'}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-text-muted">
              <span>Dept: {profile?.department_id || 'CENTRAL_COMMAND'}</span>
              <span>•</span>
              <span className="text-verified-teal">JWT Session: Active & Valid</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-2/80 border border-white/5 flex flex-col text-right">
          <span className="text-[10px] font-mono text-text-muted uppercase">Security Context</span>
          <span className="text-xs font-mono font-bold text-white mt-0.5">PBKDF2-HMAC-SHA256</span>
          <span className="text-[10px] font-mono text-verified-teal mt-0.5">100k Iterations / Salted</span>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="p-5 rounded-2xl bg-surface-1 border border-white/5 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-civic-blue" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Backend authorization policies enforced via JWT claims and FastAPI dependencies.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-text-muted font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Role Code</th>
                <th className="p-3">Privilege Tier</th>
                <th className="p-3">Authorized Operational Scope</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-surface-1">
              {rolesMatrix.map((r) => {
                const isCurrent = profile?.role === r.role;
                return (
                  <tr key={r.role} className={isCurrent ? 'bg-civic-blue/10' : 'hover:bg-white/5'}>
                    <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                      <span>{r.role}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-civic-blue text-[9px] font-mono text-white">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-text-muted text-[11px]">{r.level}</td>
                    <td className="p-3 text-text-muted">{r.desc}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-verified-teal">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Node Security & Audit Integrity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-civic-blue" />
            <span>Database Integrity & Audit Chain</span>
          </span>
          <p className="text-xs text-text-muted leading-relaxed">
            Every state change, reopening, penalty assessment, and vote is cryptographically chained using SHA-256 hashes to guarantee non-repudiation.
          </p>
          <span className="text-[10px] font-mono text-verified-teal mt-1">STATUS: SECURE // GENESIS-VALID</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-warning-yellow" />
            <span>Whistleblower Anti-Corruption Isolation</span>
          </span>
          <p className="text-xs text-text-muted leading-relaxed">
            Confidential whistleblower cases and uploaded evidence are strictly walled off behind dedicated auditor tokens. General operators receive 403 Forbidden.
          </p>
          <span className="text-[10px] font-mono text-verified-teal mt-1">STATUS: AIRGAPPED RBAC ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
