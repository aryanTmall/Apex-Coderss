import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CommunityProposalItem } from '../api/types';
import {
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Plus,
  MessageSquare,
  Banknote,
  ShieldCheck
} from 'lucide-react';

export const ParticipatoryBudgetingPage: React.FC = () => {
  const [proposals, setProposals] = useState<CommunityProposalItem[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form states for new proposal
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formWardId, setFormWardId] = useState('WARD-DEL-044');
  const [formCategory, setFormCategory] = useState('SOLAR_LIGHTING');
  const [formCost, setFormCost] = useState('1500000');
  const [formBenefit, setFormBenefit] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');

  const getParticipantToken = () => {
    let token = localStorage.getItem('civic_participant_token');
    if (!token) {
      token = 'ptok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('civic_participant_token', token);
    }
    return token;
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProposals(selectedWardId !== 'ALL' ? selectedWardId : undefined);
      setProposals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load community proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [selectedWardId]);

  const handleVote = async (proposalId: string, optionId: string) => {
    try {
      setVotingId(optionId);
      setError(null);
      setVoteSuccess(null);
      const participant = getParticipantToken();
      await api.castProposalVote(proposalId, optionId, participant);
      setVoteSuccess('Your vote has been verified and recorded on the civic ledger!');
      await fetchProposals();
    } catch (err: any) {
      if (err.message && err.message.includes('already cast')) {
        setError('Duplicate vote prevented: You have already voted on this proposal.');
      } else {
        setError(err.message || 'Failed to record vote');
      }
    } finally {
      setVotingId(null);
    }
  };

  const formatINR = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                Direct Democracy
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                1-Vote Ballot Integrity
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Participatory Budgeting & Ward Consultations
            </h1>
            <p className="text-slate-400 mt-1 max-w-3xl text-sm leading-relaxed">
              Decide how municipal innovation funds are spent. Cast authenticated ballots on civic improvements in your ward.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-cyan-900/30"
            >
              <Plus className="w-4 h-4" />
              Propose Initiative
            </button>
            <button
              onClick={fetchProposals}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Proposals"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="my-4 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {voteSuccess && (
          <div className="my-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{voteSuccess}</span>
          </div>
        )}

        {/* Proposals List */}
        <div className="my-8 space-y-6">
          {proposals.map((p) => (
            <div key={p.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/40">
                      {p.id}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Ward {p.ward_number} ({p.ward_name})
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      {p.category.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      p.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      p.status === 'UNDER_CONSIDERATION' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">
                    {p.title}
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-4xl">
                    {p.description}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl shrink-0 min-w-[200px] text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Estimated Outlay
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatINR(p.estimated_cost)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {p.total_votes_count} verified ballots cast
                  </div>
                </div>
              </div>

              {/* Voting Options */}
              <div className="mt-6 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Design Option:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {p.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-semibold text-white text-sm">
                            {opt.title}
                          </h3>
                          <span className="text-xs font-bold text-cyan-400 shrink-0">
                            {opt.votes_count} votes ({opt.vote_pct}%)
                          </span>
                        </div>
                        {opt.description && (
                          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                            {opt.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${opt.vote_pct || 0}%` }}
                          />
                        </div>

                        <button
                          disabled={p.status !== 'VOTING' && p.status !== 'UNDER_CONSIDERATION'}
                          onClick={() => handleVote(p.id, opt.id)}
                          className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-cyan-600 disabled:opacity-50 disabled:hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {votingId === opt.id ? 'Recording...' : 'Vote for this Option'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Decision Note if present */}
              {p.official_decision_rationale && (
                <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-400">Official Municipal Action: </span>
                    <span className="text-slate-300">{p.official_decision_rationale}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
