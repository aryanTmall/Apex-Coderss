import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  MapPin,
  Clock,
  Phone,
  PhoneCall,
  Navigation,
  ShieldCheck,
  Flame,
  HeartPulse,
  AlertTriangle,
  RotateCcw,
  Check,
  Copy,
  ExternalLink,
  ShieldAlert,
  Info,
  Building
} from 'lucide-react';
import { EmergencyStationEta } from '../../api/types';
import { api } from '../../api/client';

const CITY_ZONE_FALLBACKS = [
  { name: 'Connaught Place / Central Delhi', lat: 28.6289, lon: 77.2183 },
  { name: 'Safdarjung / South Delhi', lat: 28.5700, lon: 77.2070 },
  { name: 'Karol Bagh / West Delhi', lat: 28.6448, lon: 77.1906 },
  { name: 'Hauz Khas / Saket', lat: 28.5494, lon: 77.2001 },
  { name: 'Civil Lines / North Delhi', lat: 28.6720, lon: 77.2210 },
  { name: 'Nehru Place / Kalkaji', lat: 28.5490, lon: 77.2510 },
];

export const EmergencyEtaSection: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    accuracy?: number;
    source: 'GPS' | 'MANUAL';
    localityName?: string;
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState<
    'IDLE' | 'REQUESTING' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE'
  >('IDLE');

  const [stations, setStations] = useState<EmergencyStationEta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [selectedFallbackIndex, setSelectedFallbackIndex] = useState<number>(0);
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null);

  // Auto-acquire location or use default fallback on mount
  useEffect(() => {
    handleRequestGpsLocation();
  }, []);

  // Fetch nearest stations whenever location or service type filter changes
  useEffect(() => {
    if (userLocation) {
      fetchNearestStations(userLocation.lat, userLocation.lon, selectedType);
    }
  }, [userLocation, selectedType]);

  const handleRequestGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('UNAVAILABLE');
      applyFallbackLocation(0);
      return;
    }

    setLocationStatus('REQUESTING');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('GRANTED');
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'GPS',
          localityName: 'Live Device GPS',
        });
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setLocationStatus('DENIED');
        // Apply default fallback to Central Delhi
        applyFallbackLocation(0);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const applyFallbackLocation = (index: number) => {
    setSelectedFallbackIndex(index);
    const fb = CITY_ZONE_FALLBACKS[index];
    setUserLocation({
      lat: fb.lat,
      lon: fb.lon,
      source: 'MANUAL',
      localityName: fb.name,
    });
  };

  const fetchNearestStations = async (lat: number, lon: number, type: string) => {
    setLoading(true);
    try {
      const data = await api.getNearestEmergencyStations(lat, lon, type, 6);
      setStations(data);
      setLastCalculated(new Date());
    } catch (err) {
      console.error('Failed to fetch nearest emergency stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'POLICE':
        return <ShieldCheck className="w-5 h-5 text-civic-blue" />;
      case 'FIRE':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'MEDICAL':
        return <HeartPulse className="w-5 h-5 text-alert-red" />;
      case 'DISASTER':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Building className="w-5 h-5 text-verified-teal" />;
    }
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'POLICE':
        return 'bg-civic-blue/15 text-civic-blue border-civic-blue/30';
      case 'FIRE':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MEDICAL':
        return 'bg-alert-red/15 text-alert-red border-alert-red/30';
      case 'DISASTER':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      default:
        return 'bg-surface-2 text-text-muted border-white/10';
    }
  };

  const SERVICE_TABS = [
    { id: 'ALL', label: 'All Services' },
    { id: 'POLICE', label: 'Police Stations' },
    { id: 'FIRE', label: 'Fire & Rescue' },
    { id: 'MEDICAL', label: 'Trauma & Hospitals' },
    { id: 'DISASTER', label: 'Disaster Command' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Header & Life-Safety Warning Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-alert-red/15 via-surface-1 to-surface-1 border border-alert-red/30 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-alert-red/20 border border-alert-red/40 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 text-alert-red animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-alert-red font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-alert-red/20 border border-alert-red/30">
                LIFE-CRITICAL EMERGENCY ADVISORY
              </span>
            </div>
            <h3 className="font-serif text-lg font-normal text-white mt-1">
              Nearest Emergency Services & Live Dispatch ETA
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Travel times are computed using live road routing from your verified GPS location to the nearest station.
              <strong className="text-alert-red ml-1 font-semibold">
                For immediate life-threatening situations, dial 112 directly.
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Location Acquisition & Manual Fallback Bar */}
      <div className="p-4 rounded-xl bg-surface-1 border border-white/10 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Location State */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-white/10 flex items-center justify-center shrink-0">
            <Crosshair className={`w-4 h-4 ${locationStatus === 'REQUESTING' ? 'text-amber-400 animate-spin' : userLocation?.source === 'GPS' ? 'text-sky-400' : 'text-verified-teal'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">
                {userLocation?.localityName || 'Locating current position...'}
              </span>
              <span className={`text-[10px] px-2 py-0.2 rounded border ${userLocation?.source === 'GPS' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                {userLocation?.source === 'GPS' ? 'GPS Lock' : 'Manual Fallback'}
              </span>
            </div>
            <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-2">
              <span>
                Coordinates: {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}` : 'Detecting...'}
              </span>
              {userLocation?.accuracy && (
                <span>(±{Math.round(userLocation.accuracy)}m)</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {locationStatus === 'DENIED' && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-[11px]">Select Zone:</span>
              <select
                value={selectedFallbackIndex}
                onChange={(e) => applyFallbackLocation(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-surface-2 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-civic-blue"
              >
                {CITY_ZONE_FALLBACKS.map((fb, idx) => (
                  <option key={fb.name} value={idx}>
                    {fb.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleRequestGpsLocation}
            disabled={locationStatus === 'REQUESTING'}
            className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-white/10 text-white text-xs border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${locationStatus === 'REQUESTING' ? 'animate-spin text-civic-blue' : ''}`} />
            <span>Refresh GPS</span>
          </button>
        </div>
      </div>

      {/* 3. Service Type Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-surface-1 border border-white/10">
        {SERVICE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              selectedType === tab.id
                ? 'bg-civic-blue text-white font-bold shadow-md shadow-civic-blue/20'
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Nearest Emergency Stations with Live Routing ETA */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 rounded-xl bg-surface-1 border border-white/5 animate-pulse flex flex-col gap-3">
              <div className="w-24 h-4 bg-white/10 rounded" />
              <div className="w-3/4 h-5 bg-white/10 rounded" />
              <div className="w-full h-8 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : stations.length === 0 ? (
        <div className="p-8 rounded-xl bg-surface-1 border border-white/10 text-center text-xs">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h4 className="font-semibold text-white">No Nearby Stations Found</h4>
          <p className="text-text-muted mt-1">Please select "All Services" or verify your location coordinates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((stn, idx) => {
            const isClosest = idx === 0;
            return (
              <div
                key={stn.id}
                className={`p-5 rounded-xl bg-surface-1 border transition-all flex flex-col justify-between shadow-lg relative ${
                  isClosest
                    ? 'border-alert-red/40 hover:border-alert-red bg-gradient-to-b from-surface-1 to-alert-red/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Top Badge: Rank / Closest */}
                {isClosest && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-alert-red text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
                    ★ Nearest Eligible Station
                  </span>
                )}

                <div>
                  {/* Service Type & Operating Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold flex items-center gap-1 ${getServiceTypeBadge(stn.service_type)}`}>
                      {getServiceTypeIcon(stn.service_type)}
                      <span>{stn.service_type}</span>
                    </span>

                    <span className="text-[10px] font-mono text-verified-teal bg-verified-teal/10 px-2 py-0.5 rounded border border-verified-teal/20">
                      {stn.operating_status === 'OPERATIONAL_24X7' ? '24/7 Verified' : 'Operational'}
                    </span>
                  </div>

                  {/* Station Name */}
                  <h4 className="font-semibold text-white text-sm leading-snug mt-1">
                    {stn.name}
                  </h4>

                  {/* Address */}
                  <p className="text-xs text-text-muted mt-1.5 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <span>{stn.address}</span>
                  </p>

                  {/* Estimated Arrival Time Box */}
                  <div className="mt-3 p-3 rounded-lg bg-surface-2/90 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-muted uppercase">ESTIMATED TRAVEL TIME</span>
                      <span className="text-[10px] font-mono text-text-muted">
                        {stn.live_eta_available ? 'ROAD ROUTE' : 'APPROXIMATE'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      {stn.live_eta_available && stn.estimated_travel_minutes !== null ? (
                        <>
                          <span className="text-2xl font-bold font-mono text-white">
                            {stn.estimated_travel_minutes}
                          </span>
                          <span className="text-xs font-mono text-white">MIN</span>
                          <span className="text-xs font-mono text-text-muted ml-auto">
                            {stn.route_distance_km} km by road
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold font-mono text-amber-400">
                            Live ETA unavailable
                          </span>
                          <span className="text-xs font-mono text-text-muted ml-auto">
                            ~{stn.straight_line_distance_km} km straight-line
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-text-muted mt-1.5 flex items-center justify-between pt-1 border-t border-white/5">
                      <span>Source: {stn.eta_source}</span>
                      <Clock className="w-3 h-3 text-text-muted" />
                    </div>
                  </div>

                  {/* Capabilities Tags */}
                  {stn.capabilities && stn.capabilities.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {stn.capabilities.slice(0, 3).map((cap, i) => (
                        <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Call, Directions, Copy */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <a
                    href={`tel:${stn.phone_number}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-alert-red hover:bg-alert-red/90 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-alert-red/20 transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Station</span>
                  </a>

                  <a
                    href={stn.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-lg bg-surface-2 hover:bg-white/10 text-white text-xs font-mono border border-white/10 flex items-center gap-1 transition-colors"
                    title="Get Turn-by-Turn Directions in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Directions</span>
                  </a>

                  <button
                    onClick={() => handleCopy(stn.phone_number)}
                    className="p-2 rounded-lg bg-surface-2 hover:bg-white/10 text-text-muted hover:text-white border border-white/10"
                    title="Copy Phone Number"
                  >
                    {copiedPhone === stn.phone_number ? (
                      <Check className="w-3.5 h-3.5 text-verified-teal" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
