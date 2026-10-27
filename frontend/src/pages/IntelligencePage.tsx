import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  RotateCcw,
  AlertOctagon,
  Layers,
  ArrowRight,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Flame,
  Radio,
  Clock,
  CheckCircle2,
  Navigation,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { RecurringIncident, RootCauseHypothesis, Hotspot, EscalationRecord } from '../api/types';
import { StatusChip } from '../components/common/StatusChip';
import { PriorityBadge } from '../components/common/PriorityBadge';

export const IntelligencePage: React.FC = () => {
  const [recurring, setRecurring] = useState<RecurringIncident[]>([]);
  const [rootCauses, setRootCauses] = useState<RootCauseHypothesis[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [unconfirmedReports, setUnconfirmedReports] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Corroboration modal state
  const [selectedReportToCorroborate, setSelectedReportToCorroborate] = useState<any | null>(null);
  const [corrobLat, setCorrobLat] = useState<number>(28.5714);
  const [corrobLon, setCorrobLon] = useState<number>(77.2225);
  const [corrobAddress, setCorrobAddress] = useState<string>('South Extension Part 2 Service Road');
  const [corrobNotes, setCorrobNotes] = useState<string>('Corroborated by field supervisor dispatch.');
  const [isCorroborating, setIsCorroborating] = useState(false);

  const loadIntelligence = async () => {
    try {
      const [rec, rc, hs, unconf, esc] = await Promise.all([
        api.getRecurringIncidents(),
        api.getRootCauses(),
        api.getHotspots(),
        api.getUnconfirmedReports(),
        api.getEscalations(),
      ]);
      setRecurring(rec);
      setRootCauses(rc);
      setHotspots(hs);
      setUnconfirmedReports(unconf);
      setEscalations(esc);
    } catch (err) {
      console.error('Failed to load civic intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, []);

  const handleCorroborate = async () => {
    if (!selectedReportToCorroborate) return;
    setIsCorroborating(true);
    try {
      await api.corroborateReport(
        selectedReportToCorroborate.report_id,
        corrobLat,
        corrobLon,
        corrobAddress,
        corrobNotes
      );
      setSelectedReportToCorroborate(null);
      await loadIntelligence();
    } catch (err: any) {
      alert('Failed to corroborate: ' + (err.message || err));
    } finally {
      setIsCorroborating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-agent-violet uppercase tracking-widest px-2 py-0.5 rounded-full bg-agent-violet/10 border border-agent-violet/20">
              CIVIC MEMORY & SYSTEMIC INFERENCE
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
            Spatial Intelligence & Root Causes
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Multi-tier governance escalations, spatial clustering (&ge;3 cases within 150m), unconfirmed field triage, and systemic infrastructure failure hypotheses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadIntelligence}
          className="flex items-center gap-1.5 h-8 px-3 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-agent-violet" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* 1. Spatial Hotspots */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-text-primary">
            <Flame className="w-4 h-4 text-risk-red" />
            <span>Active Spatial Hotspots ({hotspots.length})</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">RADIUS: 150M CLUSTER &le; 7 DAYS</span>
        </div>

        {hotspots.length === 0 ? (
          <div className="bg-surface-1 rounded-card card-border p-6 text-center text-xs font-mono text-text-muted">
            No active spatial hotspots detected.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotspots.map((h) => (
              <div
                key={h.id}
                className="bg-surface-1 rounded-card card-border p-4 border-l-4 border-l-risk-red flex flex-col justify-between gap-2 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-risk-red">
                      {h.severity_level} SEVERITY
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-2 text-[10px] font-mono text-text-muted">
                      {h.incident_count} Incidents
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-text-primary">{h.name}</h3>
                  <div className="text-[11px] text-text-muted font-mono mt-1">
                    Center: {h.center_latitude.toFixed(4)}, {h.center_longitude.toFixed(4)} • Radius: {h.radius_meters}m
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-white/5">
                  <span>Detected: {new Date(h.detected_at).toLocaleDateString()}</span>
                  <Link
                    to={`/app?search=${encodeURIComponent(h.category)}`}
                    className="text-civic-blue hover:underline flex items-center gap-1"
                  >
                    <span>View Grouped Cases</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Unconfirmed Location Reports Triage Queue */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-text-primary">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>Unconfirmed Location Reports Queue ({unconfirmedReports.length})</span>
          </div>
          <span className="text-[10px] font-mono text-purple-400">CITIZENS REPORTING OFF-SITE</span>
        </div>

        {unconfirmedReports.length === 0 ? (
          <div className="bg-surface-1 rounded-card card-border p-6 text-center text-xs font-mono text-text-muted">
            All citizen reports have confirmed geospatial coordinates. No pending unconfirmed cases in queue.
          </div>
        ) : (
          <div className="space-y-2.5">
            {unconfirmedReports.map((rep) => (
              <div
                key={rep.report_id}
                className="bg-surface-1 rounded-card card-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-purple-500"
              >
                <div className="flex flex-col gap-1 max-w-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-purple-400">{rep.tracking_id}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">
                      {rep.category}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {rep.observation_time || 'Observed earlier'}
                    </span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed">{rep.text}</p>
                  <div className="text-[11px] text-text-muted font-mono">
                    Approximate Area: <strong>{rep.approximate_locality}</strong> ({rep.location_description})
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportToCorroborate(rep);
                      setCorrobAddress(rep.approximate_locality || 'South Extension');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Corroborate GPS</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Corroborate Modal */}
      {selectedReportToCorroborate && (
        <div className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-1 rounded-2xl border border-white/10 max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-text-primary">
                Corroborate Coordinates for {selectedReportToCorroborate.tracking_id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReportToCorroborate(null)}
                className="text-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Enter verified GPS coordinates from field dispatch inspector:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-text-muted">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={corrobLat}
                  onChange={(e) => setCorrobLat(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-night border border-white/10 rounded text-xs font-mono text-text-primary mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={corrobLon}
                  onChange={(e) => setCorrobLon(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-night border border-white/10 rounded text-xs font-mono text-text-primary mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-text-muted">Recognized Street Address</label>
              <input
                type="text"
                value={corrobAddress}
                onChange={(e) => setCorrobAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-night border border-white/10 rounded text-xs text-text-primary mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-text-muted">Field Inspector Notes</label>
              <input
                type="text"
                value={corrobNotes}
                onChange={(e) => setCorrobNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-night border border-white/10 rounded text-xs text-text-primary mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReportToCorroborate(null)}
                className="px-3 py-1.5 rounded-lg bg-surface-2 text-text-muted text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCorroborate}
                disabled={isCorroborating}
                className="px-4 py-1.5 rounded-lg bg-verified-teal hover:bg-verified-teal/90 text-night font-bold text-xs shadow"
              >
                {isCorroborating ? 'Corroborating...' : 'Confirm Corroboration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Multi-Tier Governance Escalations */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-text-primary">
            <ShieldAlert className="w-4 h-4 text-risk-red" />
            <span>Governance Escalation Registry ({escalations.length})</span>
          </div>
          <span className="text-[10px] font-mono text-risk-red">SUPERVISOR → WARD → COMMISSIONER</span>
        </div>

        {escalations.length === 0 ? (
          <div className="bg-surface-1 rounded-card card-border p-6 text-center text-xs font-mono text-text-muted">
            No active governance escalations. All incidents within routine SLA tiers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {escalations.map((esc) => (
              <div key={esc.id} className="bg-surface-1 rounded-card card-border p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-red/15 text-risk-red border border-risk-red/30">
                    LEVEL {esc.tier} // {esc.tier_name}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">
                    {new Date(esc.triggered_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs font-semibold text-text-primary">{esc.authority_title}</div>
                <p className="text-[11px] text-text-muted leading-relaxed">{esc.reason}</p>
                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <Link
                    to={`/app/incidents/${esc.incident_id}`}
                    className="text-xs font-mono text-civic-blue hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Incident</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Root Cause Hypotheses */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase font-semibold text-text-primary">
            <BrainCircuit className="w-4 h-4 text-sla-amber" />
            <span>Systemic Root-Cause Hypotheses ({rootCauses.length})</span>
          </div>
        </div>

        {rootCauses.length === 0 ? (
          <div className="bg-surface-1 rounded-card card-border p-6 text-center text-xs font-mono text-text-muted">
            Insufficient clustering evidence for systemic root-cause hypotheses.
          </div>
        ) : (
          rootCauses.map((rc, idx) => (
            <div key={idx} className="bg-surface-1 rounded-card card-border p-4 border border-sla-amber/30 flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold text-sla-amber uppercase">
                {rc.disclaimer}
              </span>
              <p className="text-xs font-medium text-text-primary leading-relaxed">{rc.hypothesis}</p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-text-muted pt-1 border-t border-white/5">
                <span>Categories: {rc.categories.join(', ')}</span>
                <span>Incidents: {rc.incident_count}</span>
                <span>Confidence: {rc.confidence}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
