'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Brain,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Session {
  sessionId: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Voice Chat States
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // 1. Initialize Web Speech Recognition (Uzbek Language)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'uz-UZ';

        rec.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInput(transcript);
        };

        rec.onerror = (event: any) => {
          console.warn('Voice recognition error:', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // 2. Text-to-Speech Helper (Speak Uzbek / English)
  const speakText = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*#_`~>-]/g, ' ')
      .replace(/\n+/g, '. ')
      .slice(0, 400);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'uz-UZ';

    utterance.onstart = () => msgId && setSpeakingId(msgId);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  // 3. Toggle Voice Listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Brauzeringizda ovozli kiritish qo'llab-quvvatlanmaydi (Chrome yoki Edge brauzeridan foydalaning).");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setInput('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const res = await fetch('/api/chat');
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
    setLoadingSessions(false);
  }, []);

  const loadMessages = useCallback(async (sid: string) => {
    const res = await fetch(`/api/chat?sessionId=${sid}`);
    if (res.ok) setMessages(await res.json());
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (sessionId) loadMessages(sessionId);
    else setMessages([]);
  }, [sessionId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newSession = () => {
    stopSpeaking();
    const id = crypto.randomUUID();
    setSessionId(id);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    let sid = sessionId;
    if (!sid) {
      sid = crypto.randomUUID();
      setSessionId(sid);
    }

    const optimistic: ChatMessage = {
      id: 'opt-' + Date.now(),
      sessionId: sid,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, content: text, history: historyPayload }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg = data.message;
        setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), optimistic, assistantMsg]);
        loadSessions();

        if (autoSpeak && assistantMsg?.content) {
          speakText(assistantMsg.content, assistantMsg.id);
        }
      }
    } catch (e) {
      console.error('Send message error:', e);
    }
    setLoading(false);
  };

  const deleteSession = async (sid: string) => {
    await fetch(`/api/chat?sessionId=${sid}`, { method: 'DELETE' });
    if (sid === sessionId) {
      setSessionId('');
      setMessages([]);
    }
    loadSessions();
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const suggestions = [
    "Salom, sen kimsan va nima qila olasan?",
    "Mening loyihalarim va eslatmalarim haqida ayt",
    "Bugungi diqqat markazim qaysi loyihada?",
    "Menga o'zbek tilida maslahat ber",
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4" style={{ height: 'calc(100vh - 112px)', minHeight: '600px' }}>
      {/* ── Sessions Sidebar ────────────────────────────────── */}
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-col glass-panel rounded-2xl border border-white/10 overflow-hidden max-h-48 md:max-h-none">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            💬 Gemini Chatlar
          </span>
          <button
            type="button"
            onClick={newSession}
            className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition border border-cyan-500/30"
            title="Yangi suhbat"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Hali suhbat yo'q</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.sessionId}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition text-xs ${
                  s.sessionId === sessionId
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
                onClick={() => setSessionId(s.sessionId)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                  <span className="truncate">{s.content.slice(0, 26)}…</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.sessionId);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Gemini Chat Panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-cyan-500/30 overflow-hidden min-w-0 shadow-2xl bg-slate-950/80">
        {/* Header with Voice Mode Controls */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-2 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 shadow-glowCyan">
              <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
                GEMINI VOICE AI
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-sans">
                  O'zbekcha Ovozli
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Xuddi Gemini kabi erkin suhbatlashing va ovozli tinglang
              </p>
            </div>
          </div>

          {/* Voice Mode Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition border ${
                autoSpeak
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-glowPurple'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
              title="AI javoblarini avtomatik ovozda o'qish"
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Ovozli Rejim ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ovoz OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/30 shadow-2xl">
                <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-center space-y-1 max-w-md">
                <h2 className="text-xl font-extrabold text-white tracking-wide">
                  Gemini Voice AI bilan Gaplashing
                </h2>
                <p className="text-xs text-slate-400">
                  Ovozli tugmani (🎙️) bosib O'zbek tilida gapiring yoki matn yozing. AI ma'lumotlar bazangiz asosida erkin muloqot qiladi!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                    className="px-3.5 py-2.5 rounded-2xl text-xs text-left text-slate-200 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 hover:text-cyan-300 transition shadow-sm font-medium"
                  >
                    💬 &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`group max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] text-cyan-300 font-mono font-bold">
                        Second Brain Gemini AI
                      </span>
                    </div>

                    {/* Audio Playback Button */}
                    <button
                      type="button"
                      onClick={() =>
                        speakingId === msg.id ? stopSpeaking() : speakText(msg.content, msg.id)
                      }
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono transition ${
                        speakingId === msg.id
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 animate-pulse'
                          : 'bg-white/5 text-slate-400 hover:text-purple-300 hover:bg-white/10'
                      }`}
                    >
                      {speakingId === msg.id ? (
                        <>
                          <Radio className="w-3 h-3 text-purple-400 animate-spin" />
                          <span>Gapirmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-slate-400" />
                          <span>Tinglash</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div
                  className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-white border border-cyan-500/40 rounded-tr-xs shadow-glowCyan'
                      : 'bg-slate-900/90 text-slate-100 border border-white/10 rounded-tl-xs shadow-xl'
                  }`}
                >
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => copyText(msg.content, msg.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-cyan-300 transition"
                      title="Nusxalash"
                    >
                      {copied === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                  {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-glowCyan">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-cyan-300 font-mono">
                  Gemini AI o'ylamoqda va javob tayyorlamoqda…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar with Microphone Voice Button */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-white/10 bg-slate-900/80">
          <div
            className={`flex items-end gap-2 p-2.5 sm:p-3 rounded-2xl border transition ${
              isListening
                ? 'bg-purple-950/40 border-purple-500/60 shadow-glowPurple'
                : 'bg-slate-950/80 border-white/10 focus-within:border-cyan-500/50'
            }`}
          >
            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-purple-600 text-white animate-bounce shadow-glowPurple'
                  : 'bg-white/5 text-slate-400 hover:text-cyan-300 hover:bg-white/10'
              }`}
              title={isListening ? "Ovozli kiritishni to'xtatish" : "O'zbek tilida ovozli gapirish (Mikrofon)"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                isListening
                  ? "🎙️ O'zbek tilida gapiring (eshitilmoqda)..."
                  : "Gemini AI bilan erkin muloqot qiling… (Enter — yuborish)"
              }
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 resize-none outline-none min-h-[36px] max-h-32 font-medium"
              rows={1}
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1 font-mono">
            <span>Shift+Enter — yangi satr • Enter — yuborish</span>
            {isListening && (
              <span className="text-purple-400 font-bold animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                O'zbekcha Ovoz Eshitilmoqda...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
