import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import {
  MessageSquare,
  Send,
  X,
  RotateCw,
  Phone
} from 'lucide-react';

interface MessagingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const MessagingSimulatorModal: React.FC<MessagingSimulatorModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [phone, setPhone] = useState('+91 98111 22334');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'CivicHelp 24x7 Civic Assistant:\n• Send report description + landmark (e.g. "Pothole near Saket Metro")\n• STATUS <tracking_id> — Check status of your reported issue\n• STOP — Opt-out of SMS alerts',
      time: '10:00 AM'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to UI
    const userMsg: ChatItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: nowTime
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.simulateMessaging(phone, userText, provider);
      const botMsg: ChatItem = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatItem = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'Error processing message: ' + (err.message || 'Service unavailable'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
        {/* Header */}
        <div className={`p-4 flex items-center justify-between text-white ${
          provider === 'WHATSAPP' ? 'bg-[#075E54]' : 'bg-slate-900 border-b border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-lg">
              {provider === 'WHATSAPP' ? '💬' : '📱'}
            </span>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{provider === 'WHATSAPP' ? 'CivicHelp WhatsApp Official' : 'CivicHelp SMS Gateway'}</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">SANDBOX</span>
              </div>
              <div className="text-[11px] text-white/70">
                Simulated Sender: {phone}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-black/20 p-1 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setProvider('WHATSAPP')}
                className={`px-2 py-1 rounded font-bold transition ${
                  provider === 'WHATSAPP' ? 'bg-[#25D366] text-slate-950' : 'text-white/70'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setProvider('SMS')}
                className={`px-2 py-1 rounded font-bold transition ${
                  provider === 'SMS' ? 'bg-cyan-500 text-slate-950' : 'text-white/70'
                }`}
              >
                SMS
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Prompt Buttons */}
        <div className="p-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
          <span className="text-slate-500 font-medium">Quick Prompts:</span>
          <button
            onClick={() => setInputMessage('Pothole near Saket Metro station dangerous for traffic')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Report Pothole
          </button>
          <button
            onClick={() => setInputMessage('STATUS REP-')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Check Status
          </button>
          <button
            onClick={() => setInputMessage('HELP')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Help Menu
          </button>
          <button
            onClick={() => setInputMessage('STOP')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Opt-Out
          </button>
        </div>

        {/* Chat History View */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0B0F19]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md whitespace-pre-wrap leading-relaxed ${
                  m.sender === 'user'
                    ? provider === 'WHATSAPP'
                      ? 'bg-[#005C4B] text-white rounded-br-none'
                      : 'bg-cyan-700 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
              >
                {m.text}
                <div className={`text-[9px] text-right mt-1 ${
                  m.sender === 'user' ? 'text-white/60' : 'text-slate-400'
                }`}>
                  {m.time}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              CivicHelp Bot is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={provider === 'WHATSAPP' ? 'Type a WhatsApp message...' : 'Type an SMS...'}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className={`p-2.5 rounded-xl text-white disabled:opacity-40 transition ${
              provider === 'WHATSAPP' ? 'bg-[#25D366] text-slate-950 font-bold' : 'bg-cyan-600'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
