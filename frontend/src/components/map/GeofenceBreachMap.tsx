import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { MapTileStyle, createTileLayer } from './mapLayers';

interface GeofenceBreachMapProps {
  incidentLat: number;
  incidentLon: number;
  incidentTitle?: string;
  closureLat: number;
  closureLon: number;
  contractorName?: string;
  departmentName?: string;
  trustScore?: number;
  height?: string;
}

// Calculate distance in meters using Haversine formula
const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const GeofenceBreachMap: React.FC<GeofenceBreachMapProps> = ({
  incidentLat,
  incidentLon,
  incidentTitle = 'Reported Incident Site',
  closureLat,
  closureLon,
  contractorName = 'Assigned Contractor Field Crew',
  departmentName = 'Roads & Infrastructure',
  trustScore = 85,
  height = '280px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('google');

  const breachDistance = calculateDistanceMeters(incidentLat, incidentLon, closureLat, closureLon);
  const isBreached = breachDistance > 50.0;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(incidentLat + closureLat) / 2, (incidentLon + closureLon) / 2],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Basemap tiles (Google Maps / OSM / Dark / Satellite)
      const initialLayer = createTileLayer(mapStyle);
      initialLayer.addTo(map);
      currentTileLayerRef.current = initialLayer;

      // 1. 50m Allowed Radius Circle around Incident
      L.circle([incidentLat, incidentLon], {
        radius: 50,
        color: '#2DD4BF',
        fillColor: '#2DD4BF',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map).bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; color: #fff; background: #0A0E17; padding: 6px; border-radius: 6px;">
          <strong style="color: #2DD4BF;">50m Maximum Geofence Tolerance</strong><br/>
          Closure proof must be captured within this zone.
        </div>
      `);

      // 2. Incident Pin (Green/Teal)
      const incidentIcon = L.divIcon({
        className: 'incident-geo-pin',
        html: `
          <div style="position: relative; width: 30px; height: 30px; transform: translate(-50%, -100%);">
            <div style="width: 30px; height: 30px; background: #2DD4BF; border: 2px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(45, 212, 191, 0.7);">
              <div style="width: 8px; height: 8px; background: #FFFFFF; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      L.marker([incidentLat, incidentLon], { icon: incidentIcon }).addTo(map).bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; color: #fff; background: #0A0E17; padding: 6px; border-radius: 6px;">
          <strong style="color: #2DD4BF;">Reported Incident Site</strong><br/>
          ${incidentTitle}
        </div>
      `);

      // 3. Contractor Closure Pin (Red if breached, Teal if within 50m)
      const pinColor = isBreached ? '#F43F5E' : '#2DD4BF';
      const closureIcon = L.divIcon({
        className: 'closure-geo-pin',
        html: `
          <div style="position: relative; width: 30px; height: 30px; transform: translate(-50%, -100%);">
            <div style="width: 30px; height: 30px; background: ${pinColor}; border: 2px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${pinColor}99;">
              <div style="width: 8px; height: 8px; background: #FFFFFF; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      L.marker([closureLat, closureLon], { icon: closureIcon }).addTo(map).bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; color: #fff; background: #0A0E17; padding: 6px; border-radius: 6px;">
          <strong style="color: ${pinColor};">${isBreached ? 'Spoofed Closure Site' : 'Verified Closure Site'}</strong><br/>
          Distance: ${breachDistance.toFixed(1)}m from site
        </div>
      `);

      // 4. Dashed Polyline connecting both points
      const line = L.polyline(
        [
          [incidentLat, incidentLon],
          [closureLat, closureLon],
        ],
        {
          color: pinColor,
          weight: 2.5,
          dashArray: '6, 6',
        }
      ).addTo(map);

      // Fit bounds with padding
      const bounds = L.latLngBounds([
        [incidentLat, incidentLon],
        [closureLat, closureLon],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      mapInstanceRef.current = map;

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
      };
    }
  }, [incidentLat, incidentLon, closureLat, closureLon, breachDistance, isBreached]);

  // Swap Tile Layer when user switches basemap style (Google, OSM, Dark, Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    }
    const newLayer = createTileLayer(mapStyle);
    newLayer.addTo(mapInstanceRef.current);
    currentTileLayerRef.current = newLayer;
  }, [mapStyle]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Visual Leaflet Map */}
      <div className="relative rounded-xl border border-white/10 overflow-hidden bg-night" style={{ height }}>
        {/* Top Tag */}
        <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-1.5 bg-surface-1/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono border border-white/10 shadow-lg pointer-events-none">
          <Navigation className="w-3 h-3 text-civic-blue" />
          <span className="text-text-primary">GEOFENCE TELEMETRY & BREACH FORENSICS</span>
        </div>

        {/* Basemap Tile Layer Switcher */}
        <div className="absolute top-2.5 right-2.5 z-[400] flex items-center gap-1 bg-surface-1/95 backdrop-blur-md p-1 rounded-lg border border-white/15 shadow-xl">
          {(['google', 'osm', 'dark', 'satellite'] as MapTileStyle[]).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setMapStyle(style)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                mapStyle === style
                  ? 'bg-civic-blue text-white font-bold shadow'
                  : 'text-text-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              {style === 'google' ? 'Google' : style === 'osm' ? 'OSM' : style === 'dark' ? 'Dark' : 'Satellite'}
            </button>
          ))}
        </div>

        {/* Distance Breach Pill */}
        <div
          className={`absolute bottom-2.5 right-2.5 z-[400] flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold shadow-xl border ${
            isBreached
              ? 'bg-alert-red text-white border-alert-red/50 shadow-alert-red/30'
              : 'bg-verified-teal text-night border-verified-teal/50'
          }`}
        >
          {isBreached ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
          <span>
            {isBreached
              ? `GEOFENCE BREACH: ${breachDistance.toFixed(1)}m (LIMIT: 50m)`
              : `MATCH VERIFIED: ${breachDistance.toFixed(1)}m <= 50m`}
          </span>
        </div>

        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Forensic Intelligence Alert Banner */}
      {isBreached && (
        <div className="p-3.5 rounded-xl bg-alert-red/10 border border-alert-red/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-alert-red shrink-0" />
            <div>
              <div className="font-semibold text-alert-red">
                Contractor Spoofing Detected // Geofence Violation
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Closure coordinates submitted by crew are {breachDistance.toFixed(1)}m away from incident site.
                Audit flag <code className="text-alert-red bg-alert-red/10 px-1 rounded">SPOOFING_GEOFENCE_BREACH</code> recorded.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-surface-1 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-[11px]">
            <span className="text-text-muted">{departmentName} Trust:</span>
            <span className="text-amber-400 font-bold">{trustScore}% (-15% Penalty)</span>
          </div>
        </div>
      )}
    </div>
  );
};
