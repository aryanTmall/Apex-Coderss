import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ContractorItem, PerformanceAssessmentItem } from '../api/types';
import {
  ShieldAlert,
  CheckCircle2,
  RotateCw,
  Scale,
  AlertCircle,
  Building2,
  Users
} from 'lucide-react';

export const ContractorsPage: React.FC = () => {
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [assessments, setAssessments] = useState<PerformanceAssessmentItem[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTransitionId, setActiveTransitionId] = useState<string | null>(null);
  const [transitionNotes, setTransitionNotes] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cList, aList] = await Promise.all([
        api.getContractors(),
        api.getContractorAssessments(
          selectedContractorId !== 'ALL' ? selectedContractorId : undefined,
          selectedStatus !== 'ALL' ? selectedStatus : undefined
        )
      ]);
      setContractors(cList);
      setAssessments(aList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contractor performance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedContractorId, selectedStatus]);

  const handleStatusTransition = async (assessmentId: string, nextStatus: string) => {
    try {
      setActionSuccess(null);
      setError(null);
      await api.transitionContractorAssessment(assessmentId, {
        status: nextStatus,
        official_decision_notes: transitionNotes || `Status updated to ${nextStatus} by Municipal Operator`
      });
      setActionSuccess(`Assessment ${assessmentId} successfully transitioned to ${nextStatus}.`);
      setActiveTransitionId(null);
      setTransitionNotes('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to transition assessment status');
    }
  };

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/50 flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                Contractual Accountability
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Government Operations
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Contractor Scorecards & Penalty Lifecycle
            </h1>
            <p className="text-slate-400 mt-1 max-w-3xl text-sm leading-relaxed">
              Enforce objective service level agreements (SLAs), review automated penalty calculations from failed closures, and process billing reconciliations.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start md:self-auto"
            title="Refresh Ledger"
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

        {/* Contractors Overview Cards */}
        <div className="my-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Empanelled Municipal Contractors & Trust Scores
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contractors.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedContractorId(c.id === selectedContractorId ? 'ALL' : c.id)}
                className={`p-5 rounded-xl border transition cursor-pointer shadow-lg flex flex-col justify-between ${
                  selectedContractorId === c.id
                    ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {c.id}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      c.trust_score >= 90 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      c.trust_score >= 75 ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      Trust: {c.trust_score}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {c.agency_type} • Lic: {c.license_no}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span>{c.contact_person}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Contracts:</span>
                      <span className="font-semibold text-white">{c.active_contracts_count}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Confirmed Penalties</span>
                    <span className="font-semibold text-rose-400">{formatINR(c.confirmed_penalties)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Incentive Bonuses</span>
                    <span className="font-semibold text-emerald-400">{formatINR(c.confirmed_bonuses)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessments & Penalty Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Performance Assessments & Penalties Workflow
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trail following legal lifecycle: DETECTED → EVIDENCE_REVIEW → CALCULATED → CONTRACTOR_NOTIFIED → OFFICIAL_APPROVAL → RECONCILED.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DETECTED">DETECTED</option>
                <option value="CONTRACTOR_NOTIFIED">CONTRACTOR_NOTIFIED</option>
                <option value="OFFICIAL_APPROVAL">OFFICIAL_APPROVAL</option>
                <option value="BILLING_ADJUSTMENT_PENDING">BILLING_ADJUSTMENT_PENDING</option>
                <option value="RECONCILED">RECONCILED</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {assessments.map((a) => (
              <div key={a.id} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                      {a.id}
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {a.contractor_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {a.clause_reference}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      a.assessment_type === 'PENALTY_RECOMMENDATION'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {a.assessment_type === 'PENALTY_RECOMMENDATION' ? 'PENALTY' : 'BONUS'}: {formatINR(a.final_amount || a.recommended_amount)}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {a.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 mb-3 leading-relaxed">
                  <span className="font-semibold text-slate-300">Auditable Evidence: </span>
                  {a.evidence_summary}
                </div>

                {a.contractor_response && (
                  <div className="text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 mb-3">
                    <span className="font-semibold text-slate-300">Contractor Representation: </span>
                    {a.contractor_response}
                  </div>
                )}

                {/* Transition Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="text-xs text-slate-500">
                    {a.breach_duration_hours > 0 && `Breach Duration: ${a.breach_duration_hours}h delay • `}
                    Created: {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent'}
                  </div>

                  <div className="flex items-center gap-2">
                    {a.status === 'DETECTED' && (
                      <button
                        onClick={() => handleStatusTransition(a.id, 'CONTRACTOR_NOTIFIED')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold"
                      >
                        Notify Contractor
                      </button>
                    )}
                    {a.status === 'CONTRACTOR_NOTIFIED' && (
                      <button
                        onClick={() => handleStatusTransition(a.id, 'OFFICIAL_APPROVAL')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-semibold"
                      >
                        Executive Approval
                      </button>
                    )}
                    {a.status === 'OFFICIAL_APPROVAL' && (
                      <button
                        onClick={() => handleStatusTransition(a.id, 'BILLING_ADJUSTMENT_PENDING')}
                        className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-semibold"
                      >
                        Forward to Finance
                      </button>
                    )}
                    {a.status === 'BILLING_ADJUSTMENT_PENDING' && (
                      <button
                        onClick={() => handleStatusTransition(a.id, 'RECONCILED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold"
                      >
                        Confirm Reconciliation
                      </button>
                    )}
                    {a.status === 'RECONCILED' && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Reconciled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
