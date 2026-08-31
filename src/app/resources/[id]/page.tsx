'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, ArrowLeft, ExternalLink, Edit, Trash2, Tag, Calendar, Sparkles } from 'lucide-react';

export default function ResourceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const resourceId = params.id;

  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const fetchResource = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}`);
      if (res.ok) {
        const data = await res.json();
        setResource(data);
        setEditTitle(data.title);
        setEditSummary(data.summary);
        setEditUrl(data.url || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, summary: editSummary, url: editUrl }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchResource();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResource = async () => {
    if (!confirm("Ushbu resursni o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/resources/${resourceId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/resources');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-xs text-amber-400 font-mono">
        Resurs ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-red-400 space-y-3">
        <h3 className="text-base font-bold">Resurs topilmadi</h3>
        <button onClick={() => router.push('/resources')} className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold">
          Resurslarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/10">
        <button
          onClick={() => router.push('/resources')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Resurslar Kutubxonasiga Qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Tahrirlash</span>
          </button>

          <button
            onClick={handleDeleteResource}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>O'chirish</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <form onSubmit={handleUpdateResource} className="p-6 rounded-2xl glass-panel border border-amber-500/50 space-y-4">
          <h3 className="text-xs font-bold text-amber-400 uppercase font-mono">Resursni Tahrirlash</h3>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
          />
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
          />
          <textarea
            rows={4}
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            className="w-full p-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-slate-400">Bekor qilish</button>
            <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold">Saqlash</button>
          </div>
        </form>
      )}

      {/* Main Resource Card */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel border border-amber-500/30 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-glowGold">
              <BookMarked className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-mono font-bold">{resource.type} RESOURCE</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{resource.title}</h1>
            </div>
          </div>

          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition"
            >
              <span>Saytga O'tish</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-white/10">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase">Anotaatsiya va Xulosa:</h3>
          <p className="text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">{resource.summary}</p>
        </div>

        {resource.content && (
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase">To'liq Kontent:</h3>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
              {resource.content}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
          {resource.tags.split(',').map((tag: string, idx: number) => (
            <span key={idx} className="px-2 py-1 rounded-lg text-xs bg-white/5 text-slate-300 border border-white/10">
              #{tag.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
