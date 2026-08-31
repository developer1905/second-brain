'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TelegramParser } from '@/components/TelegramParser';
import { GithubSync } from '@/components/GithubSync';
import { BookReader } from '@/components/BookReader';
import { Send, Github, BookOpen, Sparkles } from 'lucide-react';

function IngestContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'telegram';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 text-cyan-400 border border-cyan-500/40 shadow-glowCyan">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Ko'p Manbali Data Ingestion Center
            </h1>
            <p className="text-xs text-slate-400">
              Telegram exports, GitHub repozitoriyalar hamda PDF kitoblarni avtomatik pars va neyron grafik sinxronlash
            </p>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'telegram'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-glowCyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'github'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glowCyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'books'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-glowCyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kitoblar & PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Body View */}
      <div>
        {activeTab === 'telegram' && <TelegramParser />}
        {activeTab === 'github' && <GithubSync />}
        {activeTab === 'books' && <BookReader />}
      </div>
    </div>
  );
}

export default function IngestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-cyan-400 font-mono">Yuklanmoqda...</div>}>
      <IngestContent />
    </Suspense>
  );
}
