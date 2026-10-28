import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertOctagon,
  Clock,
  CheckCircle2,
  GitMerge,
  RotateCcw,
  RefreshCw,
  Filter,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
  PlusCircle,
  AlertTriangle,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import { Incident, Metrics, AuditEvent, Hotspot } from '../api/types';
import { KpiCard } from '../components/common/KpiCard';
import { StatusChip } from '../components/common/StatusChip';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SlaTimer } from '../components/common/SlaTimer';
import { AgentBadge } from '../components/common/AgentBadge';
import { IncidentMap } from '../components/map/IncidentMap';

export const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [incsRes, metsRes, evtsRes, hsRes] = await Promise.allSettled([
        api.getIncidents({ search: searchFilter || undefined, limit: 600 }),
        api.getMetrics(),
        api.getAuditEvents(12),
        api.getHotspots(),
      ]);
      if (incsRes.status === 'fulfilled' && incsRes.value) setIncidents(incsRes.value);
      if (metsRes.status === 'fulfilled' && metsRes.value) setMetrics(metsRes.value);
      if (evtsRes.status === 'fulfilled' && evtsRes.value) setAuditEvents(evtsRes.value);
      if (hsRes.status === 'fulfilled' && hsRes.value) setHotspots(hsRes.value);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [searchFilter]);

  // Filtered list
  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter === 'OPEN' && inc.status === 'RESOLVED') return false;
    if (statusFilter === 'UNCONFIRMED') {
      return inc.location_mode === 'UNCONFIRMED' || inc.location_status === 'LOCATION_UNCONFIRMED';
    }
    if (statusFilter !== 'ALL' && statusFilter !== 'OPEN' && inc.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && inc.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    return true;
  });

  const handleSeedSpike = async () => {
    try {
      await api.seedPotholeScenario();
      await loadData();
    } catch (err) {
      alert('Failed to simulate spike: ' + err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header & Tactical Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20">
              MUNICIPAL MESH v4.12
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] font-mono text-text-muted">
              ACTIVE NODE: FEDERATION 04
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-text-primary tracking-tight">
            Operations Console
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-2xl leading-relaxed">
            Autonomous municipal triage, multi-factor duplicate grouping & verifiable field recovery for public civic infrastructure.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 h-9 px-3 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-verified-teal ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            type="button"
            onClick={handleSeedSpike}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-inner bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-semibold shadow-md shadow-civic-blue/20 transition-all"
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Simulate Multi-Report Pothole</span>
          </button>
          <Link
            to="/app/report"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-semibold text-text-primary transition-all"
          >
            <PlusCircle className="w-4 h-4 text-civic-blue" />
            <span>Report Issue</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Open Cases"
          value={metrics ? metrics.open_cases : '—'}
          delta="+8/h"
          deltaType="neutral"
          subtext="Autonomous routing"
          subValue="94%"
          progressPct={metrics ? (metrics.open_cases / (metrics.canonical_incidents || 1)) * 100 : 0}
          icon={AlertOctagon}
          variant="blue"
        />
        <KpiCard
          label="Overdue / At Risk"
          value={metrics ? metrics.overdue_cases : '—'}
          delta="<15m SLA"
          deltaType="warning"
          subtext="Breached dispatches"
          subValue={metrics ? `${metrics.escalated_cases} Esc` : '—'}
          progressPct={metrics && metrics.open_cases ? (metrics.overdue_cases / metrics.open_cases) * 100 : 0}
          icon={AlertOctagon}
          variant="red"
        />
        <KpiCard
          label="SLA Compliance"
          value={metrics ? `${metrics.sla_compliance_pct}%` : '—'}
          delta="+1.4%"
          deltaType="positive"
          subtext="Charter standard"
          subValue="95.0%"
          progressPct={metrics ? metrics.sla_compliance_pct : 95}
          icon={CheckCircle2}
          variant="teal"
        />
        <KpiCard
          label="Duplicate Link Rate"
          value={metrics ? `${metrics.duplicate_link_rate_pct}%` : '—'}
          delta="Haversine 50m"
          deltaType="neutral"
          subtext="Clustered reports"
          subValue={metrics ? `${metrics.total_reports} Tot` : '—'}
          progressPct={metrics ? metrics.duplicate_link_rate_pct : 0}
          icon={GitMerge}
          variant="amber"
        />
        <KpiCard
          label="Median Resolution"
          value={metrics ? `${metrics.median_resolution_min}m` : '—'}
          delta="Verified"
          deltaType="positive"
          subtext="Closure rejection"
          subValue={metrics ? `${metrics.closure_rejection_rate_pct}%` : '—'}
          progressPct={metrics ? 100 - metrics.closure_rejection_rate_pct : 85}
          icon={Clock}
          variant="blue"
        />
      </div>

      {/* Active Hotspot Warning Banner if Hotspots Exist */}
      {hotspots.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-surface-2 to-surface-2 rounded-xl border border-red-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <span>{hotspots.length} Active Spatial Hotspot Cluster(s) Detected</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
              </span>
              <span className="text-[11px] text-text-muted">
                {hotspots.map((h) => `${h.name} (${h.incident_count} cases)`).join(' • ')}
              </span>
            </div>
          </div>
          <Link
            to="/app/intelligence"
            className="px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-white/10 text-xs font-medium text-text-primary border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <span>Analyze Systemic Hypotheses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Geospatial Incident Grid (Interactive Leaflet Map with Category Colors & Clustering) */}
      <div className="w-full">
        <IncidentMap
          incidents={incidents}
          hotspots={hotspots}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          height="480px"
          showHotspots={true}
          showControls={true}
          showUnlocatedTab={true}
        />
      </div>

      {/* 4. Filter Bar & Incident Table */}
      <div className="bg-surface-1 rounded-card card-border p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-text-muted uppercase flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-civic-blue" />
              <span>Queue Filter:</span>
            </span>

            {/* Status pills */}
            {['ALL', 'OPEN', 'IN_PROGRESS', 'REOPENED', 'ESCALATED', 'UNCONFIRMED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-civic-blue text-white font-semibold shadow-sm'
                    : 'bg-surface-2 text-text-muted hover:text-text-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-2 text-text-primary text-xs font-mono h-8 px-2.5 rounded-inner card-border outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="pothole">Pothole / Road</option>
              <option value="water_leak">Water Leak</option>
              <option value="drainage">Drainage</option>
              <option value="streetlight">Streetlight</option>
              <option value="garbage">Garbage</option>
              <option value="other">Other / Custom</option>
            </select>
          </div>
        </div>

        {/* Table of Incidents */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                <th className="py-2.5 px-3">Tracking Code</th>
                <th className="py-2.5 px-3">Incident Summary</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Status & Governance</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">SLA Status</th>
                <th className="py-2.5 px-3">Reports</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted font-mono">
                    No active cases match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-surface-2/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedIncidentId(inc.id)}
                  >
                    <td className="py-3 px-3 font-mono font-semibold text-civic-blue whitespace-nowrap">
                      {inc.tracking_id}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-medium text-text-primary truncate">{inc.title}</div>
                      <div className="text-[11px] text-text-muted truncate mt-0.5">
                        {inc.address || inc.location_description || 'Coordinates locked'}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] uppercase text-text-muted">
                      {inc.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusChip status={inc.status} size="sm" />
                        {inc.escalation_tier > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-risk-red/15 text-risk-red text-[9px] font-mono font-bold border border-risk-red/30">
                            TIER {inc.escalation_tier}
                          </span>
                        )}
                        {inc.location_mode === 'UNCONFIRMED' && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 text-[9px] font-mono font-bold border border-purple-500/30">
                            APPROX
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PriorityBadge priority={inc.priority} />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <SlaTimer dueAt={inc.sla_due_at} status={inc.status} />
                    </td>
                    <td className="py-3 px-3 font-mono text-text-muted whitespace-nowrap">
                      {inc.reports_count} {inc.reports_count > 1 ? 'reports' : 'rep'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Link
                        to={`/app/incidents/${inc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 group-hover:bg-civic-blue text-text-muted group-hover:text-white text-xs font-medium transition-all"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Live Audit Telemetry Stream */}
      <div className="bg-surface-1 rounded-card card-border p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-agent-violet animate-pulse"></span>
            <span className="text-xs font-mono text-text-primary uppercase font-semibold">
              Live Audit Log // Agent & System Actions
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">STREAMING CHRONOLOGICAL PERSISTED EVENTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {auditEvents.slice(0, 6).map((ev) => (
            <div key={ev.id} className="p-2.5 rounded-inner bg-surface-2/40 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <AgentBadge actor={ev.actor} />
                  <span className="text-[10px] font-mono text-text-muted">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-text-primary truncate">{ev.action}</div>
                <p className="text-[11px] text-text-muted line-clamp-2 mt-1 leading-snug">{ev.reason}</p>
              </div>
              {ev.to_status && (
                <div className="mt-2 pt-1 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                  <span>Target Status:</span>
                  <StatusChip status={ev.to_status} size="sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
