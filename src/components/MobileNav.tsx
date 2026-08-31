'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Network,
  FolderKanban,
  BookMarked,
  MessageSquareText,
  PlusCircle,
  Menu,
  X,
  Layers,
  Archive,
  Database,
  Flame,
  HelpCircle,
  Wallet,
  Search,
  Brain,
  Clock,
  Sparkles,
  Puzzle,
  Send,
  Github,
  BookOpen,
  Globe,
  Folder,
  ShieldAlert,
  User,
  Sliders,
} from 'lucide-react';

interface MobileNavProps {
  onOpenQuickCapture: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenQuickCapture }) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { title: 'Grafik', href: '/', icon: Network, color: 'text-cyan-400' },
    { title: 'AI Chatbot', href: '/chat', icon: Brain, color: 'text-cyan-400' },
    { title: 'AI Copilot', href: '/ai-assistant', icon: MessageSquareText, color: 'text-purple-400' },
    { title: 'Sozlamalar', href: '/settings', icon: Sliders, color: 'text-amber-400' },
  ];

  const allSections = [
    {
      group: 'P.A.R.A Metodologiyasi',
      items: [
        { title: '3D Neyron Grafik', href: '/', icon: Network, color: 'text-cyan-400' },
        { title: 'Markaziy Baza (DB)', href: '/database', icon: Database, color: 'text-purple-400' },
        { title: 'Loyihalar (Projects)', href: '/projects', icon: FolderKanban, color: 'text-cyan-400' },
        { title: 'Sohalar (Areas)', href: '/areas', icon: Layers, color: 'text-purple-400' },
        { title: 'Resurslar (Resources)', href: '/resources', icon: BookMarked, color: 'text-amber-400' },
        { title: 'Arxiv (Archive)', href: '/archive', icon: Archive, color: 'text-slate-400' },
      ],
    },
    {
      group: 'AI Imkoniyatlar',
      items: [
        { title: 'Odatlar (Streak)', href: '/habits', icon: Flame, color: 'text-amber-400' },
        { title: 'AI Flashcardlar', href: '/flashcards', icon: HelpCircle, color: 'text-violet-400' },
        { title: 'Kirim-Chiqim Moliya', href: '/finance', icon: Wallet, color: 'text-emerald-400' },
        { title: 'AI Copilot Yordamchi', href: '/ai-assistant', icon: MessageSquareText, color: 'text-cyan-400' },
        { title: '⚡ AI Power Hub (5 Tools)', href: '/ai-tools', icon: Sparkles, color: 'text-pink-400' },
        { title: 'Aql Qidiruv', href: '/search', icon: Search, color: 'text-violet-400' },
        { title: 'Xotira Kutubxonasi', href: '/memory', icon: Brain, color: 'text-purple-400' },
        { title: 'Vaqt Jadvali', href: '/schedule', icon: Clock, color: 'text-amber-400' },
        { title: '🤖 Gemini AI Chatbot', href: '/chat', icon: Brain, color: 'text-cyan-400' },
        { title: '🧠 AI Profil Tahlil', href: '/profile', icon: User, color: 'text-emerald-400' },
        { title: 'Plaginlar', href: '/plugins', icon: Puzzle, color: 'text-rose-400' },
      ],
    },
    {
      group: 'Ingestion Manbalar',
      items: [
        { title: 'Telegram Sync', href: '/ingest?tab=telegram', icon: Send, color: 'text-sky-400' },
        { title: 'GitHub Repolar', href: '/ingest?tab=github', icon: Github, color: 'text-emerald-400' },
        { title: 'Kitoblar', href: '/ingest?tab=books', icon: BookOpen, color: 'text-orange-400' },
        { title: 'Web URL Ingest', href: '/database', icon: Globe, color: 'text-pink-400' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('?')[0]);
  };

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      try { (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch {}
    }
  };

  return (
    <>
      {/* ── Fixed Mobile Bottom Navigation Bar (md:hidden) ────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        {mainTabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={triggerHaptic}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 ${
                active
                  ? 'text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-cyan-400 scale-110' : tab.color}`} />
              <span className="text-[10px] tracking-tight">{tab.title}</span>
            </Link>
          );
        })}

        {/* Floating Quick Capture (+) Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onOpenQuickCapture();
          }}
          className="relative -top-3 p-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-glowCyan border-2 border-slate-950 active:scale-90 transition-all"
          title="Tezkor Qayd Yozish"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {mainTabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={triggerHaptic}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 ${
                active
                  ? 'text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-cyan-400 scale-110' : tab.color}`} />
              <span className="text-[10px] tracking-tight">{tab.title}</span>
            </Link>
          );
        })}

        {/* Menu Drawer Toggle */}
        <button
          onClick={() => {
            triggerHaptic();
            setIsMenuOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
        >
          <Menu className="w-5 h-5 text-purple-400" />
          <span className="text-[10px] tracking-tight">Menyu</span>
        </button>
      </nav>

      {/* ── Slide-Over Mobile Drawer Menu ───────────────────────────────── */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-md transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative z-10 w-full max-h-[85vh] bg-[#090d16] border-t border-cyan-500/30 rounded-t-3xl p-4 overflow-y-auto shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="font-extrabold text-sm text-cyan-300 font-mono tracking-wider">
                  SECOND BRAIN MENU
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sections Grid */}
            <div className="space-y-4">
              {allSections.map((sec) => (
                <div key={sec.group} className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase font-mono text-slate-400 px-1">
                    {sec.group}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            active
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glowCyan'
                              : 'bg-slate-900/60 text-slate-200 border-white/5 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Panel Footer */}
            <div className="pt-2 border-t border-white/10">
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono hover:bg-amber-500/20 transition"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>🛡️ Admin Panelga O'tish</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
