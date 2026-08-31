'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Network,
  FolderKanban,
  Layers,
  BookMarked,
  Archive,
  Send,
  Github,
  BookOpen,
  Mic,
  Zap,
  ChevronRight,
  Database,
  Globe,
  MessageSquareText,
  Search,
  Brain,
  Clock,
  Sparkles,
  Puzzle,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
  Flame,
  HelpCircle,
  Folder,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();

  const navItems = [
    { title: 'Neyron Grafik', href: '/', icon: Network, color: 'text-cyan-400', bg: 'bg-cyan-500/10', badge: '3D' },
    { title: 'Markaziy Baza', href: '/database', icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10', badge: 'DB' },
    { title: 'Loyihalar', href: '/projects', icon: FolderKanban, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'Sohalar', href: '/areas', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Resurslar', href: '/resources', icon: BookMarked, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Arxiv', href: '/archive', icon: Archive, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ];

  const aiItems = [
    { title: 'Odatlar (Streak)', href: '/habits', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'NEW' },
    { title: 'AI Flashcardlar', href: '/flashcards', icon: HelpCircle, color: 'text-violet-400', bg: 'bg-violet-500/10', badge: 'NEW' },
    { title: 'Kirim-Chiqim', href: '/finance', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', badge: 'MOLIYA' },
    { title: 'AI Yordamchi (Copilot)', href: '/ai-assistant', icon: MessageSquareText, color: 'text-cyan-400', bg: 'bg-cyan-500/10', badge: 'AI BOT' },
    { title: 'AI Power Hub', href: '/ai-tools', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-500/10', badge: 'HUB' },
    { title: 'Smart Search', href: '/search', icon: Search, color: 'text-violet-400', bg: 'bg-violet-500/10', badge: 'NEW' },
    { title: 'Memory Library', href: '/memory', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', badge: 'NEW' },
    { title: 'Timekeeper', href: '/schedule', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'NEW' },
    { title: 'Plugins', href: '/plugins', icon: Puzzle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  const ingestItems = [
    { title: 'Telegram Sync', href: '/ingest?tab=telegram', icon: Send, color: 'text-sky-400' },
    { title: 'GitHub Repolar', href: '/ingest?tab=github', icon: Github, color: 'text-emerald-400' },
    { title: 'Kitoblar', href: '/ingest?tab=books', icon: BookOpen, color: 'text-orange-400' },
    { title: 'Web URL Ingest', href: '/database', icon: Globe, color: 'text-pink-400' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('?')[0]);
  };

  return (
    <aside
      className={`hidden md:flex h-[calc(100vh-4rem)] glass-panel border-r border-white/10 flex-col justify-between shrink-0 transition-all duration-300 ${
        isCollapsed ? 'w-16 p-2' : 'w-64 p-4'
      } overflow-y-auto`}
    >
      <div className="space-y-5">
        {/* Toggle Button Top */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!isCollapsed && (
            <span className="text-[11px] font-extrabold text-cyan-400 tracking-wider font-mono uppercase">
              Navigatsiya
            </span>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-white/10 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
              title={isCollapsed ? 'Yon oynani ochish' : 'Yon oynani berkitish'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* P.A.R.A */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">P.A.R.A</span>
            </div>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-medium transition-all group ${
                    active
                      ? `${item.bg} ${item.color} border border-white/10 shadow-lg`
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.color} transition-transform group-hover:scale-110`} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                  {!isCollapsed && active && !item.badge && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI Features */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2 mb-2">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">AI Features</span>
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] bg-violet-500/20 text-violet-400 border border-violet-500/30 font-mono font-bold">
                5 yangi
              </span>
            </div>
          )}
          <nav className="space-y-0.5">
            {aiItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-medium transition-all group ${
                    active
                      ? `${item.bg} ${item.color} border border-white/10 shadow-lg`
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.color} transition-transform group-hover:scale-110`} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-400 font-mono font-bold border border-violet-500/30">
                      {item.badge}
                    </span>
                  )}
                  {!isCollapsed && active && !item.badge && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Data Ingestion */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2 mb-2">
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Data Ingestion</span>
            </div>
          )}
          <nav className="space-y-0.5">
            {ingestItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2'
                  } rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all group`}
                >
                  <Icon className={`w-4 h-4 ${item.color} transition-transform group-hover:scale-110`} />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Obsidian Vault Folder Tree Explorer */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2 mb-2">
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Obsidian Vault Tree</span>
            </div>
          )}
          <nav className="space-y-0.5">
            {[
              { title: 'projects/', href: '/projects', color: 'text-cyan-400' },
              { title: 'areas/', href: '/areas', color: 'text-purple-400' },
              { title: 'resources/', href: '/resources', color: 'text-amber-400' },
              { title: 'archive/', href: '/archive', color: 'text-slate-400' },
              { title: 'finance/', href: '/finance', color: 'text-emerald-400' },
            ].map((f) => (
              <Link
                key={f.href}
                href={f.href}
                title={isCollapsed ? f.title : undefined}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center py-2' : 'gap-2.5 px-3 py-1.5'
                } rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all group`}
              >
                <Folder className={`w-3.5 h-3.5 ${f.color} transition-transform group-hover:scale-110`} />
                {!isCollapsed && <span>{f.title}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* Color Guide */}
        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono block mb-1">Ranglar</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { label: 'Loyihalar', color: 'bg-cyan-400 text-cyan-400' },
                { label: 'Sohalar', color: 'bg-purple-400 text-purple-400' },
                { label: 'Resurslar', color: 'bg-amber-400 text-amber-400' },
                { label: 'Telegram', color: 'bg-sky-400 text-sky-400' },
                { label: 'GitHub', color: 'bg-emerald-400 text-emerald-400' },
                { label: 'AI', color: 'bg-violet-400 text-violet-400' },
              ].map((c) => (
                <div key={c.label} className={`flex items-center gap-1.5 ${c.color.split(' ')[1]}`}>
                  <span className={`w-2 h-2 rounded-full ${c.color.split(' ')[0]}`} />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Panel Link */}
      <div className={`pt-3 border-t border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <Link
          href="/admin"
          title={isCollapsed ? 'Admin Panel' : undefined}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          } rounded-xl text-xs font-bold font-mono text-amber-400 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/40 transition group w-full`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {!isCollapsed && <span>🛡️ Admin Panel</span>}
        </Link>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-400">Second Brain AI • O&apos;zbek Tili</p>
          <p className="text-[9px] text-slate-600 mt-0.5">+5 AI Features Added</p>
        </div>
      )}
    </aside>
  );
};
