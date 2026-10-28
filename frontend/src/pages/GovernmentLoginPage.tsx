import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Sparkles,
  UserCheck,
  Building2,
  HardHat,
  Search,
  Coins
} from 'lucide-react';
import { api } from '../api/client';

interface Persona {
  id: string;
  roleName: string;
  badge: string;
  badgeColor: string;
  email: string;
  password: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimary?: boolean;
}

const PERSONAS: Persona[] = [
  {
    id: 'admin',
    roleName: 'System Administrator',
    badge: 'FULL ACCESS',
    badgeColor: 'bg-civic-blue/20 text-civic-blue border-civic-blue/30',
    email: 'admin@civichelp.gov.in',
    password: 'CivicHelp@Admin2026!',
    description: 'Complete municipal operations, AI configs, simulation deck, and analytics',
    icon: Shield,
    isPrimary: true,
  },
  {
    id: 'reviewer',
    roleName: 'Verification Reviewer',
    badge: 'VERIFICATION DESK',
    badgeColor: 'bg-verified-teal/20 text-verified-teal border-verified-teal/30',
    email: 'reviewer@civichelp.gov.in',
    password: 'CivicHelp@Review2026!',
    description: 'Evidence verification, photo inspection, audit trail, and resolution approval',
    icon: Search,
    isPrimary: true,
  },
  {
    id: 'operator',
    roleName: 'PWD Department Operator',
    badge: 'ROADS & DISPATCH',
    badgeColor: 'bg-sla-amber/20 text-sla-amber border-sla-amber/30',
    email: 'pwd.operator@civichelp.gov.in',
    password: 'CivicHelp@Pwd2026!',
    description: 'Departmental triage, contractor assignment, and SLA escalation tracking',
    icon: Building2,
    isPrimary: true,
  },
  {
    id: 'auditor',
    roleName: 'Whistleblower Ombudsman',
    badge: 'CONFIDENTIAL',
    badgeColor: 'bg-agent-violet/20 text-agent-violet border-agent-violet/30',
    email: 'auditor@civichelp.gov.in',
    password: 'CivicHelp@Auditor2026!',
    description: 'Protected anti-corruption investigation desk and token review',
    icon: Shield,
    isPrimary: false,
  },
  {
    id: 'field',
    roleName: 'Field Crew Supervisor',
    badge: 'NORTH ZONE',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    email: 'field.crew@civichelp.gov.in',
    password: 'CivicHelp@Field2026!',
    description: 'On-site crew work orders, physical repairs, and resolution updates',
    icon: HardHat,
    isPrimary: false,
  },
  {
    id: 'finance',
    roleName: 'Municipal Finance Officer',
    badge: 'BUDGETS & FUNDS',
    badgeColor: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    email: 'finance@civichelp.gov.in',
    password: 'CivicHelp@Finance2026!',
    description: 'Ward budget allocations, fund releases, and contractor payments',
    icon: Coins,
    isPrimary: false,
  },
];

