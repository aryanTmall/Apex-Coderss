import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  ShieldAlert,
  HeartPulse,
  Flame,
  ShieldCheck,
  Baby,
  Activity,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Info
} from 'lucide-react';
import { EmergencyResource } from '../api/types';
import { api } from '../api/client';
import { EmergencyEtaSection } from '../components/emergency/EmergencyEtaSection';

export const EmergencyPage: React.FC = () => {
  const [services, setServices] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await api.getEmergencyServices(selectedCategory);
      setServices(data);
    } catch (err) {
      console.error('Failed to load emergency contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationNote(`Live GPS detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} — Showing National & Delhi NCR priority dispatch.`);
      },
      (err) => {
        setLocating(false);
        setLocationNote('Location permission denied or unavailable. Showing all verified national hotlines.');
      }
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GENERAL':
        return <Activity className="w-5 h-5 text-verified-teal" />;
      case 'POLICE':
        return <ShieldCheck className="w-5 h-5 text-civic-blue" />;
      case 'MEDICAL':
        return <HeartPulse className="w-5 h-5 text-alert-red" />;
      case 'FIRE':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'WOMEN_SAFETY':
        return <ShieldAlert className="w-5 h-5 text-pink-500" />;
      case 'CHILD_PROTECTION':
        return <Baby className="w-5 h-5 text-purple-400" />;
      case 'DISASTER':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Phone className="w-5 h-5 text-text-muted" />;
    }
  };

  const CATEGORIES = [
    { id: 'ALL', label: 'All Services' },
    { id: 'GENERAL', label: '112 Unified' },
    { id: 'POLICE', label: 'Police 100' },
    { id: 'MEDICAL', label: 'Ambulance 108' },
    { id: 'FIRE', label: 'Fire 101' },
    { id: 'WOMEN_SAFETY', label: 'Women 1091' },
    { id: 'CHILD_PROTECTION', label: 'Childline 1098' },
    { id: 'DISASTER', label: 'Disaster 1070' },
    { id: 'INFRASTRUCTURE', label: 'Hazards 1912' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-2">
      {/* Top Urgent Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-alert-red/10 border border-alert-red/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-alert-red/20 border border-alert-red/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-alert-red animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-alert-red tracking-wide uppercase font-mono">
              Emergency Safety Advisory
            </h2>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              CivicHelp is a municipal issue-tracking system, <strong className="text-white">not an emergency dispatch agency</strong>.
              For immediate threats to life, medical trauma, active fires, or violent crime, <strong className="text-alert-red">call the official national numbers directly below</strong>.
            </p>
          </div>
        </div>

        <a
          href="tel:112"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-alert-red hover:bg-rose-600 text-white font-mono font-bold text-xs uppercase shadow-lg shadow-alert-red/20 shrink-0 transition-all active:scale-95"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          <span>Call 112 Unified Now</span>
        </a>
      </div>

      {/* Live Routing ETA for Nearest Emergency Stations */}
      <EmergencyEtaSection />

      {/* Header & Location Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-verified-teal uppercase tracking-widest px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/20">
              NATIONAL EMERGENCY REGISTRY // 24x7
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[11px] font-mono text-text-muted">JURISDICTION: ALL INDIA</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-text-primary tracking-tight">
            Emergency Services Directory
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-xl">
            Authoritative, officially-verified public emergency contact numbers with direct one-click dialling, jurisdiction metadata, and verified official government source links.
          </p>
        </div>

        {/* Location Detection Button */}
        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-white/10 text-xs font-mono text-text-primary transition-all active:scale-95"
          >
            <Navigation className={`w-3.5 h-3.5 text-civic-blue ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting Jurisdiction...' : 'Filter by My GPS Jurisdiction'}</span>
          </button>
          {locationNote && (
            <span className="text-[10px] font-mono text-verified-teal max-w-xs text-left md:text-right">
              {locationNote}
            </span>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-civic-blue text-white border-civic-blue shadow-md font-semibold'
                : 'bg-surface-1 hover:bg-surface-2 text-text-muted border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emergency Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-surface-1/40 card-border animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center bg-surface-1 rounded-xl card-border">
          <p className="text-xs font-mono text-text-muted">No emergency contacts found for the selected category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((res) => {
            const isCopied = copiedId === res.id;
            const isNational112 = res.phone_number === '112';

            return (
              <div
                key={res.id}
                className={`relative rounded-xl p-5 border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                  isNational112
                    ? 'bg-gradient-to-br from-surface-1 to-alert-red/10 border-alert-red/40 shadow-xl shadow-alert-red/5'
                    : 'bg-surface-1 hover:bg-surface-2/80 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Card Top: Icon & Verification Pill */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-night border border-white/10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(res.category)}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-verified-teal/10 border border-verified-teal/30 text-[9px] font-mono text-verified-teal">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{res.verification_status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-semibold text-text-primary leading-snug">
                    {res.name}
                  </h3>
                  {res.description && (
                    <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                      {res.description}
                    </p>
                  )}

                  {/* Key Metadata (Jurisdiction & Hours) */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1 text-[11px] font-mono text-text-muted">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-civic-blue shrink-0" />
                      <span className="truncate">{res.jurisdiction}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-verified-teal shrink-0" />
                      <span>{res.available_hours}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Phone Display & Actions */}
                <div className="mt-5 pt-3 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-2xl font-bold text-white tracking-wider">
                        {res.phone_number}
                      </span>
                      {res.alternate_phone && (
                        <span className="text-xs text-text-muted">
                          / {res.alternate_phone}
                        </span>
                      )}
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(res.phone_number, res.id)}
                      title="Copy phone number"
                      className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-white border border-white/10 transition-colors"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-verified-teal" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Dial Action & Source Link */}
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={`tel:${res.phone_number}`}
                      className={`flex-1 py-2 rounded-lg text-center font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                        isNational112
                          ? 'bg-alert-red hover:bg-rose-600 text-white shadow-alert-red/30'
                          : 'bg-civic-blue hover:bg-civic-blue-hover text-white shadow-civic-blue/20'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call {res.phone_number}</span>
                    </a>

                    <a
                      href={res.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Verify at official government portal"
                      className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-white border border-white/10 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Public Safety FAQ Footer */}
      <div className="p-5 rounded-xl bg-surface-1 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono text-text-muted mt-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-verified-teal shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-semibold">Jurisdiction & Verification Protocol:</span>
            <p className="text-[11px] text-text-muted mt-0.5">
              Contact numbers are verified against national ministry directories (MHA, MoHFW, NDMA) and updated monthly.
              Civic issues (potholes, garbage, water leaks) should be submitted via the public report intake form.
            </p>
          </div>
        </div>

        <a
          href="/app/report"
          className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-white border border-white/10 text-xs shrink-0 whitespace-nowrap transition-colors"
        >
          Submit Civic Complaint &rarr;
        </a>
      </div>
    </div>
  );
};
