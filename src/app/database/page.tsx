'use client';

import React, { useEffect, useState } from 'react';
import { UrlIngestForm } from '@/components/UrlIngestForm';
import {
  Database,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  Edit3,
  Plus,
  FolderKanban,
  Layers,
  BookMarked,
  Send,
  Github,
  BookOpen,
  FileText,
  Sparkles,
  Download,
  Upload,
  FileUp,
} from 'lucide-react';
import Link from 'next/link';

export default function DatabaseRegistryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showAddUrl, setShowAddUrl] = useState(false);

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph');
      if (res.ok) {
        const data = await res.json();
        setItems(data.nodes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const handleDeleteItem = async (nodeId: string) => {
    const rawId = nodeId.replace(/^(note|project|area|resource|telegram|github|book)-/, '');
    const type = nodeId.split('-')[0];
    if (!confirm("Ushbu yozuvni bazadan o'chirishni tasdiqlaysizmi?")) return;

    try {
      let endpoint = `/api/notes/${rawId}`;
      if (type === 'project') endpoint = `/api/projects/${rawId}`;
      if (type === 'area') endpoint = `/api/areas/${rawId}`;
      if (type === 'resource') endpoint = `/api/resources/${rawId}`;
      if (type === 'telegram') endpoint = `/api/ingest/telegram?id=${rawId}`;
      if (type === 'github') endpoint = `/api/ingest/github?id=${rawId}`;
      if (type === 'book') endpoint = `/api/ingest/books?id=${rawId}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) fetchDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportObsidian = async () => {
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Obsidian_Second_Brain_Vault_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleImportMdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      try {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, content }),
        });
        if (res.ok) {
          alert(`Obsidian "${file.name}" fayli muvaffaqiyatli import qilindi!`);
          fetchDatabase();
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = items.filter((item) => {
    if (filterType !== 'ALL') {
      if (filterType === 'PROJECT' && item.category !== 'PROJECT' && item.sourceType !== 'GITHUB') return false;
      if (filterType === 'AREA' && item.category !== 'AREA') return false;
      if (filterType === 'RESOURCE' && item.category !== 'RESOURCE' && item.sourceType !== 'BOOK' && item.sourceType !== 'TELEGRAM') return false;
      if (filterType === 'TELEGRAM' && item.sourceType !== 'TELEGRAM') return false;
      if (filterType === 'GITHUB' && item.sourceType !== 'GITHUB') return false;
      if (filterType === 'BOOK' && item.sourceType !== 'BOOK') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        (item.details?.summary && item.details.summary.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const getItemLink = (nodeId: string) => {
    const [type, rawId] = nodeId.split('-');
    if (type === 'note') return `/notes/${rawId}`;
    if (type === 'project') return `/projects/${rawId}`;
    if (type === 'area') return `/areas/${rawId}`;
    return `/resources/${rawId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 text-cyan-400 border border-cyan-500/40 shadow-glowCyan">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Markaziy Ma'lumotlar Bazasi (Structured Registry)
            </h1>
            <p className="text-xs text-slate-400">
              Barcha PARA toifalari bo'yicha tartiblangan jadval va to'liq CRUD amallari
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-xs font-bold transition cursor-pointer">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>.md Import</span>
            <input type="file" accept=".md" onChange={handleImportMdFile} className="hidden" />
          </label>

          <button
            onClick={handleExportObsidian}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Obsidian Vault Export</span>
          </button>

          <button
            onClick={() => setShowAddUrl(!showAddUrl)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Miyaga Havola (URL)</span>
          </button>
        </div>
      </div>

      {/* URL Link Ingestion Form Component */}
      {showAddUrl && <UrlIngestForm onSuccess={fetchDatabase} />}

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bazadagi barcha ma'lumotlardan qidirish..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10">
          {[
            { id: 'ALL', label: 'Barchasi' },
            { id: 'PROJECT', label: 'Loyihalar' },
            { id: 'AREA', label: 'Sohalar' },
            { id: 'RESOURCE', label: 'Resurslar' },
            { id: 'TELEGRAM', label: 'Telegram' },
            { id: 'GITHUB', label: 'GitHub' },
            { id: 'BOOK', label: 'Kitoblar' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === t.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glowCyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Database Table View */}
      {loading ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-xs text-cyan-400 font-mono">
          Ma'lumotlar bazasi reestri yuklanmoqda...
        </div>
      ) : (
        <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase font-mono text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Sarlavha & O'tish Havolasi</th>
                  <th className="px-4 py-3">Turkum (PARA)</th>
                  <th className="px-4 py-3">Manba Tur</th>
                  <th className="px-4 py-3">Teglar</th>
                  <th className="px-4 py-3">Tavsif & Xulosa</th>
                  <th className="px-4 py-3 text-right">Amallar (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => {
                  const detailLink = getItemLink(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition group">
                      {/* Title with link */}
                      <td className="px-4 py-3 font-semibold text-white">
                        <Link href={detailLink} className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200">
                          <span className="truncate max-w-xs">{item.label}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 group-hover:text-cyan-400" />
                        </Link>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono border"
                          style={{
                            backgroundColor: `${item.color}20`,
                            color: item.color,
                            borderColor: `${item.color}60`,
                          }}
                        >
                          {item.category}
                        </span>
                      </td>

                      {/* Source Type */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {item.sourceType}
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(item.tags || []).slice(0, 3).map((tag: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-slate-400 border border-white/10">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Summary */}
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate font-mono">
                        {item.details?.summary || '—'}
                      </td>

                      {/* CRUD Actions */}
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link
                          href={detailLink}
                          className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>O'tish</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>O'chirish</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
