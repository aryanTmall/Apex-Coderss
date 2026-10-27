import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MunicipalFundsSummary, WardBudgetItem, MunicipalProject } from '../api/types';
import { 
  Landmark, 
  Banknote, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  Download,
  RotateCw,
  Search,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export const MunicipalFundsPage: React.FC = () => {
  const [summary, setSummary] = useState<MunicipalFundsSummary | null>(null);
  const [wards, setWards] = useState<WardBudgetItem[]>([]);
  const [projects, setProjects] = useState<MunicipalProject[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<MunicipalProject | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, wardData, projData] = await Promise.all([
        api.getFundsSummary('FY 2025-26'),
        api.getWardBudgets('FY 2025-26'),
        api.getMunicipalProjects(selectedWardId !== 'ALL' ? selectedWardId : undefined)
      ]);
      setSummary(sumData);
      setWards(wardData);
      setProjects(projData);
    } catch (err: any) {
      setError(err.message || 'Failed to load municipal expenditure data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWardId]);

  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const exportCSV = () => {
    if (!wards.length) return;
    const headers = ['Ward Number', 'Ward Name', 'Zone', 'Approved Budget', 'Expenditure Recorded', 'Remaining Balance', 'Utilization %'];
    const rows = wards.map(w => [
      w.ward_number,
      `"${w.ward_name}"`,
      w.zone,
      w.approved_budget,
      w.expenditure_recorded,
      w.remaining_balance,
      `${w.utilization_pct}%`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicHelp_Ward_Funds_FY2025-26.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                Fiscal Transparency Portal
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40">
                Simulated Demonstration Model
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Municipal Fund Tracker & Public Expenditure
            </h1>
            <p className="text-slate-400 mt-1 max-w-3xl text-sm leading-relaxed">
              Track ward-by-ward municipal expenditure, contractor project allocations, and verified public works milestones across New Delhi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export CSV
            </button>
            <button
              onClick={fetchData}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="my-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Public Audit Guarantee: </span>
            All expenditure figures reflect sanctioned municipal budget heads for FY 2025-26. Field disbursement audits are linked directly to incident closure proof and contractor scorecards.
          </div>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                <span>Total Approved Budget</span>
                <Banknote className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {formatINR(summary.total_approved_budget)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                FY 2025-26 Municipal Outlay
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                <span>Expenditure Recorded</span>
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {formatINR(summary.total_expenditure_recorded)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {formatINR(summary.remaining_approved_balance)} Remaining
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                <span>Overall Utilization</span>
                <span className="text-xs font-bold text-cyan-400">{summary.overall_utilization_pct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.overall_utilization_pct > 80 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, summary.overall_utilization_pct)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">
                Target fiscal pace: On schedule
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                <span>Public Works Projects</span>
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {summary.total_projects} <span className="text-sm font-normal text-slate-400">Total</span>
              </div>
              <div className="text-xs text-slate-400 mt-2 flex gap-3">
                <span className="text-emerald-400">{summary.completed_projects} Done</span>
                <span className="text-cyan-400">{summary.in_progress_projects} Active</span>
                {summary.delayed_projects > 0 && (
                  <span className="text-rose-400">{summary.delayed_projects} Delayed</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ward Breakdown Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Ward-Wise Budget Allocation & Expenditure</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare municipal allocation versus actual recorded expenditure by administrative ward.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Municipal Wards (5)</option>
                {wards.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>
                    Ward {w.ward_number} - {w.ward_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Ward</th>
                  <th className="py-3.5 px-4 font-semibold">Zone</th>
                  <th className="py-3.5 px-4 font-semibold">Councillor</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Approved Outlay</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actual Spend</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Utilization</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {wards.map((w) => (
                  <tr 
                    key={w.ward_id} 
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => setSelectedWardId(w.ward_id)}
                  >
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 flex items-center justify-center text-xs font-bold shrink-0">
                        {w.ward_number}
                      </span>
                      <div>
                        <div>{w.ward_name}</div>
                        <div className="text-xs text-slate-500 font-normal">Pop: {w.population.toLocaleString('en-IN')}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{w.zone}</td>
                    <td className="py-4 px-4 text-slate-300">{w.councillor_name}</td>
                    <td className="py-4 px-4 text-right font-medium text-slate-200">
                      {formatINR(w.approved_budget)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-emerald-400">
                      {formatINR(w.expenditure_recorded)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-full rounded-full" 
                            style={{ width: `${Math.min(100, w.utilization_pct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 w-10 text-right">
                          {w.utilization_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                        {w.active_projects_count} active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Public Works Projects Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                Capital Projects & Works Contracts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Specific work orders with verifiable contractor disclosure and physical milestone tracking.
              </p>
            </div>
            {selectedWardId !== 'ALL' && (
              <button
                onClick={() => setSelectedWardId('ALL')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Clear Ward Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div 
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition cursor-pointer shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                      {p.id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      p.status === 'DELAYED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {p.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contractor:</span>
                      <span className="font-medium text-slate-200">{p.contractor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned:</span>
                      <span className="font-semibold text-emerald-400">{formatINR(p.sanctioned_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expenditure to Date:</span>
                      <span>{formatINR(p.expenditure_to_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Physical Progress</span>
                    <span className="font-bold text-cyan-400">{p.progress_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${p.progress_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#111827] border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      {selectedProject.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Tender: {selectedProject.tender_reference}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedProject.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <div className="my-4 space-y-4 text-sm text-slate-300">
                <p className="text-slate-400 text-xs leading-relaxed">
                  {selectedProject.description}
                </p>

                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 block">Empanelled Contractor</span>
                    <span className="font-semibold text-white">{selectedProject.contractor_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Sanctioned Budget</span>
                    <span className="font-bold text-emerald-400">{formatINR(selectedProject.sanctioned_amount)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Start Date</span>
                    <span>{selectedProject.start_date}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Target Completion</span>
                    <span>{selectedProject.expected_completion_date}</span>
                  </div>
                </div>

                {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Verifiable Milestones & Deliverables
                    </h4>
                    <div className="space-y-2">
                      {selectedProject.milestones.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              m.status === 'COMPLETED' ? 'bg-emerald-400' :
                              m.status === 'IN_PROGRESS' ? 'bg-cyan-400' : 'bg-slate-600'
                            }`} />
                            <span className="font-medium text-slate-200">{m.milestone}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">{m.date}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' :
                              m.status === 'IN_PROGRESS' ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
