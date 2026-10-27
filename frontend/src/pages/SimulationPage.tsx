import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Flame,
  XCircle,
  Clock,
  Building2,
  Trash2,
  CheckCircle2,
  Play,
  RotateCcw,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SimulationPage: React.FC = () => {
  const [advanceMinutes, setAdvanceMinutes] = useState<number>(60);
  const [outageDeptId, setOutageDeptId] = useState<string>('dept_roads');
  const [outageAvailable, setOutageAvailable] = useState<boolean>(false);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; title: string; payload: any; status: 'success' | 'error' }>>([]);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const addLog = (title: string, payload: any, status: 'success' | 'error' = 'success') => {
    setLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        title,
        payload,
        status,
      },
      ...prev,
    ]);
  };

  // Scenario A: Seed Demo Data
  const handleSeedDemoData = async () => {
    setIsRunning(true);
    try {
      const res = await api.seedDemoData();
      addLog('Seed Demo Data Completed', res);
    } catch (err: any) {
      addLog('Seed Demo Data Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Scenario 450: Full City Synthetic Dataset (450 Incidents across 14 categories)
  const handleSeed450 = async (count: number = 450) => {
    setIsRunning(true);
    try {
      const res = await api.seedDemo450(count, 42);
      addLog(`Full City Simulation Seeded: ${res.incidents_seeded} incidents, ${res.reports_seeded} reports across ${res.categories_covered} categories`, res);
    } catch (err: any) {
      addLog('Seed 450 Records Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Scenario B: Seed Pothole
  const handleSeedPothole = async () => {
    setIsRunning(true);
    try {
      const res = await api.seedPotholeScenario();
      addLog('Seed Pothole Scenario Completed (1 Canonical + 2 Linked Duplicates)', res);
    } catch (err: any) {
      addLog('Seed Pothole Scenario Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Scenario C: Bad Closure (Critical Hackathon Feature)
  const handleBadClosure = async () => {
    setIsRunning(true);
    try {
      const res = await api.badClosure();
      addLog('Bad Closure Test Submitted (Coordinates ~300m away -> REOPENED)', res);
    } catch (err: any) {
      addLog('Bad Closure Execution Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Scenario D: Advance Time
  const handleAdvanceTime = async (mins: number) => {
    setIsRunning(true);
    try {
      const res = await api.advanceTime(mins);
      addLog(`Simulation Clock Advanced by ${mins}m (SLA Monitor Evaluated)`, res);
    } catch (err: any) {
      addLog('Advance Time Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Scenario E: Department Outage
  const handleDepartmentOutage = async () => {
    setIsRunning(true);
    try {
      const res = await api.setDepartmentOutage(outageDeptId, outageAvailable);
      addLog(`Department Outage Toggled (${outageDeptId} Available=${outageAvailable})`, res);
    } catch (err: any) {
      addLog('Department Outage Toggle Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // Scenario F: Reset Demo
  const handleResetConfirmed = async () => {
    setShowResetConfirm(false);
    setIsRunning(true);
    try {
      const res = await api.resetSimulation(true);
      addLog('Simulation Data Reset Completed', res);
    } catch (err: any) {
      addLog('Reset Failed', { error: err.message }, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-sla-amber uppercase tracking-widest px-2 py-0.5 rounded-full bg-sla-amber/10 border border-sla-amber/20">
              SIMULATION & SAFEGUARDS TEST DECK
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-text-primary tracking-tight">
            Simulation Control Console
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Deterministic scenario generators invoking real report intake, state machine transitions, geofence verification, and SLA escalations.
          </p>
        </div>

        {/* Global Reset */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-inner bg-alert-red/20 hover:bg-alert-red text-alert-red hover:text-white border border-alert-red/30 text-xs font-mono font-bold transition-all self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Demo Dataset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Scenario Cards */}
        <div className="flex flex-col gap-4">
          {/* Card 450: Full City Synthetic Dataset */}
          <div className="bg-gradient-to-br from-surface-1 to-verified-teal/5 rounded-card card-border p-5 border-verified-teal/30 shadow-lg flex flex-col justify-between hover:border-verified-teal/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-verified-teal">MASTER DATASET // SMART CITIES SCALE</span>
                <span className="text-[10px] font-mono text-verified-teal px-2 py-0.5 rounded bg-verified-teal/10 border border-verified-teal/20">
                  450 INCIDENTS // 14 CATEGORIES
                </span>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Seed 450 Comprehensive Demo Records
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Populates 450 realistic civic incidents across Delhi NCR (Connaught Place, Karol Bagh, Nehru Place, Dwarka, Rohini) with 40 linked duplicates, geofence breaches, and multi-tier escalations. Idempotent and isolated to demo dataset.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSeed450(450)}
                disabled={isRunning}
                className="flex-1 h-9 px-4 rounded-inner bg-verified-teal hover:bg-teal-400 text-night font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-night" />
                <span>Seed 450 Records (Default)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSeed450(500)}
                disabled={isRunning}
                className="h-9 px-3 rounded-inner bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-white card-border text-xs font-mono transition-all disabled:opacity-50"
                title="Seed maximum 500 records"
              >
                500 Max
              </button>
            </div>
          </div>

          {/* Card A: Seed Demo Data */}
          <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col justify-between hover:bg-surface-2/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-civic-blue">SCENARIO A // BASELINE DATASET</span>
                <span className="text-[10px] font-mono text-text-muted">8 INCIDENTS</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Seed Multi-Lifecycle Demo Incidents
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Generates 8 realistic synthetic civic cases across diverse statuses (New, Assigned, In Progress, Overdue, Escalated, Resolved, Recurring).
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={isRunning}
              className="h-9 px-4 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-civic-blue fill-civic-blue" />
              <span>Seed Baseline Data</span>
            </button>
          </div>

          {/* Card B: Seed Multi-Report Pothole */}
          <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col justify-between hover:bg-surface-2/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-agent-violet">SCENARIO B // DEDUPLICATION</span>
                <span className="text-[10px] font-mono text-text-muted">HAVERSINE 40M</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Multi-Citizen Pothole Deduplication
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Submits 3 citizen reports within 40m through the real report intake pipeline. The 1st creates the canonical case; the 2nd & 3rd autonomously score ≥0.75 and merge.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedPothole}
              disabled={isRunning}
              className="h-9 px-4 rounded-inner bg-agent-violet/20 hover:bg-agent-violet text-agent-violet hover:text-white border border-agent-violet/30 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Execute Pothole Deduplication Scenario</span>
            </button>
          </div>

          {/* Card C: Bad Closure (Signature Feature) */}
          <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col justify-between border-alert-red/30 bg-alert-red/5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-alert-red">SCENARIO C // SIGNATURE DIFFERENTIATOR</span>
                <span className="text-[10px] font-mono text-alert-red">AUTONOMOUS RECOVERY</span>
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">
                Submit Invalid Closure & Autonomous Recovery
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Submits closure claim with valid text keywords but coordinates ~300m away. The geofence check fails, verification is rejected, and the state machine autonomously reopens the case, bumps priority (+1), and recalculates SLA!
              </p>
            </div>
            <button
              type="button"
              onClick={handleBadClosure}
              disabled={isRunning}
              className="h-10 px-4 rounded-inner bg-alert-red hover:bg-rose-600 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-alert-red/20 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Trigger Bad Closure & Observe Reopening</span>
            </button>
          </div>

          {/* Card D: Advance Simulation Time */}
          <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-verified-teal">SCENARIO D // SLA TEMPORAL MONITOR</span>
              <span className="text-[10px] font-mono text-text-muted">SimClock</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              Advance Simulation Time & SLA Escalation
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Fast-forwards SimClock to test SLA monitor breach detection and autonomous state transition to ESCALATED.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[30, 60, 120, 360].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleAdvanceTime(m)}
                  disabled={isRunning}
                  className="px-3 py-1.5 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary transition-all disabled:opacity-50"
                >
                  +{m}m
                </button>
              ))}
            </div>
          </div>

          {/* Card E: Department Outage */}
          <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sla-amber">SCENARIO E // CONTINGENCY ROUTING</span>
              <span className="text-[10px] font-mono text-text-muted">FALLBACK MESH</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              Department Outage & Contingency Rerouting
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Marks a department offline and exercises autonomous reassignment of active open cases to its configured fallback department.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <select
                value={outageDeptId}
                onChange={(e) => setOutageDeptId(e.target.value)}
                className="bg-night text-text-primary text-xs font-mono h-9 px-2.5 rounded-inner card-border outline-none flex-1"
              >
                <option value="dept_roads">Roads & PWD (Fallback: Sanitation)</option>
                <option value="dept_water">Water Supply (Fallback: Drainage)</option>
                <option value="dept_sanitation">Sanitation (Fallback: Roads)</option>
                <option value="dept_streetlights">Streetlights (Fallback: Roads)</option>
                <option value="dept_drainage">Drainage (Fallback: Water)</option>
              </select>

              <select
                value={outageAvailable ? 'true' : 'false'}
                onChange={(e) => setOutageAvailable(e.target.value === 'true')}
                className="bg-night text-text-primary text-xs font-mono h-9 px-2.5 rounded-inner card-border outline-none"
              >
                <option value="false">Mark Offline</option>
                <option value="true">Restore Online</option>
              </select>

              <button
                type="button"
                onClick={handleDepartmentOutage}
                disabled={isRunning}
                className="h-9 px-4 rounded-inner bg-surface-2 hover:bg-surface-3 card-border text-xs font-mono text-text-primary whitespace-nowrap transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output Console */}
        <div className="bg-surface-1 rounded-card card-border p-5 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-verified-teal" />
              <span className="text-xs font-mono text-text-primary uppercase font-semibold">
                Execution Output & Telemetry Log
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-[10px] font-mono text-text-muted hover:text-text-primary"
            >
              Clear Logs
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[720px] pr-1 flex flex-col gap-3 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="py-16 text-center text-text-muted">
                Execute a scenario on the left to inspect real API response payloads and state changes.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-inner border ${
                    log.status === 'success' ? 'bg-night/80 border-verified-teal/30' : 'bg-alert-red/10 border-alert-red/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-text-muted">
                    <span className="font-bold text-text-primary">{log.title}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <pre className="text-[11px] overflow-x-auto text-text-primary/90 mt-2 p-2 rounded bg-black/40">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Confirm Synthetic Dataset Reset"
        message="This operation resets all synthetic demo incidents, linked citizen reports, and audit events, and restores SimClock to the current UTC time. Non-demo records are preserved."
        confirmLabel="Reset Synthetic Data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleResetConfirmed}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
