import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Department } from '../api/types';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadDepartments = async () => {
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleToggle = async (dept: Department) => {
    setTogglingId(dept.id);
    try {
      await api.toggleDepartmentAvailability(dept.id, !dept.available);
      await loadDepartments();
    } catch (err: any) {
      alert('Failed to update department availability: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20">
              MUNICIPAL ROUTING INFRASTRUCTURE
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
            Departments & Fallback Grid
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Deterministic category mappings and contingency fallback routing. When an active department is marked offline, subsequent dispatches redirect to its configured fallback.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDepartments}
          className="flex items-center gap-1.5 h-8 px-3 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-verified-teal" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => {
          const isToggling = togglingId === dept.id;
          const fallbackDept = departments.find(d => d.id === dept.fallback_department_id);

          return (
            <div
              key={dept.id}
              className={`bg-surface-1 rounded-card card-border p-5 flex flex-col justify-between transition-all ${
                !dept.available ? 'border-alert-red/30 bg-alert-red/5' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-inner flex items-center justify-center ${
                      dept.available ? 'bg-civic-blue/20 text-civic-blue' : 'bg-alert-red/20 text-alert-red'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{dept.name}</h3>
                      <span className="text-[10px] font-mono text-text-muted">{dept.id}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                    dept.available
                      ? 'bg-verified-teal/15 text-verified-teal border border-verified-teal/30'
                      : 'bg-alert-red/20 text-alert-red border border-alert-red/40 animate-pulse'
                  }`}>
                    {dept.available ? 'ONLINE // READY' : 'OFFLINE // OUTAGE'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs font-mono pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block mb-1">Supported Vectors:</span>
                    <div className="flex flex-wrap gap-1">
                      {dept.supported_categories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded bg-surface-2 card-border text-[10px] text-text-primary">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-text-muted uppercase block">Configured Fallback Department:</span>
                    <span className="text-civic-blue font-semibold">
                      {fallbackDept ? fallbackDept.name : dept.fallback_department_id || 'None'}
                    </span>
                  </div>
                </div>

                {/* Contractor Integrity & Trust Score Bar */}
                <div className="mt-3 p-2.5 rounded-lg bg-surface-2/60 border border-white/5 flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-civic-blue" />
                      Contractor Trust Score:
                    </span>
                    <span className={`font-bold ${
                      (dept.trust_score ?? 100) >= 90 ? 'text-verified-teal' :
                      (dept.trust_score ?? 100) >= 75 ? 'text-sla-amber' : 'text-alert-red'
                    }`}>
                      {dept.trust_score ?? 100}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (dept.trust_score ?? 100) >= 90 ? 'bg-verified-teal' :
                        (dept.trust_score ?? 100) >= 75 ? 'bg-sla-amber' : 'bg-alert-red'
                      }`}
                      style={{ width: `${dept.trust_score ?? 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
                    <span>Geofence Spoofing Violations:</span>
                    <span className={`font-semibold ${(dept.spoofing_flags_count ?? 0) > 0 ? 'text-alert-red' : 'text-text-secondary'}`}>
                      {dept.spoofing_flags_count ?? 0} flags
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-muted">
                  Toggle for outage test:
                </span>
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => handleToggle(dept)}
                  className={`px-3 py-1 rounded-inner text-xs font-mono font-semibold transition-all ${
                    dept.available
                      ? 'bg-alert-red/20 hover:bg-alert-red text-alert-red hover:text-white border border-alert-red/40'
                      : 'bg-verified-teal/20 hover:bg-verified-teal text-verified-teal hover:text-night border border-verified-teal/40'
                  }`}
                >
                  {isToggling ? 'Updating...' : dept.available ? 'Simulate Outage' : 'Restore Online'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
