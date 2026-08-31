'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TipTapEditor } from '@/components/TipTapEditor';
import { useRouter } from 'next/navigation';

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const noteId = params.id;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNote = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) {
        throw new Error("Qayd topilmadi!");
      }
      const data = await res.json();
      setNote(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  if (loading) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-xs text-cyan-400 font-mono">
        Qayd va sinaptik backlinklar yuklanmoqda...
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-red-400 space-y-4">
        <h3 className="text-lg font-bold">Xatolik yuz berdi</h3>
        <p className="text-xs text-slate-400">{error || "Siz so'ragan qayd mavjud emas."}</p>
        <button
          onClick={() => router.push('/database')}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold"
        >
          Bazaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TipTapEditor
        noteId={note.id}
        initialTitle={note.title}
        initialContent={note.content}
        initialCategory={note.paraCategory}
        initialTags={note.tags}
        incomingBacklinks={note.incomingEdges}
        outgoingBacklinks={note.outgoingEdges}
        onSave={() => fetchNote()}
      />
    </div>
  );
}
