'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, Send, Sparkles, User, RefreshCw, Compass, Target,
  Flame, Wallet, Bot, ChevronRight, Zap, ShieldCheck
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function MindAnalyzerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `### 👋 Salom! Men **Mind Mirror AI**man.

Men sizning **Second Brain**ingizdagi barcha neyron qaydlar, loyihalar, odatlar, moliya, Telegram fikrlari va kitoblaringizni real-vaqt rejimida tahlil qilib beraman.

**Nimani so'ramoqchisiz?**
- 🧠 *"Mening ruhiy va fikrlash profilimni tahlil qil"*
- 💡 *"Hozirgi asosiy diqqatim nimalarga qaratilgan?"*
- 🎯 *"Imkoniyatlarim va zaif tomonlarim nima?"*
- 🔮 *"Hozirgi holatimdan kelib chiqib 3 oylik reja ber"*\n\nPastdagi tayyor tugmalardan birini bosing yoki o'z savolingizni yozing!`,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try { (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch {}
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    triggerHaptic();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/mind-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      if (data.ok) {
        if (data.stats) setStats(data.stats);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'Server javob bermadi');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Xatolik:** ${err.message || 'AI bilan bog\'lanishda xato yuz berdi. Qayta urining.'}`,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🧠 Meni to\'liq tahlil qil', prompt: 'Mening ikkinchi miyam ma\'lumotlari asosida ruhiy profilim va diqqatimni to\'liq tahlil qilib ber.' },
    { label: '💡 Diqqat markazim qayerda?', prompt: 'Hozirgi qaydlarim va Telegram fikrlarimga ko\'ra mening asosiy diqqatim va xayolim nimalar bilan band?' },
    { label: '🎯 Loyiha va intizomim', prompt: 'Loyihalarim bajarilishi va odatlarim streak-lari holati qanday? Nimani oshirishim kerak?' },
    { label: '🔮 3 oylik rivojlanish rejasi', prompt: 'Mening barcha bilimlarim va moliyaviy holatimdan kelib chiqib, menga amaliy 3 oylik shaxsiy rivojlanish strategiyasini ber.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-5.5rem)] max-w-4xl mx-auto w-full overflow-hidden">
      {/* ── Top Header Banner ── */}
      <div className="shrink-0 flex items-center justify-between gap-2 p-3 bg-slate-950/80 rounded-2xl border border-cyan-500/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 shadow-glowCyan">
            <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold text-white font-mono flex items-center gap-2">
              MIND MIRROR AI
              <span className="px-2 py-0.5 text-[9px] font-sans font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400" /> REAL-TIME
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              O&apos;zingizni va miyangizni Second Brain ma&apos;lumotlari orqali tahlil qiling
            </p>
          </div>
        </div>

        {stats && (
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-300">
            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">🧠 {stats.notesCount} Qayd</span>
            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">🎯 {stats.projectsCount} Loyiha</span>
            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">🔥 {stats.habitsCount} Odat</span>
          </div>
        )}
      </div>

      {/* ── Quick Prompt Chips Bar ── */}
      <div className="shrink-0 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full whitespace-nowrap">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold font-mono transition-all active:scale-95 shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* ── Chat Messages Container ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 glass-panel rounded-2xl border border-white/10 my-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                  : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 animate-pulse" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs md:text-sm space-y-1.5 shadow-xl ${
                msg.sender === 'user'
                  ? 'bg-purple-600/30 text-purple-100 border border-purple-500/30 rounded-tr-none'
                  : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-none font-sans leading-relaxed'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[10px] opacity-60 font-mono border-b border-white/5 pb-1 mb-1">
                <span>{msg.sender === 'user' ? 'Siz' : 'Mind Mirror AI'}</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-cyan-400 text-xs font-mono animate-pulse w-fit">
            <Brain className="w-4 h-4 animate-bounce text-cyan-400" />
            <span>Miyangiz ma&apos;lumotlari tahlil qilinmoqda (Gemini AI)...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Chat Input Controls ── */}
      <div className="shrink-0 flex items-center gap-2 pt-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Miyangiz va o'zingiz haqingizda so'rang..."
          disabled={loading}
          className="flex-1 bg-slate-950/80 border border-white/15 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 transition shadow-inner"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white shadow-glowCyan transition-all active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
