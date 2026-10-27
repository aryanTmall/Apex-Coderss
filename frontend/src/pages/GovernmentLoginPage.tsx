import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { api } from '../api/client';

export const GovernmentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('admin@civichelp.gov.in');
  const [password, setPassword] = useState<string>('CivicHelp@Admin2026!');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.login(email, password);
      if (res.access_token) {
        navigate('/government');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your municipal credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-1/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-civic-blue to-transparent" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-civic-blue/10 border border-civic-blue/30 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-civic-blue" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20 text-[10px] font-mono text-verified-teal mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-verified-teal animate-pulse" />
            AUTHORIZED GOVERNMENT ACCESS
          </div>
          <h1 className="text-xl font-serif text-white font-normal">
            Municipal Operations Console
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Restricted access portal for department operators, field officers, and verification reviewers.
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-alert-red/10 border border-alert-red/30 flex items-start gap-2.5 text-xs text-alert-red animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
              Government Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@civichelp.gov.in"
                className="w-full pl-9 pr-3 py-2.5 bg-night border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-night border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-lg bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-civic-blue/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating Gateway...' : 'Enter Operations Console'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Evaluation Credentials for Evaluators */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Test Credentials (Evaluator Mode):</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@civichelp.gov.in', 'CivicHelp@Admin2026!')}
              className="p-1.5 rounded bg-surface-2 hover:bg-surface-3 text-text-primary border border-white/5 text-center transition-colors truncate"
              title="Role: System Administrator"
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('reviewer@civichelp.gov.in', 'CivicHelp@Review2026!')}
              className="p-1.5 rounded bg-surface-2 hover:bg-surface-3 text-text-primary border border-white/5 text-center transition-colors truncate"
              title="Role: Verification Reviewer"
            >
              REVIEWER
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('pwd.operator@civichelp.gov.in', 'CivicHelp@Pwd2026!')}
              className="p-1.5 rounded bg-surface-2 hover:bg-surface-3 text-text-primary border border-white/5 text-center transition-colors truncate"
              title="Role: Department Operator"
            >
              OPERATOR
            </button>
          </div>
        </div>

        {/* Return to Public Portal link */}
        <div className="mt-5 text-center">
          <a
            href="/"
            className="text-[11px] font-mono text-text-muted hover:text-white transition-colors"
          >
            &larr; Return to Public Citizen Portal
          </a>
        </div>
      </div>
    </div>
  );
};
