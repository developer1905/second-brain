'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Square, SlidersHorizontal, Sparkles, X } from 'lucide-react';

export interface SourceFilterState {
  includeNotes: boolean;
  includeProjects: boolean;
  includeBooks: boolean;
  includeGithub: boolean;
  includeTelegram: boolean;
}

interface SourceFilterPanelProps {
  onFilterChange: (filters: SourceFilterState) => void;
  compact?: boolean;
}

export const SourceFilterPanel: React.FC<SourceFilterPanelProps> = ({
  onFilterChange,
}) => {
  const [filters, setFilters] = useState<SourceFilterState>({
    includeNotes: true,
    includeProjects: true,
    includeBooks: true,
    includeGithub: true,
    includeTelegram: true,
  });

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleFilter = (key: keyof SourceFilterState) => {
    const updated = { ...filters, [key]: !filters[key] };
    setFilters(updated);
    onFilterChange(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('source-filter-change', { detail: updated }));
    }
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div ref={panelRef} className="relative inline-block text-left z-[9999]">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/40 text-sky-300 hover:bg-sky-500/20 text-xs font-bold font-mono transition shadow-glowCyan shrink-0 cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="hidden sm:inline">Manba Ptichkalari (Filter)</span>
        <span className="inline sm:hidden font-mono text-[10px]">Filter</span>
        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[10px] font-bold text-sky-200 border border-sky-500/30">
          {activeCount}/5
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full mt-2 w-80 max-w-[calc(100vw-1rem)] p-4 rounded-2xl glass-panel border-2 border-sky-500/50 shadow-2xl bg-slate-950/98 space-y-3 z-[9999] backdrop-blur-2xl animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              Neyron Manbalar Vizibilligi
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-tight">
            Neyron grafik va qidiruvda kerakli manbalarni ptichka (✓) orqali yoqing yoki vaqtincha yashiring:
          </p>

          <div className="space-y-2 pt-1">
            {/* Notes Checkbox */}
            <button
              type="button"
              onClick={() => toggleFilter('includeNotes')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-xs font-semibold cursor-pointer ${
                filters.includeNotes
                  ? 'bg-sky-500/20 text-sky-200 border-sky-500/40'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {filters.includeNotes ? (
                  <CheckSquare className="w-4 h-4 text-sky-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>🧠 Neyron Qaydlar</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">Qaydlar</span>
            </button>

            {/* Projects Checkbox */}
            <button
              type="button"
              onClick={() => toggleFilter('includeProjects')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-xs font-semibold cursor-pointer ${
                filters.includeProjects
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {filters.includeProjects ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>🎯 Loyihalar (PARA)</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">Loyihalar</span>
            </button>

            {/* Books Checkbox */}
            <button
              type="button"
              onClick={() => toggleFilter('includeBooks')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-xs font-semibold cursor-pointer ${
                filters.includeBooks
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {filters.includeBooks ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>📚 Kitoblar &amp; PDFlar</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">Kitoblar</span>
            </button>

            {/* GitHub Checkbox */}
            <button
              type="button"
              onClick={() => toggleFilter('includeGithub')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-xs font-semibold cursor-pointer ${
                filters.includeGithub
                  ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {filters.includeGithub ? (
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>🌐 GitHub Repozitoriyalar</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">GitHub</span>
            </button>

            {/* Telegram Checkbox */}
            <button
              type="button"
              onClick={() => toggleFilter('includeTelegram')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-xs font-bold cursor-pointer ${
                filters.includeTelegram
                  ? 'bg-sky-500/25 text-sky-200 border-sky-400/50 shadow-glowCyan'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {filters.includeTelegram ? (
                  <CheckSquare className="w-4 h-4 text-sky-400 animate-pulse" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>📱 Telegram (70k Xabar)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-sky-300 font-bold border border-sky-500/30">
                {filters.includeTelegram ? '✓ Ko\'rsatilsin' : '✕ Yashirilgan'}
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold border border-sky-500/40 transition cursor-pointer"
            >
              Tayyor (Yopish)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
