import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Crosshair,
  Loader2,
  Navigation,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Flame,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { api } from '../../api/client';
import { LocationSearchResult, DensityResponse } from '../../api/types';
import { MapTileStyle, MAP_LAYERS, createTileLayer } from './mapLayers';

interface LocationPickerMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  onChange: (lat: number, lon: number, address?: string) => void;
  height?: string;
  disabled?: boolean;
}

// 5 Key Demonstration Urban Zones for instant quick-select
const ZONE_PRESETS = [
  { name: 'Downtown Hub', lat: 28.6315, lon: 77.2167, desc: 'Central Commercial District' },
  { name: 'Sector 14', lat: 28.4720, lon: 77.0420, desc: 'Residential Sector' },
  { name: 'Industrial Corridor', lat: 28.5355, lon: 77.3910, desc: 'Manufacturing & Tech Belt' },
  { name: 'University Ave', lat: 28.7000, lon: 77.2100, desc: 'Academic & Campus Zone' },
  { name: 'Riverside Underpass', lat: 28.6650, lon: 77.2300, desc: 'Heritage & Transit Hub' },
];

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  address,
  onChange,
  height = '340px',
  disabled = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);

  const defaultLat = latitude ?? 28.6315;
  const defaultLon = longitude ?? 77.2167;

  // Active Basemap Style (Default to Google Maps or OSM)
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('google');

  // Pin movement & animation state (Uber/Swiggy style)
  const [isPinLifted, setIsPinLifted] = useState<boolean>(false);
  const [showPulseRing, setShowPulseRing] = useState<boolean>(false);

  // Search & Geolocation state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [reverseAddress, setReverseAddress] = useState<string>(address || '');
  const [isReverseLoading, setIsReverseLoading] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Live Area Complaint Density state
  const [density, setDensity] = useState<DensityResponse | null>(null);
  const [isDensityLoading, setIsDensityLoading] = useState(false);

  // Reverse geocoding helper
  const fetchAddressAndDensity = useCallback(async (lat: number, lon: number) => {
    setIsReverseLoading(true);
    setIsDensityLoading(true);

    try {
      const addrPromise = api.reverseGeocode(lat, lon).catch(() => ({
        formatted_address: `Coordinates (${lat.toFixed(5)}, ${lon.toFixed(5)})`
      }));
      const densityPromise = api.getComplaintDensity(lat, lon, 150).catch(() => null);

      const [addrRes, densityRes] = await Promise.all([addrPromise, densityPromise]);

      setReverseAddress(addrRes.formatted_address);
      onChange(lat, lon, addrRes.formatted_address);

      if (densityRes) {
        setDensity(densityRes);
      }
    } finally {
      setIsReverseLoading(false);
      setIsDensityLoading(false);
    }
  }, [onChange]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Initialize with selected basemap (Google Maps / OSM)
      const initialLayer = createTileLayer(mapStyle);
      initialLayer.addTo(map);
      currentTileLayerRef.current = initialLayer;

      // Uber/Swiggy-style Center Pin interactions
      map.on('movestart', () => {
        if (!disabled) {
          isUserInteractingRef.current = true;
          setIsPinLifted(true);
          setShowPulseRing(false);
        }
      });

      map.on('moveend', () => {
        if (!disabled && isUserInteractingRef.current) {
          setIsPinLifted(false);
          setShowPulseRing(true);

          const center = map.getCenter();
          const lat = Number(center.lat.toFixed(6));
          const lon = Number(center.lng.toFixed(6));
          fetchAddressAndDensity(lat, lon);

          setTimeout(() => setShowPulseRing(false), 1200);
        }
      });

      // Click to pan to location
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (disabled) return;
        isUserInteractingRef.current = true;
        map.panTo(e.latlng, { animate: true, duration: 0.5 });
      });

      mapInstanceRef.current = map;

      // Initial density lookup
      fetchAddressAndDensity(defaultLat, defaultLon);

      // ResizeObserver to completely eliminate Leaflet grey-tile bug
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      // Initial size invalidation timeout
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

  // Update map center when coordinates change from outside
  useEffect(() => {
    if (latitude && longitude && mapInstanceRef.current && !isUserInteractingRef.current) {
      const cur = mapInstanceRef.current.getCenter();
      if (Math.abs(cur.lat - latitude) > 0.0001 || Math.abs(cur.lng - longitude) > 0.0001) {
        mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom(), { animate: true });
        fetchAddressAndDensity(latitude, longitude);
      }
    }
    isUserInteractingRef.current = false;
  }, [latitude, longitude, fetchAddressAndDensity]);

  // Debounced address search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchLocation(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Select search result
  const handleSelectResult = (result: LocationSearchResult) => {
    const lat = Number(result.latitude.toFixed(6));
    const lon = Number(result.longitude.toFixed(6));
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setReverseAddress(result.display_name);

    if (mapInstanceRef.current) {
      isUserInteractingRef.current = false;
      mapInstanceRef.current.setView([lat, lon], 16, { animate: true });
    }
    fetchAddressAndDensity(lat, lon);
  };

  // Jump to Preset Zone
  const handleSelectZone = (zone: typeof ZONE_PRESETS[0]) => {
    setSearchQuery(zone.name);
    setReverseAddress(`${zone.name} (${zone.desc})`);
    if (mapInstanceRef.current) {
      isUserInteractingRef.current = false;
      mapInstanceRef.current.setView([zone.lat, zone.lon], 16, { animate: true });
    }
    fetchAddressAndDensity(zone.lat, zone.lon);
  };

  // Locate Me (Current GPS)
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));

        if (mapInstanceRef.current) {
          isUserInteractingRef.current = false;
          mapInstanceRef.current.setView([lat, lon], 16, { animate: true });
        }
        fetchAddressAndDensity(lat, lon);
      },
      (err) => {
        setIsLocating(false);
        setGeoError(
          err.code === 1
            ? 'GPS location permission denied. You can select an area preset below or drag the map.'
            : 'Unable to acquire satellite lock. Please use city presets or search.'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Top Search & Actions Bar */}
      <div className="relative z-[500] flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-civic-blue" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
            placeholder="Search city street, zone or landmark (e.g. Connaught Place, Sector 14)..."
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-all"
          />

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-1 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[600] max-h-52 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectResult(res)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-surface-2 flex items-start gap-2 border-b border-white/5 last:border-0 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-civic-blue shrink-0 mt-0.5" />
                  <div className="flex flex-col truncate">
                    <span className="text-text-primary font-medium truncate">{res.display_name}</span>
                    <span className="text-[10px] text-text-muted font-mono">
                      {res.latitude.toFixed(4)}, {res.longitude.toFixed(4)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locate Me (GPS) */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={disabled || isLocating}
          title="Use live GPS coordinates"
          className="px-3 py-2 bg-surface-2 hover:bg-surface-3 border border-white/10 rounded-lg text-xs font-medium text-text-primary flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-verified-teal" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-verified-teal" />
          )}
          <span className="hidden sm:inline">Locate Me (GPS)</span>
        </button>

        {/* Manual Coordinates Toggle */}
        <button
          type="button"
          onClick={() => setShowManualCoords(!showManualCoords)}
          title="Toggle Manual Coordinates"
          className={`p-2 rounded-lg border text-xs transition-all ${
            showManualCoords
              ? 'bg-civic-blue text-white border-civic-blue'
              : 'bg-surface-2 hover:bg-surface-3 text-text-muted border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick-Select Major Municipal Zones Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-text-muted text-[10px] font-mono shrink-0 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Building className="w-3 h-3 text-civic-blue" />
          Zones:
        </span>
        {ZONE_PRESETS.map((z, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectZone(z)}
            className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-surface-3 border border-white/5 text-text-secondary hover:text-white shrink-0 transition-all active:scale-95 text-[11px] font-medium"
          >
            {z.name}
          </button>
        ))}
      </div>

      {/* Geolocation Notice / Error */}
      {geoError && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-risk-red/10 border border-risk-red/20 text-risk-red text-[11px] animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Manual Coordinates Collapsible Panel */}
      {showManualCoords && (
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-2 rounded-lg border border-white/5 animate-fade-in">
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={latitude || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onChange(val, longitude || defaultLon);
                  if (mapInstanceRef.current) mapInstanceRef.current.panTo([val, longitude || defaultLon]);
                }
              }}
              className="w-full px-2 py-1 bg-night border border-white/10 rounded text-xs font-mono text-text-primary mt-0.5"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-text-muted uppercase">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={longitude || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onChange(latitude || defaultLat, val);
                  if (mapInstanceRef.current) mapInstanceRef.current.panTo([latitude || defaultLat, val]);
                }
              }}
              className="w-full px-2 py-1 bg-night border border-white/10 rounded text-xs font-mono text-text-primary mt-0.5"
            />
          </div>
        </div>
      )}

      {/* Interactive Map Box with Center Uber/Swiggy Pin Dropper */}
      <div className="relative rounded-card card-border overflow-hidden bg-night" style={{ height }}>
        {/* Floating Instruction Badge */}
        <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-1.5 bg-surface-1/90 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono border border-white/10 shadow-lg pointer-events-none">
          <MapPin className="w-3 h-3 text-civic-blue" />
          <span className="text-text-primary">Drag map to position pin</span>
        </div>

        {/* Basemap Tile Layer Switcher (Google, OSM, Dark, Satellite) */}
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

        {/* Leaflet Container */}
        <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Uber/Swiggy Interactive Animated Center Pin */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none z-[450] -translate-x-1/2 -translate-y-full flex flex-col items-center"
          style={{
            transform: isPinLifted
              ? 'translate(-50%, calc(-100% - 14px)) scale(1.08)'
              : 'translate(-50%, -100%) scale(1)',
            transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Glowing Pin Head */}
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-civic-blue border-2 border-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.65)]">
              <div className="w-3 h-3 rounded-full bg-white shadow-inner animate-pulse" />
            </div>
            {/* Needle stem */}
            <div className="absolute -bottom-2 w-1.5 h-3 bg-white clip-polygon" />
          </div>

          {/* Pulse ring animation on release */}
          {showPulseRing && (
            <div className="absolute -bottom-1 w-10 h-10 rounded-full border-2 border-verified-teal animate-ping pointer-events-none opacity-80" />
          )}

          {/* Dynamic Ground Shadow */}
          <div
            className="w-4 h-1.5 bg-black/60 rounded-full blur-[1.5px] transition-all duration-200"
            style={{
              transform: isPinLifted ? 'translateY(16px) scale(0.6)' : 'translateY(2px) scale(1)',
              opacity: isPinLifted ? 0.35 : 0.8,
            }}
          />
        </div>
      </div>

      {/* Live Area Complaint Density & Auto-Escalation Badge */}
      {density && (
        <div
          className={`flex items-start sm:items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-xs transition-all ${
            density.is_high_density
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : density.density_count > 0
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {density.is_high_density ? (
              <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            ) : density.density_count > 0 ? (
              <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold block sm:inline">
                {density.is_high_density ? 'High-Density Zone Detected:' : 'Area Telemetry:'}{' '}
              </span>
              <span className="text-text-primary text-[11px]">{density.message}</span>
            </div>
          </div>
          {isDensityLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted shrink-0" />
          )}
        </div>
      )}

      {/* Reverse Geocoded Recognized Address Footer */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 border border-white/5 text-xs">
        <div className="flex items-center gap-2 truncate">
          {isReverseLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-civic-blue animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-verified-teal shrink-0" />
          )}
          <span className="text-text-muted text-[11px] font-mono shrink-0">RECOGNIZED:</span>
          <span className="text-text-primary font-medium truncate">
            {reverseAddress || (latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Select location')}
          </span>
        </div>
        {latitude && longitude && (
          <span className="text-[10px] font-mono text-text-muted shrink-0 ml-2 hidden sm:inline">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </div>
    </div>
  );
};
