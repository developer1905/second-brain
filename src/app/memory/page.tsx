'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Brain, Pin, PinOff, Plus, Trash2, Tag, Loader2, BookOpen, Search, X, Edit3, Save } from 'lucide-react';

interface MemoryItem {
  id: string;
  title: string;
  content: string;
  tags: string;
  source: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '', isPinned: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/memory');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    if (editId) {
      await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...form }),
      });
    } else {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setForm({ title: '', content: '', tags: '', isPinned: false });
    setShowForm(false);
    setEditId(null);
    setSaving(false);
    load();
  };

  const togglePin = async (item: MemoryItem) => {
    await fetch('/api/memory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isPinned: !item.isPinned }),
    });
    load();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (item: MemoryItem) => {
    setForm({ title: item.title, content: item.content, tags: item.tags, isPinned: item.isPinned });
    setEditId(item.id);
    setShowForm(true);
  };

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    return !q || it.title.toLowerCase().includes(q) || it.content.toLowerCase().includes(q) || it.tags.toLowerCase().includes(q);
  });
  const pinned = filtered.filter((i) => i.isPinned);
  const unpinned = filtered.filter((i) => !i.isPinned);

  const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
    manual: { label: "Qo'lda", color: 'text-slate-400' },
    chat:   { label: 'AI Chat', color: 'text-cyan-400' },
    note:   { label: 'Eslatma', color: 'text-amber-400' },
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Memory Library
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Muhim bilimlar va faktlarni saqlash joyingiz</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', content: '', tags: '', isPinned: false }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Yangi Xotira
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Xotiralarda qidirish…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/40 transition"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-panel rounded-2xl border border-purple-500/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-purple-300">{editId ? 'Xotirani tahrirlash' : "Yangi xotira qo'shish"}</h3>
          <input
            type="text"
            placeholder="Sarlavha *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/40 transition"
          />
          <textarea
            placeholder="Kontent *"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/40 transition resize-none"
          />
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Teglar (vergul bilan): AI, bilim, muhim"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/40 transition"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="accent-purple-500" />
              <span className="text-xs text-slate-300">Pin</span>
            </label>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition">Bekor</button>
            <button onClick={save} disabled={saving || !form.title || !form.content} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-bold hover:bg-purple-400 disabled:opacity-40 transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Saqlash
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-14 h-14 text-slate-600 mx-auto" />
          <p className="text-slate-400">Memory library bo'sh</p>
          <p className="text-xs text-slate-500">Muhim bilimlarni AI chat yoki qo'lda qo'shishingiz mumkin</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">Pinlangan</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinned.map((item) => <MemCard key={item.id} item={item} onPin={togglePin} onDelete={deleteItem} onEdit={startEdit} sourceBadge={SOURCE_BADGE} />)}
              </div>
            </section>
          )}
          {unpinned.length > 0 && (
            <section>
              {pinned.length > 0 && <div className="flex items-center gap-2 mb-3 mt-4"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Barchasi</span></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unpinned.map((item) => <MemCard key={item.id} item={item} onPin={togglePin} onDelete={deleteItem} onEdit={startEdit} sourceBadge={SOURCE_BADGE} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function MemCard({ item, onPin, onDelete, onEdit, sourceBadge }: {
  item: MemoryItem;
  onPin: (i: MemoryItem) => void;
  onDelete: (id: string) => void;
  onEdit: (i: MemoryItem) => void;
  sourceBadge: Record<string, { label: string; color: string }>;
}) {
  const badge = sourceBadge[item.source] ?? { label: item.source, color: 'text-slate-400' };
  return (
    <div className={`group glass-panel rounded-xl border p-4 space-y-2 transition hover:shadow-lg ${item.isPinned ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-white/8 hover:border-purple-500/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-white leading-snug flex-1">{item.title}</h3>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onPin(item)} className="p-1 rounded hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition" title={item.isPinned ? 'Pin olib tashlash' : 'Pinlash'}>
            {item.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(item)} className="p-1 rounded hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{item.content}</p>
      {item.tags && (
        <div className="flex flex-wrap gap-1">
          {item.tags.split(',').filter(Boolean).map((t, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/8">{t.trim()}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className={`text-[10px] font-mono ${badge.color}`}>{badge.label}</span>
        <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString('uz-UZ')}</span>
      </div>
    </div>
  );
}
