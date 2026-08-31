'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, Search, PlusCircle, Command, Activity, Network, PanelLeftClose, PanelLeftOpen, Calendar, Sliders } from 'lucide-react';
import { SourceFilterPanel, SourceFilterState } from './SourceFilterPanel';

interface HeaderProps {
  onOpenQuickCapture: () => void;
  nodeCount?: number;
  linkCount?: number;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickCapture,
  nodeCount,
  linkCount,
  searchQuery = '',
  onSearchChange,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const router = useRouter();
  const [stats, setStats] = React.useState({ nodes: nodeCount || 0, links: linkCount || 0 });

  const fetchGraphStats = (filters?: SourceFilterState) => {
    let url = '/api/graph';
    if (filters) {
      const params = new URLSearchParams();
      params.set('includeNotes', filters.includeNotes.toString());
      params.set('includeProjects', filters.includeProjects.toString());
      params.set('includeBooks', filters.includeBooks.toString());
      params.set('includeGithub', filters.includeGithub.toString());
      params.set('includeTelegram', filters.includeTelegram.toString());
      url += `?${params.toString()}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.nodes && data.links) {
          setStats({ nodes: data.nodes.length, links: data.links.length });
        }
      })
      .catch(console.error);
  };

  const handleDailyNote = async () => {
    try {
      const res = await fetch('/api/notes/daily');
      if (res.ok) {
        const data = await res.json();
        if (data.dailyNote) {
          router.push(`/notes/${data.dailyNote.id}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchGraphStats();
  }, [nodeCount, linkCount]);
  return (
    <header className="sticky top-0 z-40 w-full h-14 sm:h-16 glass-panel border-b border-white/10 px-2 sm:px-4 md:px-6 flex items-center justify-between gap-2 overflow-visible">
      {/* Brand & Logo + Sidebar Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 border border-white/10 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition"
            title={isSidebarCollapsed ? "Yon oynani ochish" : "Yon oynani berkitish"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-500/40 shadow-glowCyan shrink-0">
          <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs sm:text-base md:text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 truncate">
              SECOND BRAIN AI
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase font-mono tracking-widest hidden md:inline-block">
              P.A.R.A
            </span>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Neyron grafik va qaydlardan qidirish..."
          className="w-full h-9 pl-9 pr-4 text-sm bg-slate-950/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
        />
      </div>

      {/* Right Stats & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* 24/7 Live Active Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold tracking-wide">24/7 LIVE</span>
        </div>

        {/* System Stats Indicators */}
        <div className="hidden xl:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-white/5 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5" title="Faol neyron tugunlar">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tugunlar:</span>
            <span className="text-cyan-400 font-bold">{stats.nodes}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5" title="Sinaptik ulanishlar (Backlinks)">
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>Sinapslar:</span>
            <span className="text-purple-400 font-bold">{stats.links}</span>
          </div>
        </div>

        {/* Source Ptichka Filter Panel */}
        <SourceFilterPanel onFilterChange={fetchGraphStats} />

        {/* Mind Chat Button */}
        <button
          onClick={() => router.push('/mind-analyzer')}
          className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition shrink-0"
          title="Mind Mirror AI Chatbot"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => router.push('/settings')}
          className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-white/10 hover:bg-white/10 transition shrink-0"
          title="Sozlamalar"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
        </button>

        {/* Daily Note Button */}
        <button
          onClick={handleDailyNote}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-medium text-xs transition-all transform active:scale-95 shrink-0"
          title="Bugungi Kunlik Qayd (Daily Note YYYY-MM-DD)"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Kunlik Qayd</span>
        </button>

        {/* Quick Capture Button */}
        <button
          onClick={onOpenQuickCapture}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs shadow-glowCyan transition-all transform active:scale-95 shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Tezkor Qayd</span>
        </button>
      </div>
    </header>
  );
};
