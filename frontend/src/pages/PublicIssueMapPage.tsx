import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon,
  Filter,
  RefreshCw,
  Search,
  PlusCircle,
  ShieldCheck,
  Radio,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import { Incident, Hotspot } from '../api/types';
import { IncidentMap } from '../components/map/IncidentMap';

export const PublicIssueMapPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incList, hsList] = await Promise.all([
        api.getIncidents({ limit: 500, has_coords: true }),
        api.getHotspots(),
      ]);
      setIncidents(incList);
      setHotspots(hsList);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full py-2 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-1 border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-verified-teal animate-pulse" />
              LIVE GEOSPATIAL INTELLIGENCE // 500+ VERIFIED NODES
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight">
            Public Civic Issue Map
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Click markers to view photographic evidence, verification status, and SLA progress across Delhi municipal wards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/report"
            className="px-4 py-2 rounded-xl bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-civic-blue/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Issue Here</span>
          </Link>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 card-border text-text-muted hover:text-white transition-colors"
            title="Refresh Map Points"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-civic-blue' : ''}`} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-night min-h-[620px] relative">
        <IncidentMap
          incidents={incidents}
          hotspots={hotspots}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={setSelectedIncidentId}
          height="680px"
          showHotspots={true}
          showControls={true}
          showUnlocatedTab={true}
        />
      </div>
    </div>
  );
};
