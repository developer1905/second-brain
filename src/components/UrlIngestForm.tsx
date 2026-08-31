'use client';

import React, { useState } from 'react';
import { Link2, Sparkles, CheckCircle2, ExternalLink, Globe } from 'lucide-react';

interface UrlIngestFormProps {
  onSuccess?: () => void;
}

export const UrlIngestForm: React.FC<UrlIngestFormProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'PROJECT' | 'AREA' | 'RESOURCE'>('RESOURCE');
  const [tags, setTags] = useState('Web,Link,AI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert("Sayt havolasini (URL) kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, category, tags, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResultMsg(data.message);
      setUrl('');
      setTitle('');
      setNotes('');
      setTimeout(() => {
        setResultMsg(null);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-cyan-500/40 shadow-glowCyan space-y-4">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          <Globe className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-base text-white">Miyaga Havola (Web Link) Qo'shish & Pars Qilish</h3>
          <p className="text-xs text-slate-400">Har qanday sayt havolasini 3D neyron tarmoqqa saqlash va [[Backlink]] bog'lash</p>
        </div>
      </div>

      {resultMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resultMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Web Sayt URL Havolasi:</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article..."
            className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Sarlavha (Ixtiyoriy - avto pars qilinadi):</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Havola sarlavhasi..."
              className="w-full h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">PARA Kategoriya:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-cyan-400 font-bold focus:outline-none"
            >
              <option value="RESOURCE">Resurs (Resource)</option>
              <option value="PROJECT">Loyiha (Project)</option>
              <option value="AREA">Soha (Area)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Shaxsiy Izoh & [[Backlink]] Izohlar:</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ushbu sayt haqida izohingiz... Boshqa qaydlarga [[Note Title]] ulash."
            className="w-full p-2.5 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? "Pars va Saqlanmoqda..." : "Havolani Neyron Miyaga Qo'shish"}</span>
        </button>
      </form>
    </div>
  );
};
