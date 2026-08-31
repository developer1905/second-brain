'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Link2,
  Tag,
  ArrowLeft,
  Share2,
  Trash2,
  FolderKanban,
  Layers,
  BookMarked,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TipTapEditorProps {
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: string;
  initialTags?: string;
  incomingBacklinks?: { source: { id: string; title: string; paraCategory: string } }[];
  outgoingBacklinks?: { target: { id: string; title: string; paraCategory: string } }[];
  onSave?: (note: any) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  noteId,
  initialTitle = '',
  initialContent = '',
  initialCategory = 'RESOURCE',
  initialTags = 'Qayd',
  incomingBacklinks = [],
  outgoingBacklinks = [],
  onSave,
}) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState(initialCategory);
  const [tags, setTags] = useState(initialTags);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Autocomplete menu state for [[Backlinks]]
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [suggestedNotes, setSuggestedNotes] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setCategory(initialCategory);
    setTags(initialTags);
  }, [initialTitle, initialContent, initialCategory, initialTags]);

  // Handle typing `[[` to open autocompletion menu
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');

    if (lastOpenBracket !== -1 && textBeforeCursor.indexOf(']]', lastOpenBracket) === -1) {
      const query = textBeforeCursor.substring(lastOpenBracket + 2);
      setMentionQuery(query);
      setShowMentionMenu(true);

      try {
        const res = await fetch(`/api/notes?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestedNotes(data.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertBacklink = (targetTitle: string) => {
    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const val = content;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');

    if (lastOpenBracket !== -1) {
      const newText =
        val.substring(0, lastOpenBracket) +
        `[[${targetTitle}]]` +
        val.substring(cursorPos);
      setContent(newText);
    }
    setShowMentionMenu(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Qayd sarlavhasini kiriting!");
      return;
    }

    setSaving(true);
    try {
      const method = noteId ? 'PUT' : 'POST';
      const url = noteId ? `/api/notes/${noteId}` : '/api/notes';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          paraCategory: category,
          tags,
        }),
      });

      if (!res.ok) throw new Error("Saqlashda xatolik yuz berdi");

      const savedData = await res.json();
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);

      onSave?.(savedData);
    } catch (err: any) {
      alert(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Editor Top Toolbar */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga</span>
        </button>

        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-cyan-400 font-bold focus:outline-none"
          >
            <option value="PROJECT">Loyiha (Project)</option>
            <option value="AREA">Soha (Area)</option>
            <option value="RESOURCE">Resurs (Resource)</option>
            <option value="ARCHIVE">Arxiv (Archive)</option>
          </select>

          <button
            onClick={handleFormSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-glowCyan transition active:scale-95 disabled:opacity-50"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? "Saqlandi!" : saving ? "Saqlanmoqda..." : "Saqlash"}</span>
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel border border-white/10 space-y-6 relative">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Qayd Sarlavhasi..."
          className="w-full text-2xl md:text-3xl font-extrabold bg-transparent text-white placeholder-slate-500 border-b border-white/10 pb-3 focus:outline-none focus:border-cyan-500/60 transition"
        />

        {/* Tags */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Teglar: AI, Dasturlash, Kitob..."
            className="w-full h-8 px-2 text-xs bg-slate-950/40 border border-white/10 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Content Area with [[Backlink]] fuzzy menu */}
        <div className="relative min-h-[350px]">
          <textarea
            id="note-textarea"
            rows={15}
            value={content}
            onChange={handleContentChange}
            placeholder="Markdown formatida matn yozing... boshqa qaydlarni bog'lash uchun [[ deb yozing!"
            className="w-full p-4 text-sm md:text-base font-mono bg-slate-950/60 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 leading-relaxed resize-y"
          />

          {/* Autocomplete Menu for [[Backlinks]] */}
          {showMentionMenu && (
            <div className="absolute top-12 left-6 z-40 w-72 p-2 rounded-xl glass-panel border border-cyan-500/50 shadow-glowCyan space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-cyan-400 uppercase border-b border-white/10">
                [[Backlink]] bo'yicha ulash
              </div>
              {suggestedNotes.length > 0 ? (
                suggestedNotes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => insertBacklink(n.title)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center justify-between"
                  >
                    <span className="truncate">{n.title}</span>
                    <Link2 className="w-3 h-3 text-cyan-400 shrink-0" />
                  </button>
                ))
              ) : (
                <div className="p-2 text-xs text-slate-400">Yangi qayd sarlavhasini kiriting...</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backlinks Footer Section (Sinaptik Bog'lanishlar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incoming Backlinks */}
        <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase font-mono">
            <Link2 className="w-4 h-4" />
            <span>Ushbu Qaydga Ishoralar (Kiruvchi: {incomingBacklinks.length})</span>
          </div>
          {incomingBacklinks.length > 0 ? (
            <div className="space-y-2">
              {incomingBacklinks.map((inc, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/notes/${inc.source.id}`)}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-purple-500/40 text-xs text-slate-200 cursor-pointer flex items-center justify-between transition"
                >
                  <span className="font-semibold text-purple-300 truncate">[[{inc.source.title}]]</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Hali ushbu qaydga boshqa fayllardan ishora yo'q</p>
          )}
        </div>

        {/* Outgoing Backlinks */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase font-mono">
            <Link2 className="w-4 h-4" />
            <span>Ushbu Qayddan Ishoralar (Chiquvchi: {outgoingBacklinks.length})</span>
          </div>
          {outgoingBacklinks.length > 0 ? (
            <div className="space-y-2">
              {outgoingBacklinks.map((out, idx) => (
                <div
                  key={idx}
                  onClick={() => router.push(`/notes/${out.target.id}`)}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 text-xs text-slate-200 cursor-pointer flex items-center justify-between transition"
                >
                  <span className="font-semibold text-cyan-300 truncate">[[{out.target.title}]]</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Ushbu qayddan boshqa materiallarga havola berilmagan</p>
          )}
        </div>
      </div>
    </div>
  );
};
