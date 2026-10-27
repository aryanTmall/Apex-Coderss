import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  GitMerge,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Download,
} from 'lucide-react';
import { api } from '../api/client';
import { TrackingData } from '../api/types';
import { StatusChip } from '../components/common/StatusChip';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SlaTimer } from '../components/common/SlaTimer';

export const TrackPage: React.FC = () => {
  const { trackingId } = useParams<{ trackingId?: string }>();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState<string>(trackingId || '');
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTracking = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.trackIncident(id.trim());
      setData(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Tracking ID not found in municipal records.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingId) {
      setInputVal(trackingId);
      fetchTracking(trackingId);
    }
  }, [trackingId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    navigate(`/app/track/${inputVal.trim()}`);
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20">
            PUBLIC CITIZEN TELEMETRY
          </span>
        </div>
        <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
          Track Civic Resolution
        </h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Verify work order dispatches, evidence inspection records, and SLA countdowns in real time.
        </p>
      </div>

      {/* Tracking Input Card */}
      <form onSubmit={handleSearch} className="bg-surface-1 rounded-card card-border p-4 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter Public Tracking ID (e.g. REP-B943A1 or CIV-2026-9841)..."
            className="w-full h-10 pl-9 pr-3 bg-night rounded-inner text-xs font-mono text-text-primary card-border outline-none focus:border-civic-blue uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-6 rounded-inner bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-semibold font-mono tracking-wider transition-all shadow-md shadow-civic-blue/20 flex items-center justify-center gap-1.5"
        >
          {loading ? <span>Querying...</span> : <span>Track Status</span>}
        </button>
      </form>

      {errorMsg && (
        <div className="bg-alert-red/10 border border-alert-red/30 rounded-card p-4 text-xs font-mono text-alert-red flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Main Status Hero Card */}
          <div className="bg-surface-1 rounded-card card-border p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-civic-blue font-bold">{data.tracking_id}</span>
                {data.incident_tracking_id && data.incident_tracking_id !== data.tracking_id && (
                  <span className="text-[10px] font-mono text-text-muted">
                    Linked to case <strong className="text-text-primary">{data.incident_tracking_id}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => api.downloadTrackPdf(data.tracking_id)}
                  className="px-3 py-1.5 rounded-inner bg-verified-teal/15 hover:bg-verified-teal/25 text-verified-teal border border-verified-teal/30 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Summary</span>
                </button>
                <StatusChip status={data.status} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-serif text-text-primary mb-1">{data.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted font-mono mt-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-civic-blue" />
                  <span>{data.department_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Reported {new Date(data.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <SlaTimer dueAt={data.sla_due_at} status={data.status} />
                </div>
              </div>
            </div>

            {/* Duplicate Notice */}
            {data.is_linked_duplicate && (
              <div className="bg-agent-violet/10 border border-agent-violet/25 rounded-inner p-3.5 flex items-start gap-3 text-xs text-agent-violet">
                <GitMerge className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">
                    Autonomous Multi-Report Deduplication
                  </span>
                  <p className="text-[11px] leading-relaxed text-agent-violet/90">
                    {data.duplicate_explanation || 'This report was matched with an active nearby incident and linked to avoid duplicate municipal dispatches.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Verification & Resolution Timeline */}
          <div className="bg-surface-1 rounded-card card-border p-6 shadow-sm">
            <h3 className="text-xs font-mono text-text-primary uppercase tracking-wider font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-verified-teal" />
              <span>Verified Resolution Audit Trail</span>
            </h3>

            <div className="flex flex-col pl-2">
              {data.timeline.length === 0 ? (
                <div className="text-xs text-text-muted font-mono py-4">
                  No public state transitions recorded yet.
                </div>
              ) : (
                data.timeline.map((item, idx) => (
                  <div key={idx} className="relative flex gap-3 pb-6 group">
                    {idx < data.timeline.length - 1 && (
                      <div className="absolute left-2.5 top-5 bottom-0 w-[1px] bg-white/10"></div>
                    )}
                    <div className="relative mt-1 z-10 w-5 h-5 rounded-full bg-surface-2 border border-white/20 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-civic-blue"></span>
                    </div>
                    <div className="flex-1 bg-surface-2/40 rounded-inner card-border p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-text-primary">
                          {item.action}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
