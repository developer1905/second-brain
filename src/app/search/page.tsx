'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, FileText, FolderKanban, Layers, BookMarked, Loader2, ArrowRight, Tag, X } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'note' | 'project' | 'area' | 'resource';
  title: string;
  excerpt: string;
  url: string;
  tags?: string;
  score: number;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  note:     { label: 'Eslatma',  icon: FileText,    color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
  project:  { label: 'Loyiha',   icon: FolderKanban, color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  area:     { label: 'Soha',     icon: Layers,      color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  resource: { label: 'Resurs',   icon: BookMarked,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

const FILTERS = ['all', 'note', 'project', 'area', 'resource'] as const;

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string, type: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type === 'all' ? 'all' : type + 's'}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setTotal(data.total);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val, filter), 400);
  };

  useEffect(() => {
    if (query) doSearch(query, filter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-cyan-500/30 text-cyan-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold">
          <Search className="w-3.5 h-3.5" />
          SMART SEARCH
        </div>
        <h1 className="text-2xl font-extrabold text-white">Bilimlar Bazasini Qidirish</h1>
        <p className="text-sm text-slate-400">Eslatmalar, loyihalar, sohalar va resurslardan bir vaqtda qidiradi</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Kalit so'z kiriting… (masalan: AI, loyiha, kitob)"
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-base outline-none focus:border-cyan-500/50 transition font-mono"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Barchasi' : TYPE_CONFIG[f]?.label}
          </button>
        ))}
        {searched && !loading && (
          <span className="ml-auto text-xs text-slate-500 font-mono">{total} natija topildi</span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => {
            const cfg = TYPE_CONFIG[r.type];
            const Icon = cfg.icon;
            return (
              <Link key={r.id} href={r.url}
                className="block group p-4 rounded-2xl glass-panel border border-white/8 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/5">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] text-slate-500">Relevanslik: {r.score}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate">
                      {highlight(r.title, query)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {highlight(r.excerpt, query)}
                    </p>
                    {r.tags && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {r.tags.split(',').filter(Boolean).slice(0, 4).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/8">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition flex-shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <Search className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400">«<span className="text-white">{query}</span>» bo'yicha hech narsa topilmadi</p>
          <p className="text-xs text-slate-500">Boshqa kalit so'z yoki filterni sinab ko'ring</p>
        </div>
      )}
    </div>
  );
}
