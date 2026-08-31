'use client';

import React, { useState } from 'react';
import { BookOpen, Upload, FileText, CheckCircle2, Bookmark, Sparkles, Quote } from 'lucide-react';

export const BookReader: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('250');
  const [fileType, setFileType] = useState('PDF');
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleBookUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Kitob nomini kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/ingest/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          totalPages,
          fileType,
          summary,
          highlights,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResultMsg(data.message);
      setTitle('');
      setAuthor('');
      setSummary('');
      setHighlights('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-8 rounded-2xl glass-panel border border-orange-500/30 shadow-glowCyan space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Kitoblar & Hujjatlar Ingestion (PDF, EPUB)
          </h3>
          <p className="text-xs text-slate-400">
            Kitoblardan olingan eng muhim iqtiboslar, anotaatsiyalar va boblar xulosalarini "Resurslar"ga biriktirish
          </p>
        </div>
      </div>

      {resultMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{resultMsg}</span>
        </div>
      )}

      <form onSubmit={handleBookUpload} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Kitob Nomi:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="masalan: Clean Code Uzbekcha"
              className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Muallif:</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="masalan: Robert C. Martin"
              className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Fayl Formati:</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-orange-400 font-bold focus:outline-none"
            >
              <option value="PDF">PDF Hujjat</option>
              <option value="EPUB">EPUB Kitob</option>
              <option value="TXT">TXT Matn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Sahifalar Soni:</label>
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Kitob Anotaatsiyasi & Qisqacha Xulosa:</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Asosiy g'oya va kitob mavzusi..."
            className="w-full p-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-orange-500/60"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Asosiy Iqtiboslar & Belgilangan Parchalar (Highlights):</label>
          <textarea
            rows={4}
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder="Har bir iqtibosni yangi qatordan yozing..."
            className="w-full p-3 text-xs font-mono bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-orange-500/60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-glowCyan transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? "Saqlanmoqda..." : "Kitobni Resurslarga Qo'shish"}</span>
        </button>
      </form>
    </div>
  );
};
