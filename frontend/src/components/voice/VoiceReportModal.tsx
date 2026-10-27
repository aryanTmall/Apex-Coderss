import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { VoiceParseResult } from '../../api/types';
import {
  Mic,
  Square,
  CheckCircle2,
  RotateCw,
  X,
  Sparkles,
  Languages
} from 'lucide-react';

interface VoiceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { category: string; title: string; description: string; location_hint: string }) => void;
}

export const VoiceReportModal: React.FC<VoiceReportModalProps> = ({ isOpen, onClose, onApply }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('auto');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);

  // Quick speech sample presets for 1-click evaluation
  const quickSamples = [
    {
      label: 'Hindi / Hinglish (Gaddha / Pothole)',
      text: 'Yahan Saket Metro station ke paas sadak par bahut bada gaddha hai turant theek karo'
    },
    {
      label: 'English (Streetlight Outage)',
      text: 'Broken streetlight near Central Park gate 4, complete darkness dangerous at night'
    },
    {
      label: 'Hindi / Hinglish (Kachra / Garbage)',
      text: 'Ghazipur market ke paas kachre ka dher laga hai aur naali block ho gayi hai'
    }
  ];

  if (!isOpen) return null;

  const handleStartRecording = () => {
    setError(null);
    setParseResult(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi-IN' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          handleAnalyze(speechResult);
        };

        recognition.onerror = (event: any) => {
          setIsRecording(false);
          setError(`Microphone error: ${event.error}. You can also use quick voice samples below.`);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } catch (err: any) {
        setIsRecording(false);
        setError('Could not initialize speech recognition in this browser. Please use quick voice presets below.');
      }
    } else {
      setError('Web Speech API not supported in this browser. Please use quick speech presets below.');
    }
  };

  const handleAnalyze = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    try {
      setParsing(true);
      setError(null);
      const res = await api.parseVoiceTranscript(textToParse.trim(), language);
      setParseResult(res);
    } catch (err: any) {
      setError(err.message || 'Error parsing spoken transcript with Gemini AI');
    } finally {
      setParsing(false);
    }
  };

  const handleApply = () => {
    if (parseResult) {
      onApply({
        category: parseResult.category,
        title: parseResult.title,
        description: parseResult.description,
        location_hint: parseResult.location_hint
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
            <Mic className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white">
              Multilingual Voice Report Assistant
            </h2>
            <p className="text-xs text-slate-400">
              Speak in Hindi, English, or Hinglish. Gemini AI extracts category, title, and location.
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* Microphone action */}
        <div className="my-6 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
          <button
            onClick={isRecording ? () => setIsRecording(false) : handleStartRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30'
            }`}
          >
            {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <span className="text-xs font-semibold text-slate-300 mt-3">
            {isRecording ? 'Listening... Speak into microphone now' : 'Click microphone to start speaking'}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Supported: Hindi (हिंदी), Hinglish, English
          </span>
        </div>

        {/* Quick Voice Demo Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Or Test with 1-Click Voice Presets:
          </span>
          <div className="space-y-1.5">
            {quickSamples.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(s.text);
                  handleAnalyze(s.text);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition flex items-center justify-between"
              >
                <span>{s.label}</span>
                <span className="text-cyan-400 font-bold text-[11px]">Analyze →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live / Transcribed Text */}
        {transcript && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
              Spoken Transcript:
            </span>
            <p className="text-xs text-slate-200 italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Extracted JSON Card */}
        {parsing && (
          <div className="p-4 text-center text-xs text-cyan-400 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin" />
            Analyzing speech with Gemini AI engine...
          </div>
        )}

        {parseResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 mb-4 space-y-2 text-xs animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                AI Entity Extraction
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                Category: {parseResult.category}
              </span>
            </div>

            <div className="text-white font-semibold">
              {parseResult.title}
            </div>

            {parseResult.location_hint && (
              <div className="text-slate-400">
                <span className="text-slate-500">Location Landmark: </span>
                <span className="text-amber-300 font-medium">{parseResult.location_hint}</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
              <span>Lang: {parseResult.detected_language}</span>
              <span>Urgency: {parseResult.urgency}</span>
              <span>Confidence: {Math.round(parseResult.confidence_score * 100)}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={!parseResult}
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-900/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply to Report Form
          </button>
        </div>
      </div>
    </div>
  );
};
