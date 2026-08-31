'use client';

import React, { useState } from 'react';
import { Send, Github, BookOpen, Globe, Zap, CheckCircle2, XCircle, Settings, ExternalLink, Puzzle, Play, Wallet } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  status: 'active' | 'inactive' | 'beta';
  category: string;
  href?: string;
  features: string[];
}

const PLUGINS: Plugin[] = [
  {
    id: 'telegram',
    name: 'Telegram Sync',
    description: 'Telegram kanallaringizdagi xabarlarni bilimlar bazasiga avtomatik import qiling',
    icon: Send,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    status: 'active',
    category: 'Import',
    href: '/ingest?tab=telegram',
    features: ['Kanal xabarlarini import', "Media fayllarni qo'llab-quvvatlash", 'Avtomatik kategoriyalash'],
  },
  {
    id: 'github',
    name: 'GitHub Repos',
    description: 'GitHub repozitoriyalaringizni README va metadata bilan sinkronlang',
    icon: Github,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    status: 'active',
    category: 'Import',
    href: '/ingest?tab=github',
    features: ['README ingest', 'Stars va fork hisoblagich', 'Til aniqlash'],
  },
  {
    id: 'books',
    name: 'Kitoblar & Hujjatlar',
    description: "PDF, EPUB va TXT kitoblarni o'qib, iqtiboslarni saqlab qo'ying",
    icon: BookOpen,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    status: 'active',
    category: 'Import',
    href: '/ingest?tab=books',
    features: ['PDF yuklash', 'Iqtibos saqlash', "O'qish progressi"],
  },
  {
    id: 'web-ingest',
    name: 'Web URL Ingest',
    description: "Internetdagi maqolalar va sahifalarni bilimlar bazasiga qo'shing",
    icon: Globe,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    status: 'active',
    category: 'Import',
    href: '/database',
    features: ['URL dan kontent olish', 'Avtomatik tavsif', "Tag qo'shish"],
  },
  {
    id: 'ai-chat',
    name: 'AI Yordamchi',
    description: 'Bilimlar bazangiz asosida savol-javob va tahlil qiling',
    icon: Zap,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    status: 'active',
    category: 'AI',
    href: '/chat',
    features: ['Conversation history', 'Knowledge grounding', 'Gemini API integratsiya'],
  },
  {
    id: 'smart-search',
    name: 'Smart Search',
    description: "Barcha ma'lumotlaringizdan bir vaqtda qidiring va relevanslik bo'yicha saralang",
    icon: Zap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    status: 'active',
    category: 'AI',
    href: '/search',
    features: ['Full-text search', 'Relevanslik scoring', "Kalit so'z highlight"],
  },
  {
    id: 'memory',
    name: 'Memory Library',
    description: 'Muhim faktlar va bilimlarni PIN qilib, keyinroq topib oling',
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    status: 'active',
    category: 'AI',
    href: '/memory',
    features: ['Pin qilish', 'Tag filtrlash', 'Chat dan avtomatik saqlash'],
  },
  {
    id: 'timekeeper',
    name: 'Timekeeper',
    description: 'Cron va bir martalik eslatmalar va takroriy vazifalar rejalashtiring',
    icon: Settings,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    status: 'beta',
    category: 'Automation',
    href: '/schedule',
    features: ["Cron ifoda qo'llab-quvvatlash", 'Preset jadvallar', 'Faol/nofaol toggle'],
  },
  {
    id: 'finance',
    name: 'Kirim-Chiqim (Moliya)',
    description: 'Shaxsiy daromadlar va xarajatlarni boshqarish hamda 3D neyron miyaga ulash',
    icon: Wallet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    status: 'active',
    category: 'Moliya',
    href: '/finance',
    features: ['Kirim va Chiqim hisobi', 'Kategoriyalar tahlili', '3D Neyron Grafik visualizer'],
  },
];

const CATEGORIES = ['Barchasi', 'Import', 'AI', 'Automation', 'Moliya'];
const STATUS_BADGE: Record<string, { label: string; color: string; dot: string }> = {
  active:   { label: 'Faol',    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', dot: 'bg-emerald-400' },
  inactive: { label: 'Nofaol',  color: 'text-slate-400 border-slate-500/20 bg-slate-800/40', dot: 'bg-slate-500' },
  beta:     { label: 'Beta',    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', dot: 'bg-amber-400' },
};

export default function PluginsPage() {
  const [filter, setFilter] = useState('Barchasi');

  const shown = PLUGINS.filter((p) => filter === 'Barchasi' || p.category === filter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-violet-400" />
            Plugin Marketplace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Second Brain imkoniyatlarini kengaytiring</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {PLUGINS.filter((p) => p.status === 'active').length} plugin faol
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${filter === c ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}>
            {c} {c !== 'Barchasi' && `(${PLUGINS.filter(p => p.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Plugin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shown.map((plugin) => {
          const Icon = plugin.icon;
          const badge = STATUS_BADGE[plugin.status];
          return (
            <div key={plugin.id} className={`glass-panel rounded-2xl border p-5 space-y-4 hover:shadow-lg transition group ${plugin.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${plugin.bg} ${plugin.border}`}>
                    <Icon className={`w-5 h-5 ${plugin.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{plugin.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${plugin.status === 'active' ? 'animate-pulse' : ''}`} />
                      {badge.label}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded border border-white/5">{plugin.category}</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{plugin.description}</p>

              <div className="space-y-1">
                {plugin.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${plugin.color}`} />
                    {f}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                {plugin.href ? (
                  <a href={plugin.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${plugin.bg} ${plugin.color} ${plugin.border} hover:opacity-90`}>
                    <Play className="w-3 h-3" /> Ochish
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 text-slate-500 cursor-not-allowed">
                    <XCircle className="w-3 h-3" /> Tez kunda
                  </span>
                )}
                {plugin.href && (
                  <a href={plugin.href} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
