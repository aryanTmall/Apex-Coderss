import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { Incident, ClosureSubmission } from '../api/types';
import { EvidenceCheckItem } from '../components/common/EvidenceCheckItem';
import { StatusChip } from '../components/common/StatusChip';
import { GeofenceBreachMap } from '../components/map/GeofenceBreachMap';

export const VerificationPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const loadVerificationQueue = async () => {
    try {
      const data = await api.getIncidents({ limit: 50 });
      // Sort so cases needing review, reopened, or with closure submissions appear first
      const withClosures = data.filter(
        i => (i.closure_submissions && i.closure_submissions.length > 0) || i.status === 'NEEDS_REVIEW' || i.status === 'REOPENED'
      );
      setIncidents(withClosures.length > 0 ? withClosures : data);
      if (withClosures.length > 0) {
        setSelectedIncident(withClosures[0]);
      } else if (data.length > 0) {
        setSelectedIncident(data[0]);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationQueue();
  }, []);

  const latestClosure = selectedIncident?.closure_submissions && selectedIncident.closure_submissions.length > 0
    ? selectedIncident.closure_submissions[selectedIncident.closure_submissions.length - 1]
    : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20">
              AUTONOMOUS EVIDENCE DESK
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
            Closure Verification Deck
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Multi-modal inspection verifying geofence proximity (tolerance &le; 50m), photographic references, completion terms, and temporal order.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Verification Queue */}
        <div className="bg-surface-1 rounded-card card-border p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[11px] font-mono text-text-muted uppercase">
            <span>Closure Submissions Queue</span>
            <span>{incidents.length} Records</span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[680px] pr-1">
            {incidents.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-text-muted">
                No active closure records.
              </div>
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const hasClosure = inc.closure_submissions && inc.closure_submissions.length > 0;
                const lastCls = hasClosure ? inc.closure_submissions![inc.closure_submissions!.length - 1] : null;

                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 rounded-inner text-left transition-all card-border flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-surface-2 border-civic-blue/50 shadow-md'
                        : 'bg-surface-2/40 hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-civic-blue">{inc.tracking_id}</span>
                      <StatusChip status={inc.status} size="sm" />
                    </div>
                    <div className="text-xs font-medium text-text-primary truncate">{inc.title}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-white/5">
                      <span>{inc.category.replace('_', ' ')}</span>
                      {lastCls && (
                        <span className={`font-bold ${
                          lastCls.verdict === 'APPROVED' ? 'text-verified-teal' :
                          lastCls.verdict === 'REJECTED' ? 'text-alert-red' : 'text-sla-amber'
                        }`}>
                          {lastCls.verdict}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Evidence Inspector */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedIncident ? (
            <div className="bg-surface-1 rounded-card card-border p-6 shadow-xl flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-civic-blue">{selectedIncident.tracking_id}</span>
                    <StatusChip status={selectedIncident.status} />
                  </div>
                  <h2 className="text-xl font-serif text-text-primary">{selectedIncident.title}</h2>
                </div>
                <Link
                  to={`/app/incidents/${selectedIncident.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all"
                >
                  <span>Full Case Detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {latestClosure ? (
                <div className="flex flex-col gap-5">
                  {/* Verdict Banner */}
                  <div className={`p-4 rounded-inner card-border flex items-center justify-between gap-4 ${
                    latestClosure.verdict === 'APPROVED' ? 'bg-verified-teal/10 border-verified-teal/30' :
                    latestClosure.verdict === 'REJECTED' ? 'bg-alert-red/10 border-alert-red/30' :
                    'bg-sla-amber/10 border-sla-amber/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      {latestClosure.verdict === 'APPROVED' && <CheckCircle2 className="w-6 h-6 text-verified-teal shrink-0" />}
                      {latestClosure.verdict === 'REJECTED' && <XCircle className="w-6 h-6 text-alert-red shrink-0" />}
                      {latestClosure.verdict === 'NEEDS_REVIEW' && <AlertTriangle className="w-6 h-6 text-sla-amber shrink-0" />}
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold block text-text-muted">
                          Deterministic Verification Verdict
                        </span>
                        <span className={`text-base font-mono font-bold ${
                          latestClosure.verdict === 'APPROVED' ? 'text-verified-teal' :
                          latestClosure.verdict === 'REJECTED' ? 'text-alert-red' : 'text-sla-amber'
                        }`}>
                          {latestClosure.verdict} // {latestClosure.verdict === 'REJECTED' ? 'CASE REOPENED & SLA RESET' : 'OFFICIALLY VERIFIED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submitted Evidence Box */}
                  <div className="bg-surface-2/40 rounded-inner card-border p-4 text-xs font-mono flex flex-col gap-2">
                    <span className="text-[10px] text-text-muted uppercase">Department Closure Claim:</span>
                    <p className="text-text-primary font-sans text-xs italic">
                      "{latestClosure.description}"
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5 text-[11px]">
                      <div>
                        <span className="text-text-muted block">Photo Evidence:</span>
                        <span className="text-civic-blue">{latestClosure.photo_ref || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Submitted Coords:</span>
                        <span className="text-text-primary">
                          {latestClosure.latitude ? `${latestClosure.latitude.toFixed(5)}, ${latestClosure.longitude?.toFixed(5)}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Submission Time:</span>
                        <span className="text-text-primary">
                          {new Date(latestClosure.submitted_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Deterministic Checks */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider font-semibold">
                      Check-Level Autonomous Audit Breakdown:
                    </span>
                    {Object.values(latestClosure.individual_checks || {}).map((chk: any, idx) => (
                      <EvidenceCheckItem key={idx} check={chk} />
                    ))}
                  </div>

                  {/* Visual Geofence Breach Map */}
                  {selectedIncident.latitude && selectedIncident.longitude && latestClosure.latitude && latestClosure.longitude && (
                    <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider font-semibold">
                        Geofence Distance & Breach Analysis:
                      </span>
                      <GeofenceBreachMap
                        incidentLat={selectedIncident.latitude}
                        incidentLon={selectedIncident.longitude}
                        incidentTitle={selectedIncident.title}
                        closureLat={latestClosure.latitude}
                        closureLon={latestClosure.longitude}
                        departmentName={selectedIncident.department_id || 'Contractor Crew'}
                        trustScore={latestClosure.verdict === 'REJECTED' ? 70 : 95}
                        height="260px"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-mono text-text-muted bg-surface-2/20 rounded-inner">
                  No closure evidence submitted for this case yet.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-1 rounded-card card-border p-12 text-center text-xs font-mono text-text-muted">
              Select an incident from the queue to inspect closure telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
