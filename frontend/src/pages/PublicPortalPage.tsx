import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FilePlus,
  Search,
  PhoneCall,
  Radio,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Flame,
  Layers,
  Crosshair,
  Landmark,
  Users,
  Award,
  ShieldAlert,
  MessageSquare,
  Mic
} from 'lucide-react';
import { api } from '../api/client';
import { Metrics, Incident, Hotspot } from '../api/types';
import { IncidentMap } from '../components/map/IncidentMap';
import { PublicIntelligenceFeed } from '../components/news/PublicIntelligenceFeed';
import { EmergencyEtaSection } from '../components/emergency/EmergencyEtaSection';
import { VoiceReportModal } from '../components/voice/VoiceReportModal';
import { MessagingSimulatorModal } from '../components/messaging/MessagingSimulatorModal';

export const PublicPortalPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleVoiceApply = (data: { category: string; title: string; description: string; location_hint: string }) => {
    navigate('/app/report');
  };

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(() => {});
    api.getIncidents({ limit: 500 }).then(setIncidents).catch(() => {});
    api.getHotspots().then(setHotspots).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-4">
      {/* 1. Hero Welcome Banner */}
      <div className="relative rounded-2xl p-6 sm:p-10 bg-gradient-to-br from-surface-1 via-night to-surface-2 border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-civic-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-verified-teal/10 border border-verified-teal/30 text-xs font-mono text-verified-teal mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-verified-teal animate-pulse" />
            PUBLIC CITIZEN GATEWAY // CITIZEN TO VERIFIED RESOLUTION
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            Smart Cities Civic Issue Management & Verification
          </h1>

          <p className="text-sm text-text-muted mt-3 leading-relaxed">
            Report local civic hazards, track repair progress with cryptographic evidence, access national emergency hotlines, and monitor city-wide infrastructure intelligence.
          </p>

          {/* Quick Tracking Search Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter Tracking ID (e.g. CIV-2026-9841)"
                className="w-full pl-10 pr-3 py-2.5 bg-night border border-white/15 rounded-xl text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
              />
            </div>
            <Link
              to={trackingInput.trim() ? `/app/track?id=${encodeURIComponent(trackingInput.trim())}` : '/app/track'}
              className="px-5 py-2.5 rounded-xl bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-civic-blue/20 transition-all active:scale-95 shrink-0"
            >
              <span>Track Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 4 Core Public Citizen Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Report Issue */}
        <Link
          to="/app/report"
          className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-civic-blue/50 hover:bg-surface-2 transition-all duration-200 flex flex-col justify-between shadow-md"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-civic-blue/10 border border-civic-blue/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FilePlus className="w-5 h-5 text-civic-blue" />
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-civic-blue transition-colors">
              Report an Issue
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Guided 4-step wizard with Uber/Swiggy pin-dropper, GPS lock, Area Density Radar, and unconfirmed location mode.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-civic-blue">
            <span>Submit Complaint</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Track Report */}
        <Link
          to="/app/track"
          className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-verified-teal/50 hover:bg-surface-2 transition-all duration-200 flex flex-col justify-between shadow-md"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-verified-teal/10 border border-verified-teal/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 text-verified-teal" />
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-verified-teal transition-colors">
              Track Complaint
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Check live status, verified department assignment, SLA countdown, and download official PDF summaries.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-verified-teal">
            <span>Inspect Status</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Emergency Hotlines */}
        <Link
          to="/emergency"
          className="group rounded-xl p-5 bg-surface-1 border border-alert-red/30 hover:border-alert-red hover:bg-alert-red/5 transition-all duration-200 flex flex-col justify-between shadow-md"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-alert-red/10 border border-alert-red/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <PhoneCall className="w-5 h-5 text-alert-red animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-alert-red transition-colors">
              Emergency 112 & ETA
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Nearest police, fire, ambulance stations with road routing ETA, plus verified national hotlines.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-alert-red">
            <span>Emergency Hub</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Public Intelligence */}
        <a
          href="#intelligence-feed"
          className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-purple-500/50 hover:bg-surface-2 transition-all duration-200 flex flex-col justify-between shadow-md"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
              Civic Intelligence
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Live municipal news, monsoon drainage advisories, road resurfacing schedules, and urban resilience feeds.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-purple-400">
            <span>Read Feed Below</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </a>
      </div>

      {/* 2.5 Advanced Civic Accountability & Participation Modules */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-[10px] font-mono text-cyan-400 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CIVIC ACCOUNTABILITY & CITIZEN PARTICIPATION
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
              Democracy, Municipal Funds & Reporting Innovation
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Funds */}
          <Link
            to="/public/funds"
            className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-cyan-500/50 hover:bg-surface-2 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/50 flex items-center justify-center mb-3">
                <Landmark className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                Municipal Fund Tracker
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Ward-wise municipal expenditure, contractor project allocations, and verified public works milestones across New Delhi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-cyan-400">
              <span>Inspect Budgets</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 3: Participatory Budgeting */}
          <Link
            to="/public/participation"
            className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-indigo-500/50 hover:bg-surface-2 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-800/50 flex items-center justify-center mb-3">
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Participatory Budgeting
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Cast authenticated ballots on ward improvement proposals with server-enforced duplicate prevention.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-indigo-400">
              <span>Vote on Proposals</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 2: Civic Rewards */}
          <Link
            to="/public/rewards"
            className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-amber-500/50 hover:bg-surface-2 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-800/50 flex items-center justify-center mb-3">
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                Civic Rewards & Credits
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Earn verifiable points on an append-only ledger for reporting and redeem for digital transit and municipal passes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-amber-400">
              <span>View Leaderboard</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 7: Whistleblower */}
          <Link
            to="/public/confidential-report"
            className="group rounded-xl p-5 bg-surface-1 border border-rose-900/40 hover:border-rose-500/50 hover:bg-surface-2 transition-all flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-rose-950 border border-rose-800/50 flex items-center justify-center mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                Confidential Whistleblower
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Report corruption, procurement fraud, or substandard works with cryptographic token-based anonymity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-rose-400">
              <span>Encrypted Intake</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 4: Voice Assistant Trigger */}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-blue-500/50 hover:bg-surface-2 transition-all flex flex-col justify-between text-left shadow-md"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800/50 flex items-center justify-center mb-3">
                <Mic className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                Report by Voice (AI Assistant)
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Speak naturally in Hindi, English, or Hinglish. Gemini AI extracts category, formal title, and landmark location.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-blue-400">
              <span>Launch Voice Mic</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Module 5: WhatsApp Simulator Trigger */}
          <button
            type="button"
            onClick={() => setIsMessagingModalOpen(true)}
            className="group rounded-xl p-5 bg-surface-1 border border-white/10 hover:border-emerald-500/50 hover:bg-surface-2 transition-all flex flex-col justify-between text-left shadow-md"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800/50 flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                WhatsApp & SMS Bot Simulator
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Interactive simulator to test conversational issue reporting, status queries, and opt-out commands without API keys.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-emerald-400">
              <span>Open Simulator</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* 3. Section: Live City-Wide Geospatial Civic Issues Map */}
      <section id="civic-map" className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/30 text-[10px] font-mono text-verified-teal mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-verified-teal animate-pulse" />
              PUBLIC MUNICIPAL TRANSPARENCY MAP
            </div>
            <h2 className="font-serif text-2xl font-normal text-white">
              City-Wide Civic Issues Map
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Every reported issue is geolocated with distinct category colors, accessible icons, and marker clustering. Click any pin to view details and directions.
            </p>
          </div>
        </div>

        <IncidentMap
          incidents={incidents}
          hotspots={hotspots}
          height="540px"
          showControls={true}
          showUnlocatedTab={true}
        />
      </section>

      {/* 4. Section: Public Intelligence Feed inside Public Citizen Hub */}
      <section id="intelligence-feed" className="pt-2">
        <PublicIntelligenceFeed
          initialScope="ALL"
          title="Public Intelligence & Civic Dispatch"
          subtitle="Real-time municipal bulletins across Local (Around Me), City, State, National, and Global scopes."
        />
      </section>

      {/* 5. Section: Nearest Emergency Services & Live Dispatch ETA */}
      <section id="emergency-eta" className="pt-2">
        <EmergencyEtaSection />
      </section>

      {/* 6. Live Public Municipal Performance Metrics */}
      <div className="rounded-xl p-6 bg-surface-1 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-verified-teal" />
            <h2 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
              Live Public Municipal Performance Metrics
            </h2>
          </div>
          <span className="text-[10px] font-mono text-text-muted">Single Source of Truth (Database Powered)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-surface-2/60 border border-white/5">
            <span className="text-[10px] font-mono text-text-muted uppercase">Ingested Incidents</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics ? metrics.canonical_incidents.toLocaleString() : '...'}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-2/60 border border-white/5">
            <span className="text-[10px] font-mono text-text-muted uppercase">Active Cases</span>
            <div className="text-2xl font-bold font-mono text-civic-blue mt-1">
              {metrics ? metrics.open_cases.toLocaleString() : '...'}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-2/60 border border-white/5">
            <span className="text-[10px] font-mono text-text-muted uppercase">Verified Resolved</span>
            <div className="text-2xl font-bold font-mono text-verified-teal mt-1">
              {metrics ? metrics.resolved_cases.toLocaleString() : '...'}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-2/60 border border-white/5">
            <span className="text-[10px] font-mono text-text-muted uppercase">SLA Compliance</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {metrics ? `${metrics.sla_compliance_pct}%` : '...'}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Government Portal Link Banner */}
      <div className="p-4 rounded-xl bg-surface-2 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <Building className="w-4 h-4 text-civic-blue shrink-0" />
          <span className="text-text-muted">
            Are you a municipal engineer, field officer, or verification reviewer?
          </span>
        </div>
        <Link
          to="/government/login"
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs shrink-0 transition-colors flex items-center gap-1.5"
        >
          <span>Government Portal Login</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceReportModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApply={handleVoiceApply}
      />

      {/* WhatsApp / SMS Simulator Modal */}
      <MessagingSimulatorModal
        isOpen={isMessagingModalOpen}
        onClose={() => setIsMessagingModalOpen(false)}
      />
    </div>
  );
};
