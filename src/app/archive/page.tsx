'use client';

import React, { useEffect, useState } from 'react';
import { Archive, RotateCcw, Trash2, FolderKanban, FileText, CheckCircle2 } from 'lucide-react';
import { NoteItem, ProjectItem } from '@/lib/types';

export default function ArchivePage() {
  const [archivedNotes, setArchivedNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notes?category=ARCHIVE');
      if (res.ok) {
        const data = await res.json();
        setArchivedNotes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchived();
  }, []);

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paraCategory: 'RESOURCE', isArchived: false }),
      });
      if (res.ok) fetchArchived();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-500/20 text-slate-400 border border-slate-500/40">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Arxiv (Archive)
            </h1>
            <p className="text-xs text-slate-400">
              Bajarilgan loyihalar va nofaol materiallar. Neyron grafikda nursiz holatda saqlanadi
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-xs text-slate-400 font-mono">
          Arxiv ma'lumotlari yuklanmoqda...
        </div>
      ) : archivedNotes.length === 0 ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-slate-400 space-y-3">
          <Archive className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Arxiv bo'sh</h3>
          <p className="text-xs">Hozirda arxivlangan loyihalar yoki qaydlar mavjud emas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {archivedNotes.map((n) => (
            <div
              key={n.id}
              className="p-5 rounded-2xl glass-panel border border-slate-500/20 opacity-75 hover:opacity-100 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono bg-slate-500/20 text-slate-300">
                    ARXIV
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(n.updatedAt).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-200">{n.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{n.content}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">ID: #{n.id.substring(0, 8)}</span>
                <button
                  onClick={() => handleRestore(n.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Qaytarish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
