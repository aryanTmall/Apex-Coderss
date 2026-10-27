import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  Sliders,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api/client';
import { MunicipalProject, CommunityProposalItem } from '../api/types';

interface GovernmentProgramsPageProps {
  initialTab?: 'funds' | 'voting' | 'rewards';
}

export const GovernmentProgramsPage: React.FC<GovernmentProgramsPageProps> = ({
  initialTab = 'funds',
}) => {
  const [activeTab, setActiveTab] = useState<'funds' | 'voting' | 'rewards'>(initialTab);
  const [loading, setLoading] = useState(false);

  // Funds State
  const [projects, setProjects] = useState<MunicipalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<MunicipalProject | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<string>('IN_PROGRESS');
  const [updateNotes, setUpdateNotes] = useState<string>('');

  // Proposals State
  const [proposals, setProposals] = useState<CommunityProposalItem[]>([]);
  const [decisionModalProp, setDecisionModalProp] = useState<CommunityProposalItem | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<string>('APPROVED');
  const [decisionRationale, setDecisionRationale] = useState<string>('Approved based on high community vote support and budgetary feasibility.');

  // Rewards State
  const [redemptions, setRedemptions] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'funds') {
        const prjs = await api.getMunicipalProjects();
        setProjects(prjs);
      } else if (activeTab === 'voting') {
        const props = await api.getCommunityProposals();
        setProposals(props);
      } else if (activeTab === 'rewards') {
        const rdms = await api.getRewardsRedemptions();
        setRedemptions(rdms);
      }
    } catch (err) {
      console.error('Failed to load programs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    try {
      await api.updateMunicipalProject(selectedProject.id, {
        status: newStatus,
        completion_pct: newProgress,
        latest_update: updateNotes,
      });
      setSelectedProject(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to update project: ' + (err.message || err));
    }
  };

  const handleRecordDecision = async () => {
    if (!decisionModalProp) return;
    try {
      await api.recordProposalDecision(decisionModalProp.id, decisionStatus, decisionRationale);
      setDecisionModalProp(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to record decision: ' + (err.message || err));
    }
  };

  const handleUpdateRedemption = async (id: string, status: string) => {
    try {
      await api.updateRedemptionStatus(id, status);
      await loadData();
    } catch (err: any) {
      alert('Failed to update redemption: ' + (err.message || err));
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/40">
              GOVERNMENT CITIZEN PROGRAMS ADMINISTRATION
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
            Citizen Programs Management
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Authorized administration desk for Municipal Funds allocation, Participatory Budgeting proposal decisions, and Civic Rewards ledger oversight.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-1 border border-white/10 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('funds')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'funds' ? 'bg-civic-blue text-white font-bold shadow' : 'text-text-muted hover:text-white'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Funds</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voting')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'voting' ? 'bg-civic-blue text-white font-bold shadow' : 'text-text-muted hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Voting & Polls</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'rewards' ? 'bg-civic-blue text-white font-bold shadow' : 'text-text-muted hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rewards</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Municipal Funds Management */}
      {activeTab === 'funds' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Municipal Capital Projects</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Update execution progress percentages, approve physical milestone deliverables, and inspect contractor attributions.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-lg bg-surface-2 text-text-muted hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-surface-1 border border-white/10 hover:border-civic-blue/40 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-text-muted">{p.id}</span>
                    <span className={`px-2 py-0.5 rounded uppercase font-bold ${
                      p.status === 'COMPLETED' ? 'bg-verified-teal/20 text-verified-teal' : 'bg-civic-blue/20 text-civic-blue'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{p.title}</h4>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{p.description}</p>

                  <div className="mt-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-text-muted">Sanctioned: ₹{(p.sanctioned_amount / 100000).toFixed(1)}L</span>
                    <span className="text-text-primary">Progress: {p.progress_pct}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface-2 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-civic-blue h-1.5 rounded-full"
                      style={{ width: `${p.progress_pct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(p);
                    setNewProgress(p.progress_pct);
                    setNewStatus(p.status);
                    setUpdateNotes('');
                  }}
                  className="w-full py-2 rounded-lg bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-white text-center transition-all"
                >
                  Edit Progress & Milestones
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Ward Voting & Polls Moderation */}
      {activeTab === 'voting' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Community Proposals Moderation</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Review citizen proposals, inspect 1-vote ballot tallies, and record official municipal decisions.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-lg bg-surface-2 text-text-muted hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {proposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 rounded-xl bg-surface-1 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-text-muted">{prop.id}</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      prop.status === 'APPROVED' ? 'bg-verified-teal/20 text-verified-teal' :
                      prop.status === 'REJECTED' ? 'bg-alert-red/20 text-alert-red' :
                      'bg-warning-yellow/20 text-warning-yellow'
                    }`}>
                      {prop.status}
                    </span>
                    <span className="text-text-muted">Ward: {prop.ward_id}</span>
                    <span className="text-text-muted">Cost: ₹{(prop.estimated_cost / 100000).toFixed(1)}L</span>
                  </div>

                  <h4 className="text-sm font-semibold text-white">{prop.title}</h4>
                  <p className="text-xs text-text-muted">{prop.description}</p>
                  <span className="text-[11px] font-mono text-cyan-400 mt-1">
                    Total Verified Ballots: {prop.total_votes_count}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDecisionModalProp(prop);
                    setDecisionStatus(prop.status === 'VOTING' ? 'APPROVED' : prop.status);
                  }}
                  className="px-4 py-2 rounded-lg bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold shrink-0 shadow-md shadow-civic-blue/20 transition-all"
                >
                  Record Official Decision
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Civic Rewards Administration */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Voucher Redemptions & Fraud Audit</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Audit issued transit discount vouchers, inspect redemption timestamps, and flag suspicious redemption activity.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-lg bg-surface-2 text-text-muted hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-text-muted font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3">Voucher Code</th>
                  <th className="p-3">Citizen</th>
                  <th className="p-3">Reward Item</th>
                  <th className="p-3">Credits</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Issued At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-surface-1">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="p-3 font-mono font-bold text-white">{r.voucher_code}</td>
                    <td className="p-3 text-text-muted font-mono">{r.display_name}</td>
                    <td className="p-3 text-text-primary">{r.catalog_title}</td>
                    <td className="p-3 font-mono text-warning-yellow">{r.credits_spent} CR</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        r.status === 'FULFILLED' ? 'bg-verified-teal/20 text-verified-teal' :
                        r.status === 'FRAUD_FLAGGED' ? 'bg-alert-red/20 text-alert-red' :
                        'bg-surface-2 text-text-muted'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted font-mono text-[10px]">
                      {r.issued_at ? new Date(r.issued_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {r.status !== 'FULFILLED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRedemption(r.id, 'FULFILLED')}
                          className="px-2 py-1 rounded bg-verified-teal/20 text-verified-teal hover:bg-verified-teal/30 font-mono text-[10px]"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                      {r.status !== 'FRAUD_FLAGGED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRedemption(r.id, 'FRAUD_FLAGGED')}
                          className="px-2 py-1 rounded bg-alert-red/20 text-alert-red hover:bg-alert-red/30 font-mono text-[10px]"
                        >
                          Flag Fraud
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Edit Municipal Project Progress */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-1 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-semibold text-white">Update Municipal Project Progress</h3>
            <p className="text-xs text-text-muted">{selectedProject.title} ({selectedProject.id})</p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-text-muted">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 bg-surface-2 rounded-lg border border-white/10 text-xs text-white"
              >
                <option value="PLANNED">PLANNED</option>
                <option value="TENDER_AWARDED">TENDER_AWARDED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DELAYED">DELAYED</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-text-muted">Completion Percentage</span>
                <span className="text-civic-blue font-bold">{newProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value, 10))}
                className="w-full accent-civic-blue"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-text-muted">Latest Update Notes</label>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                rows={3}
                placeholder="Official site inspection remarks..."
                className="w-full p-2.5 bg-surface-2 rounded-lg border border-white/10 text-xs text-white placeholder:text-text-muted"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-mono text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProject}
                className="px-4 py-2 rounded-lg bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Decision for Proposal */}
      {decisionModalProp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-1 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-semibold text-white">Record Official Proposal Decision</h3>
            <p className="text-xs text-text-muted">{decisionModalProp.title} ({decisionModalProp.id})</p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-text-muted">Official Decision</label>
              <select
                value={decisionStatus}
                onChange={(e) => setDecisionStatus(e.target.value)}
                className="w-full p-2.5 bg-surface-2 rounded-lg border border-white/10 text-xs text-white"
              >
                <option value="APPROVED">APPROVED (Fund Sanctioned)</option>
                <option value="REJECTED">REJECTED (Infeasible / Out of Scope)</option>
                <option value="DEFERRED">DEFERRED (Pending Ward Review)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-text-muted">Decision Rationale & Auditor Notes</label>
              <textarea
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                rows={3}
                placeholder="Enter justification for municipal record..."
                className="w-full p-2.5 bg-surface-2 rounded-lg border border-white/10 text-xs text-white placeholder:text-text-muted"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModalProp(null)}
                className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-xs font-mono text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordDecision}
                className="px-4 py-2 rounded-lg bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold"
              >
                Commit Official Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