export const GovernmentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('admin@civichelp.gov.in');
  const [password, setPassword] = useState<string>('CivicHelp@Admin2026!');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPersonaId, setLoadingPersonaId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAllPersonas, setShowAllPersonas] = useState<boolean>(false);

  // Target path redirect after login
  const targetPath = (location.state as any)?.from?.pathname || '/government';

  const executeLogin = async (loginEmail: string, loginPass: string, personaId?: string) => {
    setLoading(true);
    if (personaId) setLoadingPersonaId(personaId);
    setErrorMsg(null);

    try {
      const res = await api.login(loginEmail, loginPass);
      if (res.access_token) {
        navigate(targetPath);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your municipal credentials.');
    } finally {
      setLoading(false);
      setLoadingPersonaId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleSelectPersona = (p: Persona) => {
    setEmail(p.email);
    setPassword(p.password);
    setErrorMsg(null);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const primaryPersonas = PERSONAS.filter(p => p.isPrimary);
  const secondaryPersonas = PERSONAS.filter(p => !p.isPrimary);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 my-6">
      <div className="w-full max-w-2xl bg-surface-1/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-1 bg-gradient-to-r from-transparent via-civic-blue to-transparent" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-civic-blue/15 border border-civic-blue/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-civic-blue/10">
            <Shield className="w-6 h-6 text-civic-blue" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-verified-teal/10 border border-verified-teal/30 text-[11px] font-mono text-verified-teal mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-verified-teal animate-pulse" />
            AUTHORIZED MUNICIPAL OPERATIONS PORTAL
          </div>
          <h1 className="text-2xl font-serif text-white font-normal">
            Government Operations Console
          </h1>
          <p className="text-xs text-text-muted mt-1.5 max-w-md mx-auto">
            Authorized gateway for City Administration, Verification Reviewers, and Department Operators.
          </p>
        </div>

        {/* Evaluator Notice Callout */}
        <div className="mb-6 p-3.5 rounded-xl bg-civic-blue/10 border border-civic-blue/25 flex items-start gap-3 text-xs text-text-primary">
          <Sparkles className="w-4 h-4 text-civic-blue shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-white mb-0.5">Evaluation & Demo Mode Active</div>
            <div className="text-text-muted text-[11px] leading-relaxed">
              Official credentials for <strong className="text-white">Admin</strong>, <strong className="text-white">Reviewer</strong>, and <strong className="text-white">Operator</strong> are pre-configured below. Click any persona card to auto-fill or use <strong>1-Click Sign In</strong> for instant access.
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-alert-red/10 border border-alert-red/30 flex items-start gap-2.5 text-xs text-alert-red animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pre-Configured Official Persona Cards (1-Click Login) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Official Role (Pre-filled Passwords):</span>
            </label>
            <span className="text-[10px] font-mono text-text-muted">1-Click Sign In</span>
          </div>

          {/* Primary Personas: Admin, Reviewer, Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {primaryPersonas.map((p) => {
              const isSelected = email === p.email;
              const IconComp = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPersona(p)}
                  className={`cursor-pointer text-left p-3 rounded-xl border transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-surface-2 border-civic-blue shadow-lg shadow-civic-blue/10 ring-1 ring-civic-blue'
                      : 'bg-night/70 hover:bg-surface-2/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <IconComp className="w-3.5 h-3.5 text-civic-blue" />
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-white mb-1">{p.roleName}</div>
                    
                    <div className="text-[10px] font-mono text-text-muted break-all mb-1">
                      {p.email}
                    </div>

                    <div className="text-[10px] font-mono text-amber-400/90 font-semibold mb-2 bg-black/40 px-2 py-1 rounded border border-white/5 flex items-center justify-between">
                      <span className="truncate">Key: {p.password}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(p.password, p.id);
                        }}
                        className="hover:text-white transition-colors p-0.5"
                        title="Copy Password"
                      >
                        {copiedField === p.id ? (
                          <Check className="w-3 h-3 text-verified-teal" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-text-muted line-clamp-2 leading-tight">
                      {p.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      executeLogin(p.email, p.password, p.id);
                    }}
                    className="mt-3 w-full py-1.5 rounded-lg bg-civic-blue/20 hover:bg-civic-blue text-civic-blue hover:text-white border border-civic-blue/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3" />
                    <span>{loadingPersonaId === p.id ? 'Connecting...' : '1-Click Sign In'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Secondary Personas Toggle (Auditor, Field Crew, Finance) */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowAllPersonas(!showAllPersonas)}
              className="text-[11px] font-mono text-text-muted hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>{showAllPersonas ? 'Hide additional roles' : 'View more roles (Auditor, Field Crew, Finance)'}</span>
              <span className="text-[10px] text-civic-blue">{showAllPersonas ? '▲' : '▼'}</span>
            </button>

            {showAllPersonas && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5 animate-fade-in">
                {secondaryPersonas.map((p) => {
                  const isSelected = email === p.email;
                  const IconComp = p.icon;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPersona(p)}
                      className={`cursor-pointer text-left p-3 rounded-xl border transition-all flex flex-col justify-between relative group ${
                        isSelected
                          ? 'bg-surface-2 border-civic-blue shadow-lg shadow-civic-blue/10 ring-1 ring-civic-blue'
                          : 'bg-night/70 hover:bg-surface-2/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <IconComp className="w-3.5 h-3.5 text-civic-blue" />
                          </div>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>

                        <div className="font-semibold text-xs text-white mb-1">{p.roleName}</div>
                        
                        <div className="text-[10px] font-mono text-text-muted break-all mb-1">
                          {p.email}
                        </div>

                        <div className="text-[10px] font-mono text-amber-400/90 font-semibold mb-2 bg-black/40 px-2 py-1 rounded border border-white/5 flex items-center justify-between">
                          <span className="truncate">Key: {p.password}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(p.password, p.id);
                            }}
                            className="hover:text-white transition-colors p-0.5"
                            title="Copy Password"
                          >
                            {copiedField === p.id ? (
                              <Check className="w-3 h-3 text-verified-teal" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <p className="text-[10px] text-text-muted line-clamp-2 leading-tight">
                          {p.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          executeLogin(p.email, p.password, p.id);
                        }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-civic-blue/20 hover:bg-civic-blue text-civic-blue hover:text-white border border-civic-blue/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{loadingPersonaId === p.id ? 'Connecting...' : '1-Click Sign In'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Manual Input Form (Pre-Filled) */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 border-t border-white/10">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                Government Official Email
              </label>
              <span className="text-[10px] font-mono text-verified-teal">Pre-filled</span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@civichelp.gov.in"
                className="w-full pl-9 pr-3 py-2.5 bg-night border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] font-mono text-text-muted hover:text-white flex items-center gap-1 transition-colors"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Password</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show Password</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CivicHelp@Admin2026!"
                className="w-full pl-9 pr-10 py-2.5 bg-night border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-text-muted">
              <span>Seeded Key: <code className="text-amber-400 font-bold">{password}</code></span>
              <button
                type="button"
                onClick={() => handleCopy(password, 'input-pass')}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedField === 'input-pass' ? (
                  <span className="text-verified-teal">Copied!</span>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-civic-blue/25 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating Gateway...' : 'Enter Operations Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <a
            href="/"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            &larr; Return to Landing Page
          </a>
          <a
            href="/public"
            className="text-civic-blue hover:underline transition-colors"
          >
            Public Citizen Portal &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
