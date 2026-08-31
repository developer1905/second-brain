'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckSquare, Square, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';

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
  compact = false,
}) => {
  const [filters, setFilters] = useState<SourceFilterState>({
    includeNotes: true,
    includeProjects: true,
    includeBooks: true,
    includeGithub: true,
    includeTelegram: true, // Default true so Telegram nodes appear in large numbers on graph when checked
  });

  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (key: keyof SourceFilterState) => {
    const updated = { ...filters, [key]: !filters[key] };
    setFilters(updated);
    onFilterChange(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('source-filter-change', { detail: updated }));
    }
  };

  return (
    <div className="relative inline-block text-left z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-xs font-bold font-mono transition shadow-glowCyan shrink-0"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="hidden sm:inline">Manba Ptichkalari (Filter)</span>
        <span className="inline sm:hidden font-mono text-[10px]">Filter</span>
        <span className="px-1 py-0.2 rounded bg-sky-500/20 text-[10px] font-bold text-sky-200">
          {Object.values(filters).filter(Boolean).length}/5
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl glass-panel border border-sky-500/40 shadow-2xl bg-slate-950/95 space-y-3 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Neyron Manbalar Vizibilligi
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Ptichka bilan to'g'irlang</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Neyron grafik va qidiruvda kerakli manbalarni ptichka (✓) orqali yoqing yoki vaqtincha yashiring:
          </p>

          <div className="space-y-2 pt-1">
            {/* Notes Checkbox */}
            <button
              onClick={() => toggleFilter('includeNotes')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-slate-200"
            >
              <div className="flex items-center gap-2">
                {filters.includeNotes ? (
                  <CheckSquare className="w-4 h-4 text-sky-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>🧠 Neyron Qaydlar</span>
              </div>
              <span className="text-[10px] font-mono opacity-60">Qaydlar</span>
            </button>

            {/* Projects Checkbox */}
            <button
              onClick={() => toggleFilter('includeProjects')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-slate-200"
            >
              <div className="flex items-center gap-2">
                {filters.includeProjects ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>🎯 Loyihalar (PARA)</span>
              </div>
              <span className="text-[10px] font-mono opacity-60">Loyihalar</span>
            </button>

            {/* Books Checkbox */}
            <button
              onClick={() => toggleFilter('includeBooks')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-slate-200"
            >
              <div className="flex items-center gap-2">
                {filters.includeBooks ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>📚 Kitoblar & PDFlar</span>
              </div>
              <span className="text-[10px] font-mono opacity-60">Kitoblar</span>
            </button>

            {/* GitHub Checkbox */}
            <button
              onClick={() => toggleFilter('includeGithub')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs text-slate-200"
            >
              <div className="flex items-center gap-2">
                {filters.includeGithub ? (
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>🌐 GitHub Repozitoriyalar</span>
              </div>
              <span className="text-[10px] font-mono opacity-60">GitHub</span>
            </button>

            {/* Telegram Checkbox (Toggleable on demand to unbury main notes!) */}
            <button
              onClick={() => toggleFilter('includeTelegram')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-xs font-bold ${
                filters.includeTelegram
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
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
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-sky-300">
                {filters.includeTelegram ? 'Ko\'rsatilsin' : 'Yashirilgan'}
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold"
            >
              Tayyor (Yopish)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
