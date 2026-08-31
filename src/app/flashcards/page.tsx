'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  X,
  Save,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
} from 'lucide-react';
import Link from 'next/link';

interface Flashcard {
  id: string;
  noteId: string | null;
  question: string;
  answer: string;
  difficulty: string;
  reviewCount: number;
  nextReview: string | null;
}

interface NoteOption {
  id: string;
  title: string;
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState('');

  const [manualForm, setManualForm] = useState({
    question: '',
    answer: '',
    difficulty: 'MEDIUM',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flashcards');
      if (res.ok) {
        const json = await res.json();
        setFlashcards(json.flashcards || []);
        setNotes(json.notes || []);
        if (json.notes && json.notes.length > 0) {
          setSelectedNoteId(json.notes[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrade = async (rating: 'EASY' | 'MEDIUM' | 'HARD') => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentIndex];

    try {
      const res = await fetch('/api/flashcards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentCard.id, rating }),
      });

      if (res.ok) {
        setIsFlipped(false);
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setCurrentIndex(0);
          loadData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.question.trim() || !manualForm.answer.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual', ...manualForm }),
      });

      if (res.ok) {
        setManualForm({ question: '', answer: '', difficulty: 'MEDIUM' });
        setShowManualForm(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!selectedNoteId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-generate', noteId: selectedNoteId }),
      });

      if (res.ok) {
        setShowAiModal(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ushbu flashcardni o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/flashcards?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsFlipped(false);
        setCurrentIndex(0);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-violet-500/30 shadow-glowCyan">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 text-violet-400 border border-violet-500/40">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              AI Flashcardlar & Active Recall
              <span className="px-2 py-0.5 text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/40 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-400" />
                Spaced Repetition
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interaktiv savol-javob kartalari orqali bilimlarni uzoq muddatli xotirada mustahkamlash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-xs font-bold transition"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Yordamida Yaratish</span>
          </button>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Karta</span>
          </button>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="p-6 rounded-2xl glass-panel border border-purple-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Qaydlardan AI Flashcard Yaratish
            </h3>
            <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-mono text-slate-300">
              Qaysi qayd asosida savol-javob kartalari yaratilsin?
            </label>
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/60"
            >
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
              Bekor Qilish
            </button>
            <button
              onClick={handleAiGenerate}
              disabled={saving || !selectedNoteId}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>AI Yordamida Kartalarni Generatsiya Qilish</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Creation Form */}
      {showManualForm && (
        <form onSubmit={handleCreateManual} className="p-6 rounded-2xl glass-panel border border-violet-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yangi Flashcard Qo'lda Yaratish
            </h3>
            <button type="button" onClick={() => setShowManualForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Savol / Savol Matni *</label>
              <textarea
                rows={2}
                required
                placeholder="Masalan: P.A.R.A metodologiyasi nima va uning 4 bo'limi qaysilar?"
                value={manualForm.question}
                onChange={(e) => setManualForm({ ...manualForm, question: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-violet-500/60"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Javob Matni *</label>
              <textarea
                rows={3}
                required
                placeholder="Javob tafsiloti..."
                value={manualForm.answer}
                onChange={(e) => setManualForm({ ...manualForm, answer: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-violet-500/60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Kartani Saqlash</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Flashcard Interactive Viewer */}
      {loading ? (
        <div className="p-16 glass-panel rounded-2xl text-center text-xs text-violet-400 font-mono">
          Flashcardlar yuklanmoqda...
        </div>
      ) : flashcards.length === 0 ? (
        <div className="p-16 glass-panel rounded-2xl text-center text-slate-400 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm">Hali flashcardlar mavjud emas. Yuqoridagi tugma orqali kartalar yarating!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Carousel Info */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              KARTA: <strong className="text-violet-400">{currentIndex + 1}</strong> / {flashcards.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                }}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                }}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[260px] p-8 rounded-3xl glass-panel border border-violet-500/40 shadow-glowCyan cursor-pointer flex flex-col justify-between transition-all duration-300 transform hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono text-purple-400 font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                {isFlipped ? '💡 JAVOB' : '❓ SAVOL'}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 rounded">
                  Qaytarilgan: {currentCard.reviewCount} marta
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(currentCard.id);
                  }}
                  className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="py-6 text-center space-y-3">
              {!isFlipped ? (
                <h3 className="text-lg font-extrabold text-white leading-relaxed">{currentCard.question}</h3>
              ) : (
                <div className="text-base text-emerald-300 font-medium leading-relaxed max-w-2xl mx-auto">
                  {currentCard.answer}
                </div>
              )}
              <p className="text-[11px] text-slate-500 font-mono">
                {isFlipped ? "Baho berish uchun quyidagi tugmalardan birini bosing" : "Javobni ko'rish uchun kartaga bosing"}
              </p>
            </div>

            {/* Flip Button Indicator */}
            <div className="flex justify-center pt-2">
              <span className="text-xs font-mono text-violet-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                Kartani o'girish
              </span>
            </div>
          </div>

          {/* Active Recall Difficulty Grading Buttons */}
          {isFlipped && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => handleGrade('HARD')}
                className="p-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <span>🔴 Qiyin</span>
                <span className="text-[10px] font-mono text-rose-400/80">(Ertaga qaytarish)</span>
              </button>
              <button
                onClick={() => handleGrade('MEDIUM')}
                className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <span>🟡 O'rtacha</span>
                <span className="text-[10px] font-mono text-amber-400/80">(2 kundan keyin)</span>
              </button>
              <button
                onClick={() => handleGrade('EASY')}
                className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <span>🟢 Oson</span>
                <span className="text-[10px] font-mono text-emerald-400/80">(4 kundan keyin)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
