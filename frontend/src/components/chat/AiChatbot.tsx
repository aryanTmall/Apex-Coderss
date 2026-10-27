import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Bot,
  User,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { ChatMessage, ChatResponse, ChatStatusResponse } from '../../api/types';

interface AiChatbotProps {
  currentIncidentId?: string;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({ currentIncidentId }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<ChatMessage & { citations?: any[]; actions?: string[] }>>([
    {
      role: 'assistant',
      content:
        'Hello! I am **CivicHelp AI**, your autonomous civic incident intelligence assistant. You can ask me to track an incident, explain why a contractor closure failed, check contractor trust scores, inspect unconfirmed cases, or query live operational metrics.',
      actions: [
        'Check contractor trust scores',
        'Show unconfirmed location reports',
        'List overdue SLA bottlenecks',
        'Check live operational metrics',
        'Show active city hotspots',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatusResponse | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch provider status once on mount
    api.getChatStatus()
      .then(setChatStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const response: ChatResponse = await api.sendChatMessage(text, historyPayload, currentIncidentId);

      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: response.reply,
          citations: response.citations,
          actions: response.suggested_actions,
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `⚠️ Error reaching assistant: ${err.message || 'Service unavailable'}. Please retry.`,
          actions: ['Retry question', 'Check operational metrics'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: any) => {
    if (citation.type === 'incident' && citation.link_id) {
      navigate(`/incidents/${citation.link_id}`);
      setIsOpen(false);
    } else if (citation.type === 'metric') {
      navigate('/dashboard');
      setIsOpen(false);
    } else if (citation.type === 'hotspot') {
      navigate('/intelligence');
      setIsOpen(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation history reset. How can I assist your civic operations today?',
        actions: ['Check operational metrics', 'Show active city hotspots', 'Report an issue'],
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[1000] flex flex-col items-end">
      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[420px] h-[550px] max-h-[80vh] bg-surface-1 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-surface-2/90 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-civic-blue/20 border border-civic-blue/30 flex items-center justify-center text-civic-blue">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-text-primary">CivicHelp AI</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-verified-teal/15 text-verified-teal border border-verified-teal/30">
                    {chatStatus?.active_provider === 'gemini'
                      ? 'Gemini Live'
                      : 'Local RAG Fallback'}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">Smart City Incident Assistant</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[88%]">
                  {m.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-verified-teal/20 text-verified-teal flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm whitespace-pre-wrap relative group ${
                      m.role === 'user'
                        ? 'bg-civic-blue text-white rounded-br-xs'
                        : 'bg-surface-2 text-text-primary border border-white/5 rounded-bl-xs'
                    }`}
                  >
                    {m.content}
                    {m.role === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          setCopiedIdx(idx);
                          setTimeout(() => setCopiedIdx(null), 2000);
                        }}
                        title="Copy answer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 inline-flex align-middle text-text-muted hover:text-white"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-verified-teal" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 ml-7 flex flex-wrap gap-1.5">
                    {m.citations.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleCitationClick(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-3 hover:bg-white/10 text-[10px] text-text-primary border border-white/10 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-civic-blue" />
                        <span>{c.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggested Action Pills */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 ml-7 flex flex-wrap gap-1.5">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleSend(act)}
                        className="px-2.5 py-1 rounded-full bg-surface-2 hover:bg-civic-blue/20 text-[10px] text-text-muted hover:text-civic-blue border border-white/5 hover:border-civic-blue/30 transition-all text-left"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-text-muted text-xs pl-7">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-civic-blue" />
                <span>Evaluating telemetry and operational records...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-surface-2/80 border-t border-white/10 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask CivicHelp (e.g. status of CIV-2026-9841)..."
              className="flex-1 bg-surface-1 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-civic-blue transition-all"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-civic-blue hover:bg-civic-blue/80 disabled:opacity-40 text-white rounded-xl transition-all shrink-0 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group px-4 py-2.5 bg-gradient-to-r from-civic-blue to-blue-600 hover:from-blue-600 hover:to-civic-blue text-white rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.5)] flex items-center gap-2 text-xs font-medium transition-all active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-verified-teal animate-pulse"></span>
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Civic AI Ops</span>

        {/* Unread dot / prompt hint */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-verified-teal rounded-full border-2 border-night"></span>
        )}
      </button>
    </div>
  );
};
