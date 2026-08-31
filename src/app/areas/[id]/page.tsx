'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ArrowLeft, FolderKanban, FileText, Edit, Trash2, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const areaId = params.id;

  const [area, setArea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMetric, setEditMetric] = useState('');

  const fetchArea = useCallback(async () => {
    if (!areaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/areas/${areaId}`);
      if (res.ok) {
        const data = await res.json();
        setArea(data);
        setEditName(data.name);
        setEditDesc(data.description);
        setEditMetric(data.metric || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    fetchArea();
  }, [fetchArea]);

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/areas/${areaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc, metric: editMetric }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchArea();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArea = async () => {
    if (!confirm("Ushbu hayotiy sohani o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/areas/${areaId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/areas');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-xs text-purple-400 font-mono">
        Soha ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  if (!area) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-red-400 space-y-3">
        <h3 className="text-base font-bold">Soha topilmadi</h3>
        <button onClick={() => router.push('/areas')} className="px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold">
          Sohalarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/10">
        <button
          onClick={() => router.push('/areas')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sohalar Ro'yxatiga Qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold hover:bg-purple-500/30 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Tahrirlash</span>
          </button>

          <button
            onClick={handleDeleteArea}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>O'chirish</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <form onSubmit={handleUpdateArea} className="p-6 rounded-2xl glass-panel border border-purple-500/50 space-y-4">
          <h3 className="text-xs font-bold text-purple-400 uppercase font-mono">Sohani Tahrirlash</h3>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
          />
          <input
            type="text"
            value={editMetric}
            onChange={(e) => setEditMetric(e.target.value)}
            placeholder="Metric e.g. 5/5 Loyihalar"
            className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
          />
          <textarea
            rows={3}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full p-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-slate-400">Bekor qilish</button>
            <button type="submit" className="px-4 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-bold">Saqlash</button>
          </div>
        </form>
      )}

      {/* Main Area Banner */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel border border-purple-500/30 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-glowViolet">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">AREA OF RESPONSIBILITY</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{area.name}</h1>
            {area.metric && <span className="text-xs text-cyan-400 font-mono block mt-1">{area.metric}</span>}
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{area.description}</p>
      </div>

      {/* Child Projects Grid */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-cyan-400" />
          Ushbu Sohadagi Loyihalar ({area.projects?.length || 0})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(area.projects || []).map((p: any) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="p-4 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 space-y-2 block transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{p.name}</span>
                <span className="text-xs text-cyan-400 font-mono">{p.progress}%</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
