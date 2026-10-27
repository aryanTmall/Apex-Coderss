import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { WhistleblowerCaseItem } from '../api/types';
import {
  ShieldAlert,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  FolderOpen,
  Scale
} from 'lucide-react';

export const WhistleblowerAdminPage: React.FC = () => {
  const [cases, setCases] = useState<WhistleblowerCaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status update form
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [newLabel, setNewLabel] = useState('VERIFIED_IRREGULARITY');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWhistleblowerCases();
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Access restricted: Whistleblower Auditor authorization required');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const openCaseDetail = async (id: string) => {
    try {
      setError(null);
      const detail = await api.getWhistleblowerCaseDetail(id);
      setSelectedCase(detail);
      setNewStatus(detail.status);
      setNewLabel(detail.verification_label);
      setOutcomeNotes(detail.investigation_outcome || '');
    } catch (err: any) {
      setError(err.message || 'Failed to open case file');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setUpdating(true);
      setError(null);
      setActionSuccess(null);
      await api.updateWhistleblowerCaseStatus(selectedCase.id, {
        status: newStatus,
        verification_label: newLabel,
        investigation_outcome: outcomeNotes
      });
      setActionSuccess(`Case ${selectedCase.id} successfully updated to ${newStatus}.`);
      await openCaseDetail(selectedCase.id);
      await fetchCases();
    } catch (err: any) {
      setError(err.message || 'Failed to update case file');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/50 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Segregated Anti-Corruption Ledger
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Auditor Role Protected
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Confidential Whistleblower Investigation Console
            </h1>
            <p className="text-slate-400 mt-1 max-w-3xl text-sm leading-relaxed">
              Restricted anti-corruption queue. Review anonymous allegations, inspect segregated evidence attachments, and log formal audit findings.
            </p>
          </div>

          <button
            onClick={fetchCases}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start md:self-auto"
            title="Refresh Dossiers"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="my-4 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="my-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Main Grid: Cases List & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
          {/* Cases Column */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-cyan-400" />
              Active Investigation Files ({cases.length})
            </h2>

            <div className="space-y-3">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openCaseDetail(c.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer shadow-lg ${
                    selectedCase?.id === c.id
                      ? 'bg-slate-800 border-rose-500 ring-1 ring-rose-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                      {c.id}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {c.narrative_preview}
                  </p>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>{c.ward_name}</span>
                    <span className="text-rose-400 font-medium">{c.allegation_category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dossier Detail Column */}
          <div className="lg:col-span-2">
            {selectedCase ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/40">
                      {selectedCase.id}
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      {selectedCase.title}
                    </h2>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {selectedCase.verification_label}
                  </span>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <span className="font-semibold text-white">{selectedCase.allegation_category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ward</span>
                    <span className="font-semibold text-white">{selectedCase.ward_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Suspect Entity</span>
                    <span className="font-semibold text-slate-200">{selectedCase.suspect_organization || 'Unspecified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Identity Status</span>
                    <span className="font-semibold text-amber-400">{selectedCase.is_anonymous ? '100% Anonymous' : 'Pseudonymous'}</span>
                  </div>
                </div>

                {/* Narrative */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Whistleblower Allegation Narrative
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedCase.narrative}
                  </div>
                </div>

                {/* Status Update & Finding Form */}
                <form onSubmit={handleUpdateStatus} className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    Record Auditor Finding & Update Case Status
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Investigation Stage
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500"
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="TRIAGE">TRIAGE</option>
                        <option value="ASSIGNED_TO_AUTHORIZED_REVIEWER">ASSIGNED_TO_AUTHORIZED_REVIEWER</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="ACTION_RECOMMENDED">ACTION_RECOMMENDED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Evidentiary Verification Label
                      </label>
                      <select
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500"
                      >
                        <option value="UNVERIFIED_ALLEGATION">UNVERIFIED_ALLEGATION</option>
                        <option value="CORROBORATING_PHYSICAL_EVIDENCE">CORROBORATING_PHYSICAL_EVIDENCE</option>
                        <option value="VERIFIED_IRREGULARITY">VERIFIED_IRREGULARITY</option>
                        <option value="DISMISSED_UNSUBSTANTIATED">DISMISSED_UNSUBSTANTIATED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Formal Investigation Findings / Demolition & Sanction Notes
                    </label>
                    <textarea
                      rows={3}
                      value={outcomeNotes}
                      onChange={(e) => setOutcomeNotes(e.target.value)}
                      placeholder="Record formal field inspection results, statutory notices served, or penalties sanctioned..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {updating ? 'Recording...' : 'Update Investigation Record'}
                    </button>
                  </div>
                </form>

                {/* Audit Trail */}
                {selectedCase.audit_logs && selectedCase.audit_logs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Tamper-Evident Dossier Access Log
                    </h3>
                    <div className="space-y-1.5">
                      {selectedCase.audit_logs.map((log: any) => (
                        <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
                          <div>
                            <span className="font-semibold text-slate-200">{log.action}: </span>
                            <span>{log.details}</span>
                          </div>
                          <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select an active investigation file from the left to inspect full dossier.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
