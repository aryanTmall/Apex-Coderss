import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  ShieldAlert,
  Flame,
  Radio,
  ExternalLink,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { api } from '../api/client';

export const GovernmentFeedPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_ACTION');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getOperationalFeed({
        severity: severityFilter,
        event_type: typeFilter,
        status: statusFilter,
        limit: 100,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load operational feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [severityFilter, typeFilter, statusFilter]);

  const handleAcknowledge = async (alertId: string, status: string = 'ACKNOWLEDGED') => {
    setActionInProgress(alertId);
    try {
      await api.acknowledgeOperationalAlert(alertId, status, 'Acknowledged by operator on Tactical Feed');
      await fetchFeed();
    } catch (err: any) {
      alert('Failed to acknowledge alert: ' + (err.message || err));
    } finally {
      setActionInProgress(null);
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const pendingCount = alerts.filter(a => a.status === 'PENDING_ACTION').length;

  return (
    <div className="max-w-6xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-alert-red uppercase tracking-widest px-2 py-0.5 rounded-full bg-alert-red/10 border border-alert-red/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-red animate-pulse" />
              RESTRICTED // GOVERNMENT OPERATIONAL FEED
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
            Operational Intelligence & Tactical Event Alerts
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Real-time action stream generated from database state changes: SLA breaches, approaching deadlines, failed closures, contractor trust dips, and spatial clusters.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFeed}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-civic-blue ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* KPI Telemetry Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col">
          <span className="text-[10px] font-mono uppercase text-text-muted">Total Events</span>
          <span className="text-2xl font-mono font-bold text-white mt-1">{alerts.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-alert-red/30 flex flex-col">
          <span className="text-[10px] font-mono uppercase text-alert-red flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" /> Critical Breaches
          </span>
          <span className="text-2xl font-mono font-bold text-alert-red mt-1">{criticalCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-warning-yellow/30 flex flex-col">
          <span className="text-[10px] font-mono uppercase text-warning-yellow flex items-center gap-1">
            <Clock className="w-3 h-3" /> Approaching Deadlines
          </span>
          <span className="text-2xl font-mono font-bold text-warning-yellow mt-1">{highCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-verified-teal/30 flex flex-col">
          <span className="text-[10px] font-mono uppercase text-verified-teal flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Pending Action
          </span>
          <span className="text-2xl font-mono font-bold text-verified-teal mt-1">{pendingCount}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-surface-1 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] uppercase">Filters:</span>
          </div>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-surface-2 rounded-inner border border-white/10 text-xs text-text-primary focus:outline-none focus:border-civic-blue"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
          </select>

          {/* Event Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-surface-2 rounded-inner border border-white/10 text-xs text-text-primary focus:outline-none focus:border-civic-blue"
          >
            <option value="ALL">All Event Types</option>
            <option value="OVERDUE_SLA">Overdue SLA</option>
            <option value="SLA_APPROACHING">SLA Approaching</option>
            <option value="URGENT_UNASSIGNED">Urgent Unassigned</option>
            <option value="FAILED_CLOSURE">Failed Closure / Reopened</option>
            <option value="SPATIAL_HOTSPOT">Spatial Hotspots</option>
            <option value="CONTRACTOR_ANOMALY">Contractor Anomalies</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-surface-2 rounded-inner border border-white/10 text-xs text-text-primary focus:outline-none focus:border-civic-blue"
          >
            <option value="PENDING_ACTION">Pending Action</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All Statuses</option>
          </select>
        </div>

        <span className="text-[11px] font-mono text-text-muted">
          Showing {alerts.length} operational events
        </span>
      </div>

      {/* Alert Feed Stream */}
      {loading ? (
        <div className="p-12 text-center text-text-muted flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-civic-blue" />
          <span className="text-xs font-mono">Aggregating live operational signals from database...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center text-text-muted rounded-xl bg-surface-1 border border-white/5 flex flex-col items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-verified-teal" />
          <span className="text-sm font-semibold text-white">No Active Operational Alerts</span>
          <span className="text-xs">All SLAs are within tolerance, closures verified, and triage queues clear.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';
            const isPending = alert.status === 'PENDING_ACTION';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCritical
                    ? 'bg-alert-red/5 border-alert-red/30'
                    : isHigh
                    ? 'bg-warning-yellow/5 border-warning-yellow/30'
                    : 'bg-surface-1 border-white/10'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isCritical ? 'bg-alert-red/20 text-alert-red' : isHigh ? 'bg-warning-yellow/20 text-warning-yellow' : 'bg-civic-blue/20 text-civic-blue'
                  }`}>
                    {isCritical ? <AlertOctagon className="w-5 h-5" /> : isHigh ? <Clock className="w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isCritical ? 'bg-alert-red/20 text-alert-red' : isHigh ? 'bg-warning-yellow/20 text-warning-yellow' : 'bg-surface-2 text-text-muted'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-muted uppercase">
                        {alert.event_type.replace(/_/g, ' ')}
                      </span>
                      {alert.status === 'ACKNOWLEDGED' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-verified-teal/20 text-verified-teal">
                          ACKNOWLEDGED
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-text-muted/60">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-tight">
                      {alert.title}
                    </h4>

                    <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
                      {alert.explanation}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-text-muted">
                      {alert.tracking_id && <span>Tracking: {alert.tracking_id}</span>}
                      {alert.department_id && <span>Dept: {alert.department_id}</span>}
                      {alert.ward_id && <span>Ward: {alert.ward_id}</span>}
                      <span className="text-text-muted/50">Origin: {alert.data_origin}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isPending && (
                    <button
                      type="button"
                      disabled={actionInProgress === alert.id}
                      onClick={() => handleAcknowledge(alert.id, 'ACKNOWLEDGED')}
                      className="px-3 py-1.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-muted hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {alert.action_url && (
                    <Link
                      to={alert.action_url}
                      className="px-3 py-1.5 rounded-inner bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-civic-blue/20 transition-all"
                    >
                      <span>{alert.permitted_action.replace(/_/g, ' ')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
