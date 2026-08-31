'use client';

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  Bot,
  User,
  BookOpen,
  FolderKanban,
  MessageSquare,
  FileText,
  ExternalLink,
  Zap,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: any;
  timestamp: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Salom! Men sizning **Second Brain AI** neyron yordamchingizman. 70,000+ Telegram xabarlaringiz, P.A.R.A qaydlaringiz, kitoblaringiz va loyihalaringizdan istalgan narsani so'rang!",
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "🤖 Grok 3 va AI modellari haqida qanday postlarim bor?",
    "🎯 Hozirgi loyihalarim statusi va vazifalari qanday?",
    "📚 Kutubxonamda Clean Code va unumdorlik kitoblari",
    "💬 Telegram Saqlanganlarimdan muhim havolalar",
  ];

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer,
          sources: data.sources,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-cyan-500/30 shadow-glowCyan">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Brain className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Neural AI Brain Copilot
              <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-mono font-bold">
                70k+ Context Aware
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Ikkinchi miyangizdagi barcha qaydlar, Telegram manbalari va loyihalardan sintetik bilim olish
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/60 p-2 rounded-xl border border-white/10">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">Kontekst: 70,482 xabar + 13 qayd</span>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendQuery(q)}
            className="p-3 text-left rounded-xl glass-panel border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-xs text-slate-300 font-semibold transition flex items-center justify-between group"
          >
            <span>{q}</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
          </button>
        ))}
      </div>

      {/* Main Conversation Stream */}
      <div className="rounded-2xl glass-panel border border-white/10 p-6 space-y-4 min-h-[450px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-purple-200 border border-purple-500/30'
                }`}
              >
                {m.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-2xl p-4 rounded-2xl space-y-3 ${
                  m.sender === 'user'
                    ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-500/30 rounded-tr-none'
                    : 'bg-slate-900/80 text-slate-100 border border-white/10 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono opacity-60 border-b border-white/5 pb-1">
                  <span className="font-bold">{m.sender === 'user' ? 'Siz' : 'Neural AI Copilot'}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {m.text}
                </div>

                {/* Sources Badges & Links */}
                {m.sources && (
                  <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block">
                      📌 Topilgan Manbalar & Sinapslar:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.notes?.map((n: any) => (
                        <Link
                          key={n.id}
                          href={`/notes/${n.id}`}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-[11px] font-mono flex items-center gap-1 transition"
                        >
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span className="truncate max-w-[150px]">{n.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}

                      {m.sources.projects?.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/projects`}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 text-[11px] font-mono flex items-center gap-1 transition"
                        >
                          <FolderKanban className="w-3 h-3 text-purple-400" />
                          <span className="truncate max-w-[150px]">{p.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}

                      {m.sources.books?.map((b: any) => (
                        <Link
                          key={b.id}
                          href={`/resources`}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-[11px] font-mono flex items-center gap-1 transition"
                        >
                          <BookOpen className="w-3 h-3 text-amber-400" />
                          <span className="truncate max-w-[150px]">{b.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-cyan-400 font-mono p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Neyron tarmoq va 70,000+ manbalar tahlil qilinmoqda...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="pt-4 border-t border-white/10 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Miyangizdan istalgan narsani so'rang (Masalan: Llama 3, Grok, loyihalarim...)"
            className="flex-1 h-11 px-4 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="px-5 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95 disabled:opacity-40 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>So'rash</span>
          </button>
        </form>
      </div>
    </div>
  );
}
