import React, { useState } from 'react';
import { api } from '../api/client';
import { WhistleblowerTrackResult } from '../api/types';
import {
  ShieldCheck,
  Lock,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';

export const WhistleblowerReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'TRACK'>('SUBMIT');

  // Submit form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SUBSTANDARD_WORKS');
  const [narrative, setNarrative] = useState('');
  const [wardId, setWardId] = useState('WARD-DEL-044');
  const [suspectOrg, setSuspectOrg] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [contactHandle, setContactHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCase, setIssuedCase] = useState<{ case_id: string; case_token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Track inquiry state
  const [queryToken, setQueryToken] = useState('');
  const [trackResult, setTrackResult] = useState<WhistleblowerTrackResult | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.submitWhistleblowerReport({
        title,
        allegation_category: category,
        narrative,
        ward_id: wardId || undefined,
        suspect_organization: suspectOrg || undefined,
        is_anonymous: isAnonymous,
        contact_channel: !isAnonymous ? contactHandle : undefined
      });
      setIssuedCase(res.data);
      // Reset form
      setTitle('');
      setNarrative('');
      setSuspectOrg('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit confidential report');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryToken.trim()) return;
    try {
      setTrackLoading(true);
      setTrackError(null);
      const res = await api.trackWhistleblowerReport(queryToken.trim());
      setTrackResult(res.data);
    } catch (err: any) {
      setTrackError(err.message || 'No confidential case found matching this cryptographic token.');
    } finally {
      setTrackLoading(false);
    }
  };

  const copyToken = () => {
    if (issuedCase) {
      navigator.clipboard.writeText(issuedCase.case_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center pb-8 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/50 text-xs font-semibold uppercase tracking-wider mb-3">
            <Lock className="w-4 h-4" />
            Confidential Integrity Channel
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Municipal Anti-Corruption & Whistleblower Portal
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
            Report procurement fraud, substandard infrastructure works, illegal construction, or official misconduct with cryptographic anonymity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center my-6">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setActiveTab('SUBMIT')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'SUBMIT'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              File Confidential Report
            </button>
            <button
              onClick={() => setActiveTab('TRACK')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'TRACK'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              Track by Secret Token
            </button>
          </div>
        </div>

        {/* SUBMIT TAB */}
        {activeTab === 'SUBMIT' && (
          <div>
            {issuedCase ? (
              <div className="my-6 p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/50 shadow-2xl animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Confidential Report Registered
                </div>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  Your allegation dossier has been encrypted and assigned to the independent anti-corruption review cell. No IP addresses, device identifiers, or phone numbers were logged.
                </p>

                <div className="p-4 bg-black/60 rounded-xl border border-slate-700 mb-6 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Case Reference:</span>
                    <span className="font-mono text-cyan-400 font-bold">{issuedCase.case_id}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs text-amber-400 font-semibold block mb-1">
                      Cryptographic Case Token (Required for Inquiries):
                    </span>
                    <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-mono text-xs text-slate-200 break-all">
                        {issuedCase.case_token}
                      </span>
                      <button
                        onClick={copyToken}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5"
                      >
                        <Copy className="w-4 h-4 text-cyan-400" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 leading-relaxed mb-6">
                  <span className="font-bold">CRITICAL SECURITY WARNING: </span>
                  CivicHelp does NOT store your email or identity. If you lose this token, you will NEVER be able to track this report again. Please copy and store it in a secure password manager.
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setQueryToken(issuedCase.case_token);
                      setActiveTab('TRACK');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg"
                  >
                    View Status with this Token
                  </button>
                  <button
                    onClick={() => setIssuedCase(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl space-y-5">
                {error && (
                  <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Allegation Subject / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Substandard bitumen thickness on arterial road resurfacing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Allegation Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500"
                    >
                      <option value="SUBSTANDARD_WORKS">Substandard Infrastructure Works</option>
                      <option value="PROCUREMENT_FRAUD">Procurement / Tender Fraud</option>
                      <option value="ILLEGAL_CONSTRUCTION">Illegal Encroachment / Unsanctioned Build</option>
                      <option value="BRIBERY_CORRUPTION">Bribery & Official Misconduct</option>
                      <option value="INSPECTION_TAMPERING">Inspection Tampering & Falsification</option>
                      <option value="OTHER">Other Serious Violation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Administrative Ward (Optional)
                    </label>
                    <select
                      value={wardId}
                      onChange={(e) => setWardId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-rose-500"
                    >
                      <option value="">Unspecified Ward</option>
                      <option value="WARD-DEL-044">Ward 44 - Hauz Khas / Ring Road</option>
                      <option value="WARD-DEL-043">Ward 43 - Malviya Nagar / Drainage</option>
                      <option value="WARD-DEL-042">Ward 42 - Greater Kailash / Waste</option>
                      <option value="WARD-DEL-045">Ward 45 - Saket Urban Enclave</option>
                      <option value="WARD-DEL-046">Ward 46 - Mehrauli Heritage Corridor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Suspect Contractor / Agency / Official (Optional)
                  </label>
                  <input
                    type="text"
                    value={suspectOrg}
                    onChange={(e) => setSuspectOrg(e.target.value)}
                    placeholder="e.g. Apex Road Infrastructure Ltd or Division Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Detailed Factual Narrative * (Dates, Locations, Specifications)
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Describe the irregularities objectively. Include contract numbers, exact chainages, materials observed, and witnesses..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-rose-500 leading-relaxed"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anonCheck"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="anonCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Submit 100% Anonymously (Do not record any contact handle)
                    </label>
                  </div>
                </div>

                {!isAnonymous && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Encrypted / Pseudonymous Handle (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactHandle}
                      onChange={(e) => setContactHandle(e.target.value)}
                      placeholder="e.g. ProtonMail handle or Signal username"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  {loading ? 'Encrypting & Transmitting...' : 'Submit Confidential Report'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TRACK TAB */}
        {activeTab === 'TRACK' && (
          <div className="space-y-6">
            <form onSubmit={handleTrack} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Enter Cryptographic Secret Token
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  value={queryToken}
                  onChange={(e) => setQueryToken(e.target.value)}
                  placeholder="Paste your 48-character secret case token here"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0"
                >
                  <Key className="w-4 h-4" />
                  {trackLoading ? 'Querying...' : 'Track Case'}
                </button>
              </div>
            </form>

            {trackError && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {trackResult && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/40">
                      {trackResult.case_id}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">
                      {trackResult.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      Status: {trackResult.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {trackResult.verification_label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400 pt-2">
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <span className="font-medium text-slate-200">{trackResult.allegation_category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ward</span>
                    <span className="font-medium text-slate-200">{trackResult.ward_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submitted On</span>
                    <span className="font-medium text-slate-200">{new Date(trackResult.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Evidence Files</span>
                    <span className="font-medium text-slate-200">{trackResult.attachments_count} files</span>
                  </div>
                </div>

                {trackResult.investigation_outcome ? (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="font-semibold text-emerald-400 block mb-1">
                      Official Anti-Corruption Audit Outcome:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {trackResult.investigation_outcome}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Info className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>Dossier is undergoing active verification by the municipal inquiry team. Re-check this token periodically for updates.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
