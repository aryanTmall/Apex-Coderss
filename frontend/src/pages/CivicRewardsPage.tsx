import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { RewardAccountItem, RewardCatalogItem, LeaderboardRankItem } from '../api/types';
import {
  Sparkles,
  Ticket,
  Trophy,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const CivicRewardsPage: React.FC = () => {
  const [account, setAccount] = useState<RewardAccountItem | null>(null);
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRankItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<any | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const citizenId = 'CIT-HASH-992144A'; // Demo citizen identity

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accData, catData, leadData] = await Promise.all([
        api.getRewardAccount(citizenId),
        api.getRewardsCatalog(),
        api.getRewardsLeaderboard()
      ]);
      setAccount(accData);
      setCatalog(catData);
      setLeaderboard(leadData);
    } catch (err: any) {
      setError(err.message || 'Failed to load civic rewards profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = async (catalogItemId: string) => {
    try {
      setRedeemingId(catalogItemId);
      setError(null);
      setRedeemSuccess(null);
      const res = await api.redeemRewardVoucher(citizenId, catalogItemId);
      setRedeemSuccess(res);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to redeem voucher');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/50 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Civic Action Incentives
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Sandbox Demo Benefits
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Civic Credits & Community Participation Rewards
            </h1>
            <p className="text-slate-400 mt-1 max-w-3xl text-sm leading-relaxed">
              Earn verified credits by reporting civic issues, confirming on-site resolutions, and participating in ward consultations.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start md:self-auto"
            title="Refresh Account"
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

        {/* Voucher Success Modal/Banner */}
        {redeemSuccess && (
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 border border-emerald-500/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5" />
                Voucher Issued Successfully!
              </div>
              <div className="text-xs text-slate-300">
                {redeemSuccess.partner_name} • Valid for 30 days
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/50 p-3 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-slate-400">Voucher Code:</span>
              <span className="font-mono text-base font-extrabold text-white tracking-widest bg-emerald-950 px-3 py-1 rounded border border-emerald-700">
                {redeemSuccess.voucher_code}
              </span>
            </div>
          </div>
        )}

        {/* Account Profile Card */}
        {account && (
          <div className="my-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Available Credit Balance
              </span>
              <div className="text-4xl font-extrabold text-amber-400 tracking-tight">
                {account.current_balance} <span className="text-lg font-normal text-slate-400">Credits</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Lifetime Earned: {account.total_earned_credits} Credits
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Citizen Tier & Badge
              </span>
              <div className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-7 h-7 text-cyan-400" />
                {account.total_earned_credits >= 500 ? 'Civic Platinum Sentinel' : 'Civic Gold Contributor'}
              </div>
              <div className="text-xs text-cyan-400 mt-2">
                Public Handle: {account.display_name}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Participation Policy
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  • +50 pts: Verified Issue Resolution<br />
                  • +30 pts: Confirmation Survey<br />
                  • +10 pts: Participatory Budget Vote
                </p>
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Anti-Abuse Cap: 250 points / 24-hour window
              </div>
            </div>
          </div>
        )}

        {/* Redemption Catalogue */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                Municipal Benefit & Transit Catalogue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Redeem earned points for digital discount passes, parking waivers, and green nursery adoption certificates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {catalog.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-amber-400">
                      {item.credits_cost} pts
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {item.description}
                  </p>

                  <div className="text-[11px] text-slate-500 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mb-4">
                    {item.partner_name}
                  </div>
                </div>

                <button
                  disabled={!account || account.current_balance < item.credits_cost || redeemingId === item.id}
                  onClick={() => handleRedeem(item.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20"
                >
                  <Ticket className="w-4 h-4" />
                  {redeemingId === item.id ? 'Issuing Voucher...' : 'Redeem for Voucher'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard & Ledger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Public Leaderboard */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              Civic Champions Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.map((lead) => (
                <div
                  key={lead.rank}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      lead.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' :
                      lead.rank === 2 ? 'bg-slate-300 text-slate-950' :
                      lead.rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {lead.rank}
                    </span>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {lead.display_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {lead.ward_name} ({lead.badge_tier})
                      </div>
                    </div>
                  </div>

                  <span className="font-bold text-amber-400 text-sm">
                    {lead.total_earned_credits} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Append-only Ledger */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-cyan-400" />
              Auditable Transaction Ledger
            </h2>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {account?.ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">
                      {entry.description}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {entry.activity_type} • {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                    entry.transaction_type === 'EARN'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                  }`}>
                    {entry.transaction_type === 'EARN' ? `+${entry.credits}` : `-${entry.credits}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
