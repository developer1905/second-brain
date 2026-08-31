'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Flame,
  Check,
  Plus,
  Trash2,
  Calendar,
  Brain,
  X,
  Save,
  Loader2,
  Award,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
}

interface Habit {
  id: string;
  title: string;
  category: string;
  frequency: string;
  streakCount: number;
  targetDays: number;
  icon: string;
  isCompletedToday: boolean;
  logs: HabitLog[];
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'Salomatlik',
    targetDays: 7,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const json = await res.json();
        setHabits(json.habits || []);
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

  const handleToggle = async (habitId: string) => {
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', habitId }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ title: '', category: 'Salomatlik', targetDays: 7 });
        setShowForm(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ushbu odatni va uning barcha tarixini o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/habits?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate last 7 days date strings
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('uz-UZ', { weekday: 'short' }),
    };
  });

  const totalStreaks = habits.reduce((acc, h) => acc + h.streakCount, 0);
  const completedTodayCount = habits.filter((h) => h.isCompletedToday).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-amber-500/30 shadow-glowCyan">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-rose-500/20 text-amber-400 border border-amber-500/40">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Kunlik Odatlar va Intizom Trekeri
              <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Streak Multiplier
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Har kuni 1% yaxshilanish orqali ulkan marralarga erishish va 3D neyron miyada vizual faollik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 text-xs font-bold transition"
          >
            <Brain className="w-4 h-4 text-purple-400" />
            <span>Miyada Ko'rish</span>
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Odat</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-mono text-slate-400">FAOL ODATLAR</span>
          <p className="text-2xl font-extrabold font-mono text-white">{habits.length} ta</p>
          <p className="text-[11px] text-amber-400/80">Kuzatib borilayotgan kunlik odatlar</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-orange-500/30 space-y-1">
          <span className="text-[11px] font-mono text-slate-400">BUGUNGI BAJARILGAN</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            {completedTodayCount} / {habits.length}
          </p>
          <p className="text-[11px] text-emerald-400/80">
            {habits.length > 0 ? `${Math.round((completedTodayCount / habits.length) * 100)}% bajarildi` : 'Odatlar yo\'q'}
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-rose-500/30 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            JAMI STREAK DARASI
          </span>
          <p className="text-2xl font-extrabold font-mono text-rose-400">🔥 {totalStreaks} kun</p>
          <p className="text-[11px] text-rose-400/80">Uzluksiz intizom zanjiri</p>
        </div>
      </div>

      {/* Add Habit Form Modal */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-6 rounded-2xl glass-panel border border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yangi Kunlik Odat Qo'shish
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Odat Nomi *</label>
              <input
                type="text"
                required
                placeholder="Masalan: Kitob o'qish 30 daqiqa"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Kategoriya</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/60"
              >
                <option value="Salomatlik">Salomatlik va Sport</option>
                <option value="Dasturlash">IT va Dasturlash</option>
                <option value="Kitobxonlik">Kitoblar mutolaasi</option>
                <option value="Moliya">Moliya & Investitsiya</option>
                <option value="Meditatsiya">Shaxsiy Rivojlanish</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Maqsad (Haftada kunlar)</label>
              <input
                type="number"
                min="1"
                max="7"
                value={form.targetDays}
                onChange={(e) => setForm({ ...form, targetDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/60 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Faol Intizom Zanjirlari ({habits.length})
        </h3>

        {loading ? (
          <div className="p-12 glass-panel rounded-2xl text-center text-xs text-amber-400 font-mono">
            Odatlar yuklanmoqda...
          </div>
        ) : habits.length === 0 ? (
          <div className="p-12 glass-panel rounded-2xl text-center text-slate-400 space-y-3">
            <Flame className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm">Hali odatlar qo'shilmagan. Birinchi intizom odatingizni qo'shing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((h) => (
              <div
                key={h.id}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-amber-500/40 transition space-y-4 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(h.id)}
                      className={`p-3 rounded-2xl transition border ${
                        h.isCompletedToday
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-glowCyan scale-105'
                          : 'bg-white/5 text-slate-500 border-white/10 hover:border-amber-500/40 hover:text-amber-400'
                      }`}
                    >
                      <Check className="w-6 h-6 stroke-[3]" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-base font-extrabold ${
                            h.isCompletedToday ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-white'
                          }`}
                        >
                          {h.title}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 rounded">
                          {h.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Bugun: {h.isCompletedToday ? '🟢 Bajarildi!' : '🔴 Hali bajarilmadi'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Streak Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                      <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-bounce" />
                      <span>{h.streakCount} Kun Streak</span>
                    </div>

                    <button
                      onClick={() => handleDelete(h.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 7-Day History Calendar Grid */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">So'nggi 7 kun:</span>
                  <div className="flex items-center gap-2">
                    {last7Days.map((d) => {
                      const isLog = h.logs.some((l) => l.date === d.dateStr && l.completed);
                      return (
                        <div key={d.dateStr} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{d.dayName}</span>
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
                              isLog
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-glowCyan'
                                : 'bg-slate-950/60 border-white/10 text-slate-600'
                            }`}
                          >
                            {isLog ? '✓' : '•'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
