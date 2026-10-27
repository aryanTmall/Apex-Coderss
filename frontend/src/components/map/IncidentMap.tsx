import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { Incident, Hotspot } from '../../api/types';
import { MapTileStyle, MAP_LAYERS, createTileLayer } from './mapLayers';
import { getCategoryConfig, ALL_CATEGORIES, CategoryConfig } from '../../utils/categoryColors';
import {
  Layers,
  MapPin,
  Crosshair,
  RotateCcw,
  Search,
  Filter,
  ExternalLink,
  Navigation,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  List,
  Map as MapIcon,
  HelpCircle,
  Copy,
  Check,
  Building
} from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  hotspots?: Hotspot[];
  selectedIncidentId?: string;
  onSelectIncident?: (id: string) => void;
  height?: string;
  showHotspots?: boolean;
  showControls?: boolean;
  showUnlocatedTab?: boolean;
}

// Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  hotspots = [],
  selectedIncidentId,
  onSelectIncident,
  height = '520px',
  showHotspots = true,
  showControls = true,
  showUnlocatedTab = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const hotspotsGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);

  // Filter States
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('google');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'map' | 'unlocated' | 'legend'>('map');
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // User GPS State
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected Incident detail card state
  const [inspectedIncident, setInspectedIncident] = useState<Incident | null>(null);

  // Separate geolocated and unlocated incidents
  const { geolocatedIncidents, unlocatedIncidents } = useMemo(() => {
    const geo: Incident[] = [];
    const unloc: Incident[] = [];

    incidents.forEach((inc) => {
      const hasCoords =
        typeof inc.latitude === 'number' &&
        typeof inc.longitude === 'number' &&
        !isNaN(inc.latitude) &&
        !isNaN(inc.longitude);

      if (hasCoords && inc.location_mode !== 'UNCONFIRMED') {
        geo.push(inc);
      } else {
        unloc.push(inc);
      }
    });

    return { geolocatedIncidents: geo, unlocatedIncidents: unloc };
  }, [incidents]);

  // Apply filters
  const filteredIncidents = useMemo(() => {
    return geolocatedIncidents.filter((inc) => {
      if (selectedCategory !== 'ALL' && inc.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (statusFilter === 'OPEN' && inc.status === 'RESOLVED') return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'OPEN' && inc.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'ALL' && inc.priority !== parseInt(priorityFilter, 10)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchTracking = inc.tracking_id.toLowerCase().includes(q);
        const matchLoc = (inc.address || inc.location_description || '').toLowerCase().includes(q);
        const matchCategory = inc.category.toLowerCase().includes(q);
        if (!matchTitle && !matchTracking && !matchLoc && !matchCategory) return false;
      }
      return true;
    });
  }, [geolocatedIncidents, selectedCategory, statusFilter, priorityFilter, searchQuery]);

  // Synchronize inspected incident with selectedIncidentId prop
  useEffect(() => {
    if (selectedIncidentId) {
      const found = incidents.find((i) => i.id === selectedIncidentId);
      if (found) setInspectedIncident(found);
    }
  }, [selectedIncidentId, incidents]);

  // Custom Category-Color SVG Icon Creator with Distinct Shape & Glyph
  const createCategoryMarkerIcon = (inc: Incident, isSelected: boolean) => {
    const cfg = getCategoryConfig(inc.category);
    const size = isSelected ? 38 : 30;
    const isHighPriority = inc.priority >= 4;

    const pulseHtml = isSelected
      ? `<div style="position: absolute; inset: -8px; border-radius: 50%; border: 2px solid ${cfg.color}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.85;"></div>`
      : '';

    const priorityDot = isHighPriority
      ? `<div style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #EF4444; border: 1.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 6px #EF4444;"></div>`
      : '';

    return L.divIcon({
      className: 'custom-category-pin',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
          ${pulseHtml}
          ${priorityDot}
          <div style="width: ${size}px; height: ${size}px; background: ${cfg.color}; border: 2px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 12px ${cfg.color}66; display: flex; align-items: center; justify-content: center;">
            <div style="width: ${Math.round(size * 0.55)}px; height: ${Math.round(size * 0.55)}px; color: #FFFFFF; transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
                ${cfg.svgIcon}
              </svg>
            </div>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultLat = 28.6289;
    const defaultLon = 77.2183;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Basemap layer
      const initialLayer = createTileLayer(mapStyle);
      initialLayer.addTo(map);
      currentTileLayerRef.current = initialLayer;

      // Hotspots layer
      const hotspotsGroup = L.layerGroup().addTo(map);
      hotspotsGroupRef.current = hotspotsGroup;

      // User location layer
      const userLocGroup = L.layerGroup().addTo(map);
      userLocationLayerRef.current = userLocGroup;

      // Cluster Group with Dark Theme Styling
      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 45,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let color = '#3B82F6';
          let aura = 'rgba(59, 130, 246, 0.4)';
          if (count > 25) {
            color = '#F97316';
            aura = 'rgba(249, 115, 22, 0.4)';
          }
          if (count > 50) {
            color = '#EF4444';
            aura = 'rgba(239, 68, 68, 0.4)';
          }

          return L.divIcon({
            html: `
              <div style="background: rgba(11, 15, 23, 0.9); border: 2px solid ${color}; color: #FFFFFF; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 12px; font-weight: bold; box-shadow: 0 0 16px ${aura};">
                ${count}
              </div>
            `,
            className: 'custom-cluster-icon',
            iconSize: [38, 38],
          });
        },
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
      mapInstanceRef.current = map;

      // ResizeObserver to handle layout container changes smoothly
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
      };
    }
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    }
    const newLayer = createTileLayer(mapStyle);
    newLayer.addTo(mapInstanceRef.current);
    currentTileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update Hotspot Overlays
  useEffect(() => {
    const hotspotsGroup = hotspotsGroupRef.current;
    if (!hotspotsGroup) return;

    hotspotsGroup.clearLayers();
    if (showHotspots && hotspots.length > 0) {
      hotspots.forEach((hs) => {
        const circleColor = hs.severity_level === 'CRITICAL' ? '#EF4444' : '#A78BFA';
        const circle = L.circle([hs.center_latitude, hs.center_longitude], {
          radius: hs.radius_meters || 150,
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.16,
          weight: 1.5,
          dashArray: '5, 5',
        });

        circle.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 190px; color: #FFFFFF; background: #0B0F17; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);">
            <div style="font-size: 10px; font-family: monospace; color: ${circleColor}; font-weight: bold; text-transform: uppercase;">
              SPATIAL HOTSPOT // ${hs.severity_level}
            </div>
            <div style="font-size: 12px; font-weight: 600; margin: 4px 0;">${hs.name}</div>
            <div style="font-size: 11px; color: #9CA3AF;">${hs.incident_count} linked incidents in 150m perimeter</div>
          </div>
        `);
        hotspotsGroup.addLayer(circle);
      });
    }
  }, [hotspots, showHotspots]);

  // Update Markers & Clusters
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    filteredIncidents.forEach((inc) => {
      const lat = inc.latitude!;
      const lon = inc.longitude!;
      bounds.extend([lat, lon]);

      const isSelected = inc.id === (inspectedIncident?.id || selectedIncidentId);
      const icon = createCategoryMarkerIcon(inc, isSelected);
      const marker = L.marker([lat, lon], { icon });

      const cfg = getCategoryConfig(inc.category);
      const distanceText = userLocation
        ? `<div style="font-size: 10px; color: #38BDF8; font-family: monospace; margin-top: 2px;">
             📍 ${calculateDistanceKm(userLocation.lat, userLocation.lon, lat, lon).toFixed(1)} km from your location
           </div>`
        : '';

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; min-width: 230px; color: #FFFFFF; background: #0B0F17; padding: 10px; border-radius: 8px; border: 1px solid ${cfg.color}55; box-shadow: 0 10px 25px rgba(0,0,0,0.6);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-family: monospace; color: ${cfg.color}; font-weight: bold; background: ${cfg.bgColor}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${cfg.borderColor};">
              ${cfg.label}
            </span>
            <span style="font-size: 10px; color: #9CA3AF; font-family: monospace; background: rgba(255,255,255,0.06); padding: 2px 5px; border-radius: 3px;">
              P${inc.priority} // ${inc.status}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #FFFFFF; line-height: 1.3; margin: 4px 0;">
            ${inc.title}
          </div>
          <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 4px;">
            ${inc.address || inc.location_description || 'Coordinates verified'}
          </div>
          ${distanceText}
          <div style="margin-top: 8px; display: flex; gap: 5px;">
            <a href="/app/incidents/${inc.id}" style="flex: 1; text-align: center; font-size: 10px; font-weight: 600; padding: 5px 8px; background: #3B82F6; color: white; border-radius: 5px; text-decoration: none;">
              Inspect Details
            </a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; font-size: 10px; font-weight: 600; padding: 5px 8px; background: rgba(255,255,255,0.08); color: white; border-radius: 5px; text-decoration: none;">
              Directions ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'tactical-dark-popup' });

      marker.on('click', () => {
        setInspectedIncident(inc);
        if (onSelectIncident) {
          onSelectIncident(inc.id);
        }
      });

      clusterGroup.addLayer(marker);
    });

    // Auto-fit bounds if first load and valid
    if (filteredIncidents.length > 0 && bounds.isValid() && !selectedIncidentId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredIncidents, inspectedIncident, selectedIncidentId, userLocation]);

  // Handle "My Location" GPS Action
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude, accuracy });

        const map = mapInstanceRef.current;
        const group = userLocationLayerRef.current;
        if (map && group) {
          group.clearLayers();

          // Accuracy Circle
          const accCircle = L.circle([latitude, longitude], {
            radius: accuracy || 50,
            color: '#38BDF8',
            fillColor: '#38BDF8',
            fillOpacity: 0.15,
            weight: 1.5,
          });

          // User Pin
          const userPin = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'user-location-pin',
              html: `
                <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #38BDF8; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
                  <div style="width: 14px; height: 14px; background: #38BDF8; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 10px #38BDF8;"></div>
                </div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
          });

          userPin.bindPopup(`
            <div style="font-family: monospace; font-size: 11px; color: #FFFFFF; background: #0B0F17; padding: 6px 10px; border-radius: 6px; border: 1px solid #38BDF8;">
              📍 YOUR CURRENT LOCATION<br/>
              <span style="color: #9CA3AF; font-size: 10px;">Accuracy: ±${Math.round(accuracy || 0)}m</span>
            </div>
          `);

          group.addLayer(accCircle);
          group.addLayer(userPin);
          map.setView([latitude, longitude], 14, { animate: true });
        }
      },
      (err) => {
        setLocating(false);
        alert(`Location acquisition failed: ${err.message}. Please check browser permissions.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setSearchQuery('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Map Header Controls & Filters Bar */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-1 border border-white/10 shadow-lg">
          {/* Left: Search & Quick Counts */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, title, locality..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-2 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-civic-blue cursor-pointer"
            >
              <option value="ALL">All Categories ({geolocatedIncidents.length})</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-2 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-civic-blue cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Incidents</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="REOPENED">Reopened</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-2 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-civic-blue cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="5">P5 Critical</option>
              <option value="4">P4 High</option>
              <option value="3">P3 Medium</option>
              <option value="2">P2 Low</option>
              <option value="1">P1 Minimal</option>
            </select>

            {(selectedCategory !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white text-xs font-mono flex items-center gap-1 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: GPS Locate, Legend Toggle & Tab Switches */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocateMe}
              disabled={locating}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                userLocation
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                  : 'bg-surface-2 hover:bg-white/10 text-white border-white/10'
              }`}
              title="Locate me on map"
            >
              <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating...' : userLocation ? 'GPS Locked' : 'My Location'}</span>
            </button>

            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                showLegend
                  ? 'bg-civic-blue/20 text-civic-blue border-civic-blue/40'
                  : 'bg-surface-2 hover:bg-white/10 text-text-muted hover:text-white border-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Legend</span>
            </button>

            {showUnlocatedTab && (
              <div className="flex items-center bg-surface-2 p-0.5 rounded-lg border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    activeTab === 'map'
                      ? 'bg-civic-blue text-white font-semibold'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3 h-3" />
                  <span>Map ({filteredIncidents.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('unlocated')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    activeTab === 'unlocated'
                      ? 'bg-amber-500 text-white font-semibold'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Unlocated ({unlocatedIncidents.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Interactive Map Canvas Container */}
      {activeTab === 'map' && (
        <div className="relative rounded-xl border border-white/10 overflow-hidden bg-night shadow-xl" style={{ height }}>
          {/* Map Status Badge Overlay */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-surface-1/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse" />
            <span className="text-white font-semibold uppercase tracking-wider">Geospatial Issue Grid</span>
            <span className="text-text-muted">|</span>
            <span className="text-civic-blue font-bold">{filteredIncidents.length} Markers</span>
            {userLocation && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-sky-400">GPS Active</span>
              </>
            )}
          </div>

          {/* Basemap Style Selector Overlay */}
          <div className="absolute top-3 right-3 z-[400] flex items-center gap-1 bg-surface-1/95 backdrop-blur-md p-1 rounded-lg border border-white/10 text-[11px] font-mono shadow-md">
            {(['google', 'osm', 'dark', 'satellite'] as MapTileStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={`px-2 py-1 rounded capitalize transition-all ${
                  mapStyle === style
                    ? 'bg-civic-blue text-white font-bold'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Leaflet Map DOM Root */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Empty State Overlay */}
          {filteredIncidents.length === 0 && (
            <div className="absolute inset-0 z-[400] bg-night/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <MapPin className="w-10 h-10 text-text-muted mb-2 animate-bounce" />
              <h4 className="text-sm font-semibold text-white">No Matching Geolocated Incidents</h4>
              <p className="text-xs text-text-muted mt-1 max-w-sm">
                No incidents match the active category or status filters. Try clearing your search query or selecting "All Categories".
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-1.5 bg-civic-blue text-white text-xs font-mono rounded-lg pointer-events-auto"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Slide-out Inspected Incident Detail Card Overlay */}
          {inspectedIncident && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[500] p-4 bg-surface-1/95 backdrop-blur-md rounded-xl border border-white/15 shadow-2xl animate-fade-in text-xs font-sans">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: getCategoryConfig(inspectedIncident.category).color }}
                  />
                  <span className="font-mono font-bold text-white text-xs">
                    {inspectedIncident.tracking_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-text-muted border border-white/10">
                    P{inspectedIncident.priority} // {inspectedIncident.status}
                  </span>
                </div>
                <button
                  onClick={() => setInspectedIncident(null)}
                  className="text-text-muted hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <h4 className="font-semibold text-white text-sm mt-2 line-clamp-1">
                {inspectedIncident.title}
              </h4>
              <p className="text-text-muted text-xs mt-1 line-clamp-2">
                {inspectedIncident.description}
              </p>

              <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-text-muted block text-[10px]">CATEGORY</span>
                  <span className="text-white font-medium">
                    {getCategoryConfig(inspectedIncident.category).label}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px]">LOCATION</span>
                  <span className="text-white font-medium truncate block">
                    {inspectedIncident.address || inspectedIncident.location_description || 'Coordinates verified'}
                  </span>
                </div>
                {userLocation && typeof inspectedIncident.latitude === 'number' && typeof inspectedIncident.longitude === 'number' && (
                  <div className="col-span-2 text-sky-400 text-[11px]">
                    📍 Distance: {calculateDistanceKm(userLocation.lat, userLocation.lon, inspectedIncident.latitude, inspectedIncident.longitude).toFixed(1)} km from your current GPS position
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
                <Link
                  to={`/app/incidents/${inspectedIncident.id}`}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-semibold text-center transition-colors"
                >
                  Inspect Case
                </Link>
                {typeof inspectedIncident.latitude === 'number' && typeof inspectedIncident.longitude === 'number' && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${inspectedIncident.latitude},${inspectedIncident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 rounded-lg bg-surface-2 hover:bg-white/10 text-white text-xs font-semibold text-center border border-white/10 transition-colors flex items-center gap-1"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => handleCopy(inspectedIncident.tracking_id)}
                  className="p-1.5 rounded-lg bg-surface-2 hover:bg-white/10 text-text-muted hover:text-white border border-white/10"
                  title="Copy Tracking ID"
                >
                  {copiedId === inspectedIncident.tracking_id ? <Check className="w-3.5 h-3.5 text-verified-teal" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Unlocated Reports List View Tab */}
      {activeTab === 'unlocated' && (
        <div className="p-4 rounded-xl bg-surface-1 border border-white/10 shadow-lg text-xs font-sans">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Reports Awaiting Location Confirmation ({unlocatedIncidents.length})</span>
              </h3>
              <p className="text-text-muted text-xs mt-0.5">
                These incidents were submitted in "Left the Scene" mode or lack high-precision GPS. Coordinates are never fabricated.
              </p>
            </div>
          </div>

          {unlocatedIncidents.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <CheckCircle2 className="w-8 h-8 text-verified-teal mx-auto mb-2" />
              <span>All reported civic incidents currently have confirmed GPS coordinates.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {unlocatedIncidents.map((inc) => {
                const cfg = getCategoryConfig(inc.category);
                return (
                  <div
                    key={inc.id}
                    className="p-3 rounded-lg bg-surface-2 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{ background: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.borderColor}` }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-amber-400 font-mono text-[10px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          UNCONFIRMED GPS
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-xs">{inc.title}</h4>
                      <p className="text-text-muted text-xs mt-1 line-clamp-2">
                        {inc.description}
                      </p>
                      <div className="mt-2 text-[11px] font-mono text-text-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{inc.approximate_locality || inc.location_description || 'Locality stated by citizen'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-text-muted">{inc.tracking_id}</span>
                      <Link
                        to={`/app/incidents/${inc.id}`}
                        className="text-civic-blue hover:underline text-xs font-semibold flex items-center gap-1"
                      >
                        <span>Triage & Corroborate</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Complete Accessible Map Category Legend Drawer */}
      {showLegend && (
        <div className="p-4 rounded-xl bg-surface-1 border border-white/10 shadow-xl text-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-civic-blue" />
              <h4 className="font-bold text-white uppercase font-mono text-xs tracking-wider">
                Category Color & Accessible Symbol Legend
              </h4>
            </div>
            <span className="text-[10px] font-mono text-text-muted">
              Distinguishable by color, geometric shape, and interior glyph
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_CATEGORIES.map((cat) => {
              const activeCount = geolocatedIncidents.filter((i) => i.category.toLowerCase() === cat.id.toLowerCase()).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'ALL' : cat.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-white/10 border-white text-white shadow-md'
                      : 'bg-surface-2/60 border-white/5 hover:border-white/20 text-text-muted hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ background: cat.color }}
                    />
                    <span className="font-mono font-bold text-[10px] uppercase text-white truncate">
                      {cat.shortCode}
                    </span>
                  </div>
                  <div className="font-semibold text-[11px] text-white line-clamp-1">{cat.label}</div>
                  <div className="text-[10px] font-mono text-text-muted mt-1 flex items-center justify-between">
                    <span>Shape: {cat.shapeName}</span>
                    <span className="font-bold text-white">{activeCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
