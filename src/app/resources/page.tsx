'use client';

import React, { useEffect, useState } from 'react';
import { BookMarked, Search, Filter, Send, Github, BookOpen, ExternalLink, Code2, Tag, FileText, Plus, X, Sparkles } from 'lucide-react';
import { ResourceItem } from '@/lib/types';

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New resource form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('ARTICLE');
  const [newUrl, setNewUrl] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources');
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) {
      alert("Sarlavha va tavsif kiritilishi shart!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          url: newUrl.trim() || null,
          summary: newSummary.trim(),
          content: newContent.trim() || null,
          tags: newTags.trim() || 'Resurs',
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTitle('');
        setNewUrl('');
        setNewSummary('');
        setNewContent('');
        setNewTags('');
        fetchResources();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const countByType = (type: string) => {
    if (type === 'ALL') return resources.length;
    return resources.filter((r) => r.type === type).length;
  };

  const filteredResources = resources.filter((r) => {
    if (selectedType !== 'ALL' && r.type !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        (r.tags && r.tags.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-glowGold">
            <BookMarked className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Resurslar Kutubxonasi (Resources)
            </h1>
            <p className="text-xs text-slate-400">
              Kitoblar, Telegram postlar, GitHub repozitoriyalar, maqolalar va tadqiqot materiallari
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-glowGold transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yangi Resurs Qo'shish</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Resurslardan qidirish..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Type Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/10">
          {[
            { id: 'ALL', label: `Barchasi (${countByType('ALL')})` },
            { id: 'BOOK', label: `Kitoblar (${countByType('BOOK')})` },
            { id: 'TELEGRAM', label: `Telegram (${countByType('TELEGRAM')})` },
            { id: 'GITHUB', label: `GitHub (${countByType('GITHUB')})` },
            { id: 'ARTICLE', label: `Maqolalar (${countByType('ARTICLE')})` },
            { id: 'SNIPPET', label: `Kod Parchalari (${countByType('SNIPPET')})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedType === t.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glowGold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-xs text-amber-400 font-mono">
          Resurslar kutubxonasi yuklanmoqda...
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-xs text-slate-500 font-mono">
          Ushbu toifa bo'yicha resurslar topilmadi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl glass-panel glass-panel-hover border border-amber-500/20 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {r.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('uz-UZ') : ''}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white mb-2 leading-snug">{r.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{r.summary}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {(r.tags || '').split(',').map((tag, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-slate-400 border border-white/10">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>

                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>O'tish</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-amber-500/40 shadow-glowGold space-y-4 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-base border-b border-white/10 pb-3">
              <Sparkles className="w-5 h-5" />
              <span>Yangi Resurs Qo'shish</span>
            </div>

            <form onSubmit={handleAddResource} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Sarlavha *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Masalan: LangChain.js Rasmiy Qo'llanmasi"
                  className="w-full h-9 px-3 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Turkum</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="ARTICLE">Maqola / Qo'llanma</option>
                    <option value="BOOK">Kitob / PDF</option>
                    <option value="GITHUB">GitHub Repozitoriya</option>
                    <option value="TELEGRAM">Telegram Post</option>
                    <option value="SNIPPET">Kod Parchasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">URL Havola</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Qisqacha Tavsif (Summary) *</label>
                <textarea
                  rows={2}
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Resurs haqida asosiy fikrlar va anotaatsiya..."
                  className="w-full p-2.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Teglar (Vergul bilan)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="AI,LangChain,JavaScript"
                  className="w-full h-9 px-3 text-xs bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-glowGold transition"
                >
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
