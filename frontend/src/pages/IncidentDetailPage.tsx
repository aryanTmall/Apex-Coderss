import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Play,
  FileCheck2,
  UserCheck,
  GitMerge,
  MapPin,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { Incident, Department, ClosureSubmission } from '../api/types';
import { StatusChip } from '../components/common/StatusChip';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { SlaTimer } from '../components/common/SlaTimer';
import { TimelineItem } from '../components/common/TimelineItem';
import { EvidenceCheckItem } from '../components/common/EvidenceCheckItem';
import { IncidentMap } from '../components/map/IncidentMap';
import { GeofenceBreachMap } from '../components/map/GeofenceBreachMap';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Closure modal state
  const [showClosureModal, setShowClosureModal] = useState<boolean>(false);
  const [closureDesc, setClosureDesc] = useState<string>(
    'Pothole completely filled, patched with asphalt, and road resurfaced.'
  );
  const [closurePhoto, setClosurePhoto] = useState<string>('photo_repaired_proof_01.jpg');
  const [closureLat, setClosureLat] = useState<number>(0);
  const [closureLon, setClosureLon] = useState<number>(0);
  const [submittingClosure, setSubmittingClosure] = useState<boolean>(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REOPEN' | 'ASSIGN'>('APPROVE');
  const [reviewNote, setReviewNote] = useState<string>('Supervisor field inspection confirmed satisfactory work.');
  const [reviewDeptId, setReviewDeptId] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const loadIncident = async () => {
    if (!id) return;
    try {
      const [inc, depts] = await Promise.all([
        api.getIncident(id),
        api.getDepartments(),
      ]);
      setIncident(inc);
      setDepartments(depts);
      if (inc.latitude && inc.longitude) {
        setClosureLat(inc.latitude);
        setClosureLon(inc.longitude);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load incident detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const handleStartWork = async () => {
    if (!incident) return;
    try {
      await api.startWork(incident.id);
      await loadIncident();
    } catch (err: any) {
      alert('Error starting work: ' + err.message);
    }
  };

  const handleSubmitClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    setSubmittingClosure(true);
    try {
      await api.submitClosure(incident.id, {
        description: closureDesc,
        photo_ref: closurePhoto,
        latitude: closureLat,
        longitude: closureLon,
        department_id: incident.department_id || undefined,
      });
      setShowClosureModal(false);
      await loadIncident();
    } catch (err: any) {
      alert('Closure error: ' + err.message);
    } finally {
      setSubmittingClosure(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    setSubmittingReview(true);
    try {
      await api.reviewIncident(incident.id, {
        decision: reviewDecision,
        note: reviewNote,
        department_id: reviewDecision === 'ASSIGN' ? reviewDeptId : undefined,
      });
      setShowReviewModal(false);
      await loadIncident();
    } catch (err: any) {
      alert('Review error: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-mono text-text-muted">
        Loading Incident Telemetry...
      </div>
    );
  }

  if (errorMsg || !incident) {
    return (
      <div className="py-12 text-center">
        <div className="text-sm font-mono text-alert-red mb-4">{errorMsg || 'Incident not found'}</div>
        <Link to="/app" className="text-xs font-mono text-civic-blue hover:underline">
          ← Return to Operations Console
        </Link>
      </div>
    );
  }

  const deptObj = departments.find(d => d.id === incident.department_id);
  const latestClosure = incident.closure_submissions && incident.closure_submissions.length > 0
    ? incident.closure_submissions[incident.closure_submissions.length - 1]
    : null;

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Back button & top metadata */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <Link to="/app" className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations Queue</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted">RECORD ID: {incident.id}</span>
        </div>
      </div>

      {/* Main Incident Hero Header */}
      <div className="bg-surface-1 rounded-card card-border p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-mono font-bold text-civic-blue">{incident.tracking_id}</span>
            <StatusChip status={incident.status} />
            <PriorityBadge priority={incident.priority} />
            {incident.escalation_tier > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-risk-red/20 text-risk-red border border-risk-red/30 uppercase">
                GOVERNANCE TIER {incident.escalation_tier}
              </span>
            )}
            {incident.location_mode === 'UNCONFIRMED' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                UNCONFIRMED LOCATION
              </span>
            )}
            {incident.recurring_flag && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-sla-amber border border-sla-amber/30 uppercase">
                RECURRING
              </span>
            )}
          </div>
          <div>
            <SlaTimer dueAt={incident.sla_due_at} status={incident.status} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif text-text-primary mb-1">{incident.title}</h1>
            <p className="text-xs text-text-muted font-sans max-w-3xl leading-relaxed">
              {incident.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {incident.status === 'ASSIGNED' && (
              <button
                type="button"
                onClick={handleStartWork}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-inner bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-semibold font-mono shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Dispatch Crew (Start Work)</span>
              </button>
            )}

            {incident.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => setShowClosureModal(true)}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-verified-teal" />
                <span>Submit Closure Evidence</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-agent-violet" />
              <span>Supervisor Review</span>
            </button>
          </div>
        </div>

        {/* Priority Reasons */}
        {incident.priority_reasons && incident.priority_reasons.length > 0 && (
          <div className="bg-surface-2/40 rounded-inner p-3 border border-white/5 flex flex-col gap-1 text-[11px] font-mono">
            <span className="text-text-muted uppercase text-[10px]">Triage Priority Rationale:</span>
            {incident.priority_reasons.map((r, i) => (
              <div key={i} className="text-text-primary flex items-start gap-1.5">
                <span className="text-civic-blue">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Evidence, Map, Linked Reports */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Geospatial Map */}
          <div className="bg-surface-1 rounded-card card-border p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono text-text-primary uppercase font-semibold">
                <MapPin className="w-4 h-4 text-civic-blue" />
                <span>Geofenced Site Telemetry</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {incident.latitude ? `${incident.latitude.toFixed(6)}, ${incident.longitude?.toFixed(6)}` : 'UNMAPPED'}
              </span>
            </div>
            <IncidentMap
              incidents={[incident]}
              height="240px"
            />
            {incident.location_description && (
              <div className="text-xs text-text-muted font-mono mt-2 pt-2 border-t border-white/5">
                Landmark: <span className="text-text-primary">{incident.location_description}</span>
              </div>
            )}
          </div>

          {/* Verification Checks Card (Crucial Feature) */}
          <div className="bg-surface-1 rounded-card card-border p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-verified-teal" />
                <span className="text-xs font-mono text-text-primary uppercase font-semibold">
                  Autonomous Verification Engine (5 Multi-Modal Checks)
                </span>
              </div>
              {latestClosure && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  latestClosure.verdict === 'APPROVED' ? 'bg-verified-teal/20 text-verified-teal' :
                  latestClosure.verdict === 'REJECTED' ? 'bg-alert-red/20 text-alert-red' :
                  'bg-sla-amber/20 text-sla-amber'
                }`}>
                  LATEST VERDICT: {latestClosure.verdict}
                </span>
              )}
            </div>

            {latestClosure ? (
              <div className="flex flex-col gap-3">
                <div className="bg-surface-2/40 rounded-inner p-3 border border-white/5 text-xs">
                  <div className="text-[10px] font-mono text-text-muted uppercase mb-1">
                    Submitted Evidence Description:
                  </div>
                  <p className="text-text-primary italic">"{latestClosure.description}"</p>
                  <div className="text-[10px] font-mono text-text-muted mt-2 flex items-center gap-4">
                    <span>Photo Proof: <strong className="text-civic-blue">{latestClosure.photo_ref || 'None'}</strong></span>
                    <span>Site Dist: <strong className="text-text-primary">GPS Verified</strong></span>
                  </div>
                </div>

                {/* 5 Checks Checklist */}
                <div className="flex flex-col gap-2 mt-2">
                  {Object.values(latestClosure.individual_checks || {}).map((chk: any, idx) => (
                    <EvidenceCheckItem key={idx} check={chk} />
                  ))}
                </div>

                {/* Visual Geofence Breach Map if closure coordinates exist */}
                {incident.latitude && incident.longitude && latestClosure.latitude && latestClosure.longitude && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[11px] font-mono uppercase text-text-muted mb-2 font-semibold">
                      Geofence Telemetry & Site Breach Analysis
                    </div>
                    <GeofenceBreachMap
                      incidentLat={incident.latitude}
                      incidentLon={incident.longitude}
                      incidentTitle={incident.title}
                      closureLat={latestClosure.latitude}
                      closureLon={latestClosure.longitude}
                      departmentName={deptObj?.name || 'Assigned Department'}
                      trustScore={deptObj?.trust_score ?? 85}
                      height="260px"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-text-muted bg-surface-2/20 rounded-inner">
                No closure claims submitted yet. Use "Submit Closure Evidence" to test verification checks.
              </div>
            )}
          </div>

          {/* Cryptographic Evidence & File Attachments */}
          {incident.attachments && incident.attachments.length > 0 && (
            <div className="bg-surface-1 rounded-card card-border p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-verified-teal" />
                  <span className="text-xs font-mono text-text-primary uppercase font-semibold">
                    Cryptographic Evidence Ledger ({incident.attachments.length})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-verified-teal/15 text-verified-teal">
                  SHA-256 HASHED
                </span>
              </div>

              <div className="space-y-2">
                {incident.attachments.map((att) => (
                  <div key={att.id} className="p-3 rounded-inner bg-surface-2/40 border border-white/5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-text-primary truncate">{att.original_filename}</span>
                      <span className="text-[10px] font-mono text-verified-teal truncate">
                        SHA-256: {att.sha256_hash}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-text-muted">
                        {(att.file_size / 1024).toFixed(1)} KB
                      </span>
                      {att.download_url && (
                        <a
                          href={att.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-surface-3 hover:bg-white/10 text-[10px] font-mono text-civic-blue transition-colors"
                        >
                          View File
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Citizen Reports */}
          <div className="bg-surface-1 rounded-card card-border p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-agent-violet" />
                <span className="text-xs font-mono text-text-primary uppercase font-semibold">
                  Linked Citizen Reports ({incident.reports?.length || 1})
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">NEVER OVERWRITTEN</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {incident.reports?.map((rep, idx) => (
                <div key={rep.id} className="p-3 rounded-inner bg-surface-2/40 border border-white/5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-semibold text-civic-blue">{rep.tracking_id}</span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {new Date(rep.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-text-primary/90 leading-relaxed mb-2">{rep.text}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-white/5">
                    <span>Reporter: {rep.reporter_name || 'Anonymous'}</span>
                    {typeof rep.duplicate_score === 'number' && (
                      <span className="text-agent-violet font-semibold">
                        Match Score: {(rep.duplicate_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Complete Audit Timeline */}
        <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-verified-teal" />
              <span className="text-xs font-mono text-text-primary uppercase font-semibold">
                Chronological Audit Trail
              </span>
            </div>
            <span className="text-[10px] font-mono text-text-muted">IMMUTABLE LOG</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[750px] pr-1">
            {incident.audit_events && incident.audit_events.length > 0 ? (
              incident.audit_events.map((ev, idx) => (
                <TimelineItem
                  key={ev.id}
                  event={ev}
                  isLast={idx === incident.audit_events!.length - 1}
                />
              ))
            ) : (
              <div className="text-xs font-mono text-text-muted py-8 text-center">
                No audit events recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Closure Submission Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface-1 rounded-card card-border max-w-lg w-full p-6 shadow-2xl relative border-white/10">
            <h3 className="text-lg font-serif text-text-primary mb-1">
              Submit Closure Evidence
            </h3>
            <p className="text-xs text-text-muted mb-4 font-mono">
              Evaluated autonomously against 5 deterministic verification rules.
            </p>

            <form onSubmit={handleSubmitClosure} className="flex flex-col gap-4 text-xs font-mono">
              <div>
                <label className="text-text-muted block mb-1 uppercase">Completion Description</label>
                <textarea
                  rows={3}
                  value={closureDesc}
                  onChange={(e) => setClosureDesc(e.target.value)}
                  className="w-full bg-night rounded-inner p-2.5 text-text-primary card-border outline-none focus:border-civic-blue font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1 uppercase">Photo Proof Reference</label>
                <input
                  type="text"
                  value={closurePhoto}
                  onChange={(e) => setClosurePhoto(e.target.value)}
                  className="w-full h-8 px-2.5 bg-night rounded-inner text-text-primary card-border outline-none focus:border-civic-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-text-muted block mb-1 uppercase">Submitted Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={closureLat}
                    onChange={(e) => setClosureLat(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 bg-night rounded-inner text-text-primary card-border outline-none focus:border-civic-blue"
                  />
                </div>
                <div>
                  <label className="text-text-muted block mb-1 uppercase">Submitted Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={closureLon}
                    onChange={(e) => setClosureLon(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 bg-night rounded-inner text-text-primary card-border outline-none focus:border-civic-blue"
                  />
                </div>
              </div>
              <span className="text-[10px] text-text-muted">
                Tip: Coordinates &gt;50m away will trigger autonomous verification rejection & case reopening.
              </span>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 rounded-inner bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClosure}
                  className="px-5 py-2 rounded-inner bg-civic-blue hover:bg-civic-blue-hover text-white font-semibold shadow-md shadow-civic-blue/20 transition-all"
                >
                  {submittingClosure ? 'Evaluating...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface-1 rounded-card card-border max-w-md w-full p-6 shadow-2xl relative border-white/10">
            <h3 className="text-lg font-serif text-text-primary mb-1">
              Authorized Supervisor Review
            </h3>
            <p className="text-xs text-text-muted mb-4 font-mono">
              Apply administrative override with mandatory recorded audit reasoning.
            </p>

            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 text-xs font-mono">
              <div>
                <label className="text-text-muted block mb-1 uppercase">Review Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['APPROVE', 'REOPEN', 'ASSIGN'] as const).map((dec) => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => setReviewDecision(dec)}
                      className={`py-2 rounded-inner text-xs font-bold transition-all ${
                        reviewDecision === dec
                          ? 'bg-civic-blue text-white shadow-md'
                          : 'bg-surface-2 text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {dec}
                    </button>
                  ))}
                </div>
              </div>

              {reviewDecision === 'ASSIGN' && (
                <div>
                  <label className="text-text-muted block mb-1 uppercase">Target Department</label>
                  <select
                    value={reviewDeptId}
                    onChange={(e) => setReviewDeptId(e.target.value)}
                    className="w-full h-8 px-2 bg-night rounded-inner text-text-primary card-border outline-none"
                    required
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-text-muted block mb-1 uppercase">Decision Note (Mandatory)</label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Provide explicit operational justification..."
                  className="w-full bg-night rounded-inner p-2.5 text-text-primary card-border outline-none focus:border-civic-blue font-sans text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-inner bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-inner bg-civic-blue hover:bg-civic-blue-hover text-white font-semibold shadow-md shadow-civic-blue/20 transition-all"
                >
                  {submittingReview ? 'Recording...' : 'Commit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
