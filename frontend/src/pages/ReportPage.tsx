import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Lightbulb,
  Trash2,
  Droplets,
  Waves,
  MoreHorizontal,
  MapPin,
  Camera,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Globe,
  UploadCloud,
  FileCheck,
  Clock,
  Navigation,
  Info,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Loader2,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle,
  Download,
  Mic,
} from 'lucide-react';
import { api } from '../api/client';
import { ReportIntakeResult, Attachment } from '../api/types';
import { LocationPickerMap } from '../components/map/LocationPickerMap';
import { VoiceReportModal } from '../components/voice/VoiceReportModal';

// 6 Core Categories per spec
const CATEGORIES = [
  {
    id: 'pothole',
    label: 'Potholes & Road Damage',
    icon: AlertTriangle,
    desc: 'Road crater, damaged asphalt, exposed steel rebar',
    defaultDept: 'Roads & PWD',
    basePriority: 3,
  },
  {
    id: 'streetlight',
    label: 'Broken Streetlights',
    icon: Lightbulb,
    desc: 'Flickering high-mast lamp, dark pedestrian corridor',
    defaultDept: 'Streetlights',
    basePriority: 2,
  },
  {
    id: 'garbage',
    label: 'Garbage & Sanitation',
    icon: Trash2,
    desc: 'Overflowing commercial dumpster, illegal dump heap',
    defaultDept: 'Sanitation',
    basePriority: 3,
  },
  {
    id: 'water_leak',
    label: 'Water Leaks',
    icon: Droplets,
    desc: 'Broken pipeline, burst main line, valve fracture',
    defaultDept: 'Water Supply',
    basePriority: 4,
  },
  {
    id: 'drainage',
    label: 'Blocked Drainage',
    icon: Waves,
    desc: 'Clogged storm culvert, road surface waterlogging',
    defaultDept: 'Drainage',
    basePriority: 3,
  },
  {
    id: 'other',
    label: 'Other / Unlisted Civic Issue',
    icon: MoreHorizontal,
    desc: 'Structural obstruction, fallen branch, safety hazard',
    defaultDept: 'General Municipal Services',
    basePriority: 3,
  },
];

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('pothole');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>(
    'Deep trench pothole on 4th Ave near 12th St intersection. Exposed rebar causing tire punctures, water accumulating inside.'
  );
  const [reporterName, setReporterName] = useState<string>('');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  // Location Intelligence State
  const [hasLeftLocation, setHasLeftLocation] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<number | null>(28.6315);
  const [longitude, setLongitude] = useState<number | null>(77.2167);
  const [address, setAddress] = useState<string>('4th Avenue & 12th Street, Connaught Place');
  const [approximateLocality, setApproximateLocality] = useState<string>('Connaught Place Central Ward');
  const [observationTime, setObservationTime] = useState<string>('Earlier today (morning commute)');
  const [landmarkNotes, setLandmarkNotes] = useState<string>('Near Metro Gate 2 entry plaza');

  // File & Photographic Evidence State with Browser SHA-256
  const [filePreview, setFilePreview] = useState<{
    name: string;
    size: number;
    type: string;
    sha256: string;
    dataUrl: string;
  } | null>(null);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submissions & Result
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<ReportIntakeResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const handleVoiceApply = (data: { category: string; title: string; description: string; location_hint: string }) => {
    const catMap: Record<string, string> = {
      'POTHOLE': 'pothole',
      'STREETLIGHT': 'streetlight',
      'GARBAGE': 'garbage',
      'WATER_LEAKAGE': 'water_leak',
      'DRAINAGE': 'drainage',
      'OTHER': 'other'
    };
    if (data.category && catMap[data.category]) {
      setSelectedCategory(catMap[data.category]);
    }
    if (data.description) {
      setDescription(data.description);
    }
    if (data.location_hint) {
      setLandmarkNotes(data.location_hint);
    }
  };

  // Dynamic AI Triage Inference
  const aiTriage = useMemo(() => {
    let pri = 3;
    const descLower = description.toLowerCase();

    if (
      descLower.includes('rebar') ||
      descLower.includes('emergency') ||
      descLower.includes('burst') ||
      descLower.includes('flood') ||
      descLower.includes('crater') ||
      descLower.includes('accident')
    ) {
      pri = 4;
    }
    if (descLower.includes('severe') && (descLower.includes('danger') || descLower.includes('rebar'))) {
      pri = 5;
    } else if (descLower.includes('minor') || descLower.includes('flicker')) {
      pri = 2;
    }

    const catObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
    const dept = selectedCategory === 'other'
      ? customCategory.trim()
        ? `Department for ${customCategory}`
        : 'Municipal Operations Triage'
      : catObj.defaultDept;

    const slaHours = pri === 5 ? 4 : pri === 4 ? 12 : pri === 3 ? 24 : pri === 2 ? 48 : 72;

    return {
      priority: pri,
      department: dept,
      slaHours,
      categoryName: selectedCategory === 'other' && customCategory.trim() ? customCategory : catObj.label,
    };
  }, [description, selectedCategory, customCategory]);

  // Handle Location Picker Changes
  const handleLocationChange = (lat: number, lon: number, addr?: string) => {
    setLatitude(lat);
    setLongitude(lon);
    if (addr) setAddress(addr);
  };

  // Browser Client-side SHA-256 calculation
  const computeFileSha256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Handle File Input / Drop
  const processSelectedFile = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15MB limit. Please upload an image or PDF under 15MB.');
      return;
    }

    setIsHashing(true);
    setUploadError(null);

    try {
      const sha256 = await computeFileSha256(file);

      // Read Data URL for preview & persistence
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        setFilePreview({
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          sha256,
          dataUrl,
        });
        setIsHashing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError('Failed to compute cryptographic hash for file.');
      setIsHashing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Submit Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || description.length < 5) {
      setErrorMsg('Please enter a description with at least 5 characters.');
      return;
    }

    if (selectedCategory === 'other' && !customCategory.trim()) {
      setErrorMsg('Please enter your custom issue category.');
      return;
    }

    if (!hasLeftLocation && (latitude === null || longitude === null)) {
      setErrorMsg('Please pin a location on the map or enable "I have already left the location".');
      return;
    }

    if (hasLeftLocation && !approximateLocality.trim()) {
      setErrorMsg('Please provide a landmark, neighborhood, or sector description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        description,
        category: selectedCategory,
        custom_category: selectedCategory === 'other' ? customCategory : undefined,
        location_mode: hasLeftLocation ? ('UNCONFIRMED' as const) : ('PRECISE' as const),
        latitude: hasLeftLocation ? null : latitude,
        longitude: hasLeftLocation ? null : longitude,
        address: hasLeftLocation ? undefined : address,
        approximate_locality: hasLeftLocation ? approximateLocality : undefined,
        observation_time: hasLeftLocation ? observationTime : undefined,
        location_description: hasLeftLocation ? landmarkNotes : address,
        reporter_name: reporterName || undefined,
        photo_ref: filePreview?.name || undefined,
        photo_data: filePreview?.dataUrl || undefined,
        sha256_hash: filePreview?.sha256 || undefined,
        language: language.toLowerCase(),
      };

      const result = await api.submitReport(payload);
      setSubmissionResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report. Please review your input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Top Header & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Report Civic Issue
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-civic-blue/20 text-civic-blue font-bold">
              VERIFIED CITIZEN INTAKE
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time duplicate linking, autonomous routing, and cryptographic proof tracking.
          </p>
        </div>

        {/* Voice Assistant & Bilingual Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Report by Voice</span>
          </button>

          <div className="inline-flex items-center bg-surface-2 p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                language === 'EN' ? 'bg-civic-blue text-white font-semibold shadow' : 'text-text-muted hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('HI')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                language === 'HI' ? 'bg-civic-blue text-white font-semibold shadow' : 'text-text-muted hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form (8 cols) + Right Live AI Triage Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 1. Category Selection Grid */}
            <div className="p-5 rounded-card bg-surface-1 card-border flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-civic-blue"></span>
                  1. Select Issue Category
                </span>
                <span className="text-[11px] text-civic-blue font-mono font-medium">Required</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? 'bg-civic-blue/15 border-civic-blue text-white shadow-[0_0_18px_rgba(59,130,246,0.2)]'
                          : 'bg-surface-2/80 hover:bg-surface-2 border-white/5 text-text-secondary hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-civic-blue text-white' : 'bg-surface-3 text-text-muted'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 text-civic-blue" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-text-primary leading-tight">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-text-muted line-clamp-2 mt-0.5">
                          {cat.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Smooth Reveal for 'Other' Custom Vector Input */}
              {selectedCategory === 'other' && (
                <div className="p-3.5 rounded-xl bg-civic-blue/10 border border-civic-blue/30 flex flex-col gap-2 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-civic-blue text-xs font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Specify Custom Issue Type</span>
                  </div>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Broken Skywalk Cable, Unmarked Open Trench, Fallen Telegraph Pole"
                    className="w-full px-3 py-2 bg-surface-1 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-blue"
                  />
                  <span className="text-[11px] text-text-muted">
                    Our AI classifier will automatically infer priority and route to the best matching municipal department.
                  </span>
                </div>
              )}
            </div>

            {/* 2. Issue Description & Reporter Info */}
            <div className="p-5 rounded-card bg-surface-1 card-border flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-civic-blue"></span>
                2. Issue Description & Evidence Notes
              </span>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-primary font-medium flex items-center justify-between">
                  <span>Detailed Narrative</span>
                  <span className="text-[10px] text-text-muted font-mono">{description.length} / 2000</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what is broken, immediate safety hazard, approximate severity, and any visible landmarks..."
                  className="w-full p-3 bg-surface-2 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-text-muted font-mono">Reporter Name (Optional)</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Anonymous Citizen or Full Name"
                    className="w-full px-3 py-2 bg-surface-2 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-blue"
                  />
                </div>
              </div>
            </div>

            {/* 3. Location Intelligence & Uber/Swiggy Pin Dropper */}
            <div className="p-5 rounded-card bg-surface-1 card-border flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-civic-blue"></span>
                  3. Location Intelligence
                </span>

                {/* Left Location Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-secondary hover:text-white">
                  <input
                    type="checkbox"
                    checked={hasLeftLocation}
                    onChange={(e) => setHasLeftLocation(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-2 border-white/20 text-civic-blue focus:ring-0 cursor-pointer"
                  />
                  <span className="font-medium text-[11px]">
                    I have already left the location (Provide landmark description)
                  </span>
                </label>
              </div>

              {/* Conditional Location Experience */}
              {!hasLeftLocation ? (
                <div className="flex flex-col gap-3">
                  <LocationPickerMap
                    latitude={latitude}
                    longitude={longitude}
                    address={address}
                    onChange={handleLocationChange}
                    height="320px"
                  />
                </div>
              ) : (
                /* Unconfirmed Location Mode */
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Awaiting Field/Crowd Location Confirmation Mode</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Coordinates will remain unconfirmed. If 2 or more corroborating citizen reports exist in this area, your report will automatically link; otherwise it is assigned an Amber badge and queued for field verification before crew dispatch.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-amber-300 uppercase">
                        Approximate Locality / Sector *
                      </label>
                      <input
                        type="text"
                        value={approximateLocality}
                        onChange={(e) => setApproximateLocality(e.target.value)}
                        placeholder="e.g. Sector 14 near Metro, Connaught Place Block B"
                        className="w-full px-3 py-2 bg-surface-1 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-amber-300 uppercase">
                        Observation Time
                      </label>
                      <input
                        type="text"
                        value={observationTime}
                        onChange={(e) => setObservationTime(e.target.value)}
                        placeholder="e.g. Today morning 8:30 AM"
                        className="w-full px-3 py-2 bg-surface-1 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-amber-300 uppercase">
                      Landmark & Road Description
                    </label>
                    <input
                      type="text"
                      value={landmarkNotes}
                      onChange={(e) => setLandmarkNotes(e.target.value)}
                      placeholder="e.g. Opposite the SBI ATM, about 50m before the flyover start"
                      className="w-full px-3 py-2 bg-surface-1 border border-white/10 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Photographic Evidence & Drag-and-Drop SHA-256 Dropzone */}
            <div className="p-5 rounded-card bg-surface-1 card-border flex flex-col gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-civic-blue"></span>
                4. Photographic Proof & Cryptographic Hash
              </span>

              {/* Drag and Drop Zone */}
              {!filePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="relative p-6 rounded-xl border-2 border-dashed border-white/15 hover:border-civic-blue/50 bg-surface-2/40 hover:bg-surface-2/70 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-10 h-10 rounded-full bg-civic-blue/15 text-civic-blue flex items-center justify-center mb-2">
                    {isHashing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-text-primary">
                    {isHashing ? 'Computing cryptographic SHA-256 hash...' : 'Click or Drag & Drop Photo Evidence'}
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">
                    JPG, PNG, or PDF under 15MB. SHA-256 fingerprint generated directly in your browser.
                  </div>
                </div>
              ) : (
                /* File Preview & Hash Badge */
                <div className="p-3.5 rounded-xl bg-surface-2 border border-white/10 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    {filePreview.dataUrl.startsWith('data:image') ? (
                      <img
                        src={filePreview.dataUrl}
                        alt="Evidence Preview"
                        className="w-14 h-14 object-cover rounded-lg border border-white/10 shadow"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-surface-3 flex items-center justify-center text-civic-blue">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-primary truncate max-w-xs">
                        {filePreview.name}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {(filePreview.size / 1024).toFixed(1)} KB • {filePreview.type}
                      </span>
                      <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono text-verified-teal bg-verified-teal/10 px-2 py-0.5 rounded border border-verified-teal/20">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[240px]">
                          SHA-256: {filePreview.sha256}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilePreview(null)}
                    className="text-text-muted hover:text-alert-red text-xs px-2.5 py-1 rounded hover:bg-surface-3 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="text-xs text-risk-red flex items-center gap-1.5 bg-risk-red/10 p-2.5 rounded-lg border border-risk-red/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-alert-red/15 border border-alert-red/30 text-alert-red text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-civic-blue hover:bg-civic-blue-hover text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-civic-blue/25 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Autonomous Triage & Routing...</span>
                </>
              ) : (
                <>
                  <span>Submit Incident Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Sidebar: Live AI Triage Preview */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
          <div className="p-5 rounded-card bg-surface-1 card-border flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-civic-blue" />
                AI Triage Telemetry
              </span>
              <span className="text-[10px] font-mono text-verified-teal bg-verified-teal/10 px-2 py-0.5 rounded border border-verified-teal/20">
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {/* Predicted Priority */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-white/5">
                <span className="text-text-muted">Calculated Priority:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    aiTriage.priority >= 4
                      ? 'bg-alert-red/20 text-alert-red'
                      : aiTriage.priority === 3
                      ? 'bg-sla-amber/20 text-sla-amber'
                      : 'bg-civic-blue/20 text-civic-blue'
                  }`}
                >
                  P{aiTriage.priority} // {aiTriage.priority >= 4 ? 'High Hazard' : 'Routine'}
                </span>
              </div>

              {/* Target Department */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-white/5">
                <span className="text-text-muted">Target Department:</span>
                <span className="font-medium text-text-primary text-right max-w-[140px] truncate">
                  {aiTriage.department}
                </span>
              </div>

              {/* SLA Target */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-white/5">
                <span className="text-text-muted">Expected SLA Window:</span>
                <span className="font-mono text-text-primary font-semibold">
                  {aiTriage.slaHours} Hours
                </span>
              </div>

              {/* Location Mode */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-white/5">
                <span className="text-text-muted">Telemetry Mode:</span>
                <span className="font-mono text-[11px] text-text-secondary">
                  {hasLeftLocation ? (
                    <span className="text-amber-400 font-semibold">UNCONFIRMED LANDMARK</span>
                  ) : (
                    <span className="text-verified-teal font-semibold">PRECISE GPS LOCK</span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-civic-blue/10 border border-civic-blue/20 flex flex-col gap-1.5 text-[11px] text-civic-blue">
              <div className="font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Autonomous Duplicate Shield</span>
              </div>
              <p className="text-text-muted leading-relaxed">
                If an existing incident matches your location within 30m and has semantic similarity, your report will be linked directly to boost priority.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Success Modal Dialog */}
      {submissionResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-surface-1 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-verified-teal/20 text-verified-teal flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Report Successfully Ingested</h3>
                <p className="text-xs text-text-muted">
                  Recorded in municipal ledger with cryptographic audit hash.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-white/5 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Your Report Tracking ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-civic-blue text-sm">
                    {submissionResult.report.tracking_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(submissionResult.report.tracking_id, 'rep')}
                    className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-white"
                  >
                    {copiedId === 'rep' ? <Check className="w-3.5 h-3.5 text-verified-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-muted">Parent Incident ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-white text-sm">
                    {submissionResult.incident_tracking_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(submissionResult.incident_tracking_id, 'inc')}
                    className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-white"
                  >
                    {copiedId === 'inc' ? <Check className="w-3.5 h-3.5 text-verified-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-text-muted">Duplicate Detection Result:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    submissionResult.duplicate_action === 'LINKED'
                      ? 'bg-civic-blue/20 text-civic-blue'
                      : submissionResult.duplicate_action === 'REVIEW'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {submissionResult.duplicate_action === 'LINKED'
                    ? 'LINKED TO EXISTING INCIDENT'
                    : submissionResult.duplicate_action === 'REVIEW'
                    ? 'QUEUED FOR DUPLICATE REVIEW'
                    : 'NEW CANONICAL INCIDENT CREATED'}
                </span>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed italic">
                "{submissionResult.explanation}"
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => api.downloadReportPdf(submissionResult.report.id)}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-verified-teal hover:bg-teal-400 text-night font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF Summary</span>
                </button>
                <Link
                  to={`/app/track/${encodeURIComponent(submissionResult.report.tracking_id)}`}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-civic-blue hover:bg-civic-blue-hover text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Track on Live Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmissionResult(null);
                  setDescription('');
                  setFilePreview(null);
                }}
                className="w-full py-2 px-4 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-white text-xs font-semibold transition-all text-center"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multilingual Voice Intake Modal */}
      <VoiceReportModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApply={handleVoiceApply}
      />
    </div>
  );
};
