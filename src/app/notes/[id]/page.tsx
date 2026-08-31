'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TipTapEditor } from '@/components/TipTapEditor';
import { LocalGraph } from '@/components/LocalGraph';
import { UnlinkedMentions } from '@/components/UnlinkedMentions';
import { TemplateSelector, NoteTemplate } from '@/components/TemplateSelector';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Network, Sparkles } from 'lucide-react';

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const noteId = params.id;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local graph and unlinked mentions state
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphLinks, setGraphLinks] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<any[]>([]);

  const fetchNote = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) {
        throw new Error('Qayd topilmadi!');
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

  const fetchGraphAndNotes = useCallback(async () => {
    try {
      const [gRes, nRes] = await Promise.all([
        fetch('/api/graph'),
        fetch('/api/notes'),
      ]);
      if (gRes.ok) {
        const gData = await gRes.json();
        setGraphNodes(gData.nodes || []);
        setGraphLinks(gData.links || []);
      }
      if (nRes.ok) {
        const nData = await nRes.json();
        setAllNotes(nData || []);
      }
    } catch (e) {
      console.error('Failed to fetch graph/notes data:', e);
    }
  }, []);

  useEffect(() => {
    fetchNote();
    fetchGraphAndNotes();
  }, [fetchNote, fetchGraphAndNotes]);

  const handleApplyTemplate = (t: NoteTemplate) => {
    if (note) {
      setNote((prev: any) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n${t.content}` : t.content,
      }));
    }
  };

  const handleExportObsidianVault = async () => {
    try {
      const res = await fetch('/api/export/obsidian');
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data.notes, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `obsidian-vault-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (e) {
      console.error('Failed to export vault:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-xs text-cyan-400 font-mono animate-pulse">
        🧠 Qayd va Obsidian sinaptik backlinklar yuklanmoqda...
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
      {/* Top Action Bar: Back, Template, Export Vault */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-white/10 bg-slate-950/80">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold transition border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Orqaga</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Obsidian Template Selector */}
          <TemplateSelector onSelectTemplate={handleApplyTemplate} />

          {/* Obsidian Vault Export */}
          <button
            type="button"
            onClick={handleExportObsidianVault}
            title="Obsidian Vault formatida barcha qaydlarni yuklab olish"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-mono transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Obsidian Vault Export</span>
          </button>
        </div>
      </div>

      {/* Main TipTap Editor */}
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

      {/* Obsidian-Style Local Graph & Unlinked Mentions Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        {/* 1. Local Graph (Mahalliy 3D Neyron Qo'shnilar) */}
        <LocalGraph
          currentNodeId={`note-${note.id}`}
          nodes={graphNodes}
          links={graphLinks}
        />

        {/* 2. Unlinked Mentions (Bog'lanmagan Matnli Isbotlar) */}
        <UnlinkedMentions
          currentNoteId={note.id}
          currentNoteTitle={note.title}
          currentContent={note.content}
          allNotes={allNotes}
          onLinkCreated={() => fetchNote()}
        />
      </div>
    </div>
  );
}
