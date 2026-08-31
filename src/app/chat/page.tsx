'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Brain, Send, Plus, Trash2, MessageSquare, Loader2, Sparkles, BookOpen, Copy, Check } from 'lucide-react';

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    if (sessionId) loadMessages(sessionId);
    else setMessages([]);
  }, [sessionId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newSession = () => {
    const id = crypto.randomUUID();
    setSessionId(id);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    let sid = sessionId;
    if (!sid) { sid = crypto.randomUUID(); setSessionId(sid); }

    const optimistic: ChatMessage = {
      id: 'opt-' + Date.now(),
      sessionId: sid,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), optimistic, data.message]);
        loadSessions();
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const deleteSession = async (sid: string) => {
    await fetch(`/api/chat?sessionId=${sid}`, { method: 'DELETE' });
    if (sid === sessionId) { setSessionId(''); setMessages([]); }
    loadSessions();
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const suggestions = [
    "Loyihalarimni ko\u2019rsat",
    "So\u2019nggi eslatmalarim qanday?",
    "Sohalarim haqida ma\u2019lumot ber",
    "Bilimlar bazam qanday holda?",
  ];

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 112px)', minHeight: '600px' }}>

      {/* ── Sessions Sidebar ────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Suhbatlar</span>
          <button
            onClick={newSession}
            className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition"
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
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition text-xs ${
                  s.sessionId === sessionId
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => setSessionId(s.sessionId)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{s.content.slice(0, 28)}…</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.sessionId); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Chat Main ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl border border-white/10 overflow-hidden min-w-0">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-mono">AI YORDAMCHI</h1>
            <p className="text-[11px] text-slate-400">Bilimlar bazasi asosida javob beradi</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Sparkles className="w-10 h-10 text-cyan-400" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white mb-1">Second Brain AI</h2>
                <p className="text-sm text-slate-400">Bilimlar bazangiz haqida savol bering</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="px-3 py-2 rounded-xl text-xs text-left text-slate-300 bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:text-cyan-300 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group max-w-[75%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] text-slate-400 font-mono">Second Brain AI</span>
                  </div>
                )}
                <div
                  className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/20 text-white border border-cyan-500/30 rounded-tr-sm'
                      : 'bg-slate-800/80 text-slate-100 border border-white/10 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyText(msg.content, msg.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-cyan-400 transition"
                    >
                      {copied === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 border border-white/10">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400">Javob tayyorlanmoqda…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <div className="flex items-end gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/10 focus-within:border-cyan-500/50 transition">
            <BookOpen className="w-4 h-4 text-slate-500 mb-1 flex-shrink-0" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Bilimlar bazangiz haqida savol bering… (Enter — yuborish)"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none min-h-[36px] max-h-32"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Shift+Enter — yangi satr • Enter — yuborish
          </p>
        </div>
      </div>
    </div>
  );
}
