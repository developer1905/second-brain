'use client';

import React, { useState, useEffect } from 'react';
import { Link2, Sparkles, Plus, Check } from 'lucide-react';
import Link from 'next/link';

interface UnlinkedMentionItem {
  id: string;
  title: string;
  matchedText: string;
  snippet: string;
}

interface UnlinkedMentionsProps {
  currentNoteId: string;
  currentNoteTitle: string;
  currentContent: string;
  allNotes: { id: string; title: string; content: string }[];
  onLinkCreated?: () => void;
}

export const UnlinkedMentions: React.FC<UnlinkedMentionsProps> = ({
  currentNoteId,
  currentNoteTitle,
  currentContent,
  allNotes,
  onLinkCreated,
}) => {
  const [mentions, setMentions] = useState<UnlinkedMentionItem[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const found: UnlinkedMentionItem[] = [];
    const lowerContent = currentContent.toLowerCase();

    allNotes.forEach((note) => {
      if (note.id === currentNoteId) return;
      const lowerTitle = note.title.toLowerCase().trim();
      if (lowerTitle.length < 3) return;

      // Check if note title is in current content, but not inside [[...]]
      const isAlreadyWikiLinked = currentContent.includes(`[[${note.title}]]`);
      if (lowerContent.includes(lowerTitle) && !isAlreadyWikiLinked) {
        const idx = lowerContent.indexOf(lowerTitle);
        const start = Math.max(0, idx - 30);
        const end = Math.min(currentContent.length, idx + lowerTitle.length + 30);
        const snippet = '...' + currentContent.slice(start, end) + '...';

        found.push({
          id: note.id,
          title: note.title,
          matchedText: note.title,
          snippet,
        });
      }
    });

    setMentions(found);
  }, [currentNoteId, currentNoteTitle, currentContent, allNotes]);

  const handleLinkNote = async (mention: UnlinkedMentionItem) => {
    try {
      const res = await fetch('/api/notes/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: currentNoteId,
          targetId: mention.id,
          label: 'wiki_link',
        }),
      });

      if (res.ok) {
        setLinkedIds((prev) => new Set(prev).add(mention.id));
        onLinkCreated?.();
      }
    } catch (e) {
      console.error('Failed to link mention:', e);
    }
  };

  if (mentions.length === 0) return null;

  return (
    <div className="rounded-2xl glass-panel border border-purple-500/30 p-4 space-y-3 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          Bog'lanmagan Eslatmalar (Unlinked Mentions)
        </h4>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
          {mentions.length} ta aniqlandi
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-tight">
        Ushbu matnda boshqa qaydlarga ishora bor. 1-click bilan ularni sinaps qilib bog'lashingiz mumkin:
      </p>

      <div className="space-y-2">
        {mentions.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/5 transition"
          >
            <div className="space-y-0.5 pr-2">
              <Link
                href={`/notes/${m.id}`}
                className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1"
              >
                <Link2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>[[{m.title}]]</span>
              </Link>
              <p className="text-[10px] text-slate-400 font-mono italic">{m.snippet}</p>
            </div>

            <button
              type="button"
              onClick={() => handleLinkNote(m)}
              disabled={linkedIds.has(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 shrink-0 ${
                linkedIds.has(m.id)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
              }`}
            >
              {linkedIds.has(m.id) ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Bog'landi</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Bog'lash</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
