import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  GitMerge,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api/client';
import { Metrics } from '../api/types';
import { CursorGlow } from '../components/common/CursorGlow';

// Lazy load Three.js scene so console does not load 3D engine unnecessarily
const NightCityCanvas = lazy(() =>
  import('../components/3d/NightCityCanvas').then(m => ({ default: m.NightCityCanvas }))
);

export const LandingPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(() => {
      // Fallback if backend is warming up
    });
  }, []);

  return (
    <div className="min-h-screen bg-night text-text-primary selection:bg-civic-blue selection:text-white flex flex-col relative">
      <CursorGlow />
      {/* Top Demo Banner */}
      <div className="w-full bg-[#0a0e17] border-b border-white/5 py-1.5 px-4 text-center select-none">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-wider text-sla-amber uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-sla-amber animate-pulse"></span>
          <span>DEMO ENVIRONMENT — SYNTHETIC DATA</span>
          <span className="text-white/20 mx-1">|</span>
          <span className="text-text-muted">NIGHT OPERATIONS ACTIVE // V2.4</span>
        </div>
      </div>

      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-night/80 border-b border-white/10 px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-inner bg-surface-2 card-border flex items-center justify-center text-civic-blue shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">CivicHelp</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-white/5 text-text-muted border border-white/10">v2.4</span>
              </div>
              <span className="text-[10px] text-text-muted tracking-wider font-mono">SYS-ONLINE // FED-04</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-text-muted">
            <a href="#pipeline" className="hover:text-white transition-colors">4-Stage Pipeline</a>
            <a href="#telemetry" className="hover:text-white transition-colors">Live Telemetry</a>
            <a href="#safeguards" className="hover:text-white transition-colors">Autonomous Safeguards</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-1 card-border text-[11px] text-verified-teal font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-verified-teal"></span>
              <span>Autonomous Engine</span>
            </div>
            <Link
              to="/app"
              className="px-4 py-2 rounded-inner bg-civic-blue text-white text-xs font-medium hover:bg-civic-blue-hover transition-all shadow-lg shadow-civic-blue/20 flex items-center gap-1.5"
            >
              <span>Open Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Procedural Night City */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-6 pt-12 pb-20">
        <Suspense fallback={
          <div className="absolute inset-0 bg-night flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[600px] h-[600px] rounded-full bg-radial from-civic-blue/20 via-agent-violet/10 to-transparent blur-3xl" />
          </div>
        }>
          <NightCityCanvas />
        </Suspense>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1/90 card-border mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse"></span>
            <span className="text-xs font-mono text-text-muted tracking-wider uppercase">
              Autonomous Municipal Resolution Mesh
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.1] mb-6">
            From citizen reports to <span className="italic text-civic-blue">verified outcomes</span>.
          </h1>

          {/* Supporting Copy */}
          <p className="text-base md:text-lg text-text-muted max-w-2xl font-sans leading-relaxed mb-10">
            CivicHelp turns scattered civic complaints into accountable incidents, evidence-backed resolutions, and measurable public service outcomes.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              to="/app"
              className="w-full sm:w-auto px-7 py-3.5 rounded-inner bg-civic-blue text-white text-sm font-semibold hover:bg-civic-blue-hover transition-all shadow-xl shadow-civic-blue/25 flex items-center justify-center gap-2"
            >
              <span>Open Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/app/simulation"
              className="w-full sm:w-auto px-7 py-3.5 rounded-inner bg-surface-2 card-border text-text-primary text-sm font-medium hover:bg-surface-3 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-sla-amber fill-sla-amber" />
              <span>Watch the Live Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Real Live Metrics Bar */}
      <section id="telemetry" className="relative z-10 max-w-6xl mx-auto w-full px-6 -mt-10 mb-16">
        <div className="bg-surface-1/95 rounded-card card-border p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono text-text-muted uppercase">
              <span className="w-2 h-2 rounded-full bg-verified-teal animate-ping"></span>
              <span>LIVE MUNICIPAL TELEMETRY // REAL PERSISTED DATA</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted">SYNCED: 100% PERSISTENT</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-[11px] font-mono text-text-muted uppercase">Active Cases</span>
              <div className="font-serif text-3xl font-medium text-text-primary mt-1">
                {metrics ? metrics.open_cases : '—'}
              </div>
              <span className="text-[10px] font-mono text-civic-blue">Under Triage</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-text-muted uppercase">Overdue Cases</span>
              <div className="font-serif text-3xl font-medium text-alert-red mt-1">
                {metrics ? metrics.overdue_cases : '—'}
              </div>
              <span className="text-[10px] font-mono text-alert-red">SLA Monitored</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-text-muted uppercase">SLA Compliance</span>
              <div className="font-serif text-3xl font-medium text-verified-teal mt-1">
                {metrics ? `${metrics.sla_compliance_pct}%` : '—'}
              </div>
              <span className="text-[10px] font-mono text-verified-teal">Charter Standard</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-text-muted uppercase">Duplicate Link Rate</span>
              <div className="font-serif text-3xl font-medium text-agent-violet mt-1">
                {metrics ? `${metrics.duplicate_link_rate_pct}%` : '—'}
              </div>
              <span className="text-[10px] font-mono text-agent-violet">Auto Clustered</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Story Chapters: Report -> Link -> Prove -> Recover */}
      <section id="pipeline" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono text-civic-blue uppercase tracking-wider px-3 py-1 rounded-full bg-civic-blue/10 border border-civic-blue/20">
            Autonomous Accountability Loop
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-white mt-4 mb-3">
            How CivicHelp Drives Verification
          </h2>
          <p className="text-xs md:text-sm text-text-muted">
            From fragmented citizen complaints to verifiable municipal accountability through an auditable state machine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Chapter 1: Report */}
          <div className="bg-surface-1 rounded-card card-border p-6 flex flex-col justify-between hover:border-civic-blue/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-inner bg-civic-blue/15 border border-civic-blue/30 flex items-center justify-center text-civic-blue mb-4">
                <span className="font-mono font-bold text-sm">01</span>
              </div>
              <h3 className="font-semibold text-base text-text-primary mb-2">1. Report</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Citizens submit civic issues with geolocated coordinates, category tags, and optional photographic references. Each report receives an immutable public tracking code.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/5 text-[10px] font-mono text-civic-blue">
              Intake Agent // Multi-modal
            </div>
          </div>

          {/* Chapter 2: Link */}
          <div className="bg-surface-1 rounded-card card-border p-6 flex flex-col justify-between hover:border-agent-violet/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-inner bg-agent-violet/15 border border-agent-violet/30 flex items-center justify-center text-agent-violet mb-4">
                <GitMerge className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-text-primary mb-2">2. Link</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Autonomous duplicate detector analyzes text similarity, Haversine geographic proximity, and category match. Scores ≥0.75 merge seamlessly without deleting citizen submissions.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/5 text-[10px] font-mono text-agent-violet">
              Linker Agent // Haversine 50m
            </div>
          </div>

          {/* Chapter 3: Prove */}
          <div className="bg-surface-1 rounded-card card-border p-6 flex flex-col justify-between hover:border-verified-teal/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-inner bg-verified-teal/15 border border-verified-teal/30 flex items-center justify-center text-verified-teal mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-text-primary mb-2">3. Prove</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Closure claims undergo 5 mandatory checks: geofence within 50m, photographic proof, completion terms, and chronological validity. Unsupported closures are rejected.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/5 text-[10px] font-mono text-verified-teal">
              Verifier Agent // Deterministic
            </div>
          </div>

          {/* Chapter 4: Recover */}
          <div className="bg-surface-1 rounded-card card-border p-6 flex flex-col justify-between hover:border-alert-red/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-inner bg-alert-red/15 border border-alert-red/30 flex items-center justify-center text-alert-red mb-4">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base text-text-primary mb-2">4. Recover</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Autonomous recovery triggers when a closure fails verification: the case immediately reopens, priority escalates (+1, capped at 5), and the SLA deadline resets.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-white/5 text-[10px] font-mono text-alert-red">
              Autonomous Recovery Loop
            </div>
          </div>
        </div>
      </section>

      {/* Signature Differentiator Banner */}
      <section id="safeguards" className="max-w-6xl mx-auto px-6 py-12 mb-16">
        <div className="bg-surface-2 rounded-card card-border p-8 md:p-12 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-civic-blue/5 pointer-events-none blur-3xl"></div>
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-mono text-sla-amber uppercase tracking-wider">
              Signature Architectural Feature
            </span>
            <h2 className="font-serif text-3xl font-normal text-white mt-2 mb-4">
              Autonomous Recovery from Failed Resolution
            </h2>
            <p className="text-xs md:text-sm text-text-muted leading-relaxed mb-8">
              In conventional municipal apps, a contractor or worker can mark a job resolved with a blurry photo taken kilometers away. CivicHelp executes an autonomous verification engine: if coordinates deviate by more than 50 meters or required completion criteria fail, the closure is rejected, the case is automatically reopened, priority escalates, and the SLA clock is recalculated.
            </p>
            <Link
              to="/app/simulation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-inner bg-civic-blue text-white text-xs font-semibold hover:bg-civic-blue-hover transition-all"
            >
              <span>Test the Bad-Closure Scenario in Simulator</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-8 px-8 bg-surface-1/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-civic-blue" />
            <span>CivicHelp // Smart Cities Civic Issue Management</span>
          </div>
          <div>Built for Hackathon Demonstration • Fully Tested Locally</div>
        </div>
      </footer>
    </div>
  );
};
