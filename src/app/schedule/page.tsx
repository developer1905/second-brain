'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Plus, Trash2, Play, Pause, Calendar, Repeat, Tag, Loader2, X, Save, Bell } from 'lucide-react';

interface Schedule {
  id: string;
  title: string;
  description: string;
  cronExpr: string | null;
  oneTime: string | null;
  isActive: boolean;
  nextRun: string | null;
  tags: string;
  createdAt: string;
}

const PRESETS = [
  { label: 'Har kuni 9:00', cron: '0 9 * * *' },
  { label: 'Har dush 9:00', cron: '0 9 * * 1' },
  { label: 'Har jum 18:00', cron: '0 18 * * 5' },
  { label: 'Har oy 1-si', cron: '0 9 1 * *' },
];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cronExpr: '', oneTime: '', tags: '', type: 'cron' as 'cron' | 'one-time' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/schedule');
    if (res.ok) setSchedules(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description,
        cronExpr: form.type === 'cron' ? form.cronExpr || null : null,
        oneTime: form.type === 'one-time' ? form.oneTime || null : null,
        tags: form.tags,
      }),
    });
    setForm({ title: '', description: '', cronExpr: '', oneTime: '', tags: '', type: 'cron' });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const toggle = async (s: Schedule) => {
    await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
    load();
  };

  const active = schedules.filter((s) => s.isActive);
  const inactive = schedules.filter((s) => !s.isActive);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Timekeeper
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Eslatmalar va takroriy vazifalarni rejalashtiring</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Yangi Jadval
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Jami', val: schedules.length, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' },
          { label: 'Faol', val: active.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Nofaol', val: inactive.length, color: 'text-slate-500', bg: 'bg-slate-800/40 border-white/5' },
        ].map((s) => (
          <div key={s.label} className={`glass-panel rounded-xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-panel rounded-2xl border border-amber-500/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300">Yangi jadval</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <input type="text" placeholder="Sarlavha *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition" />
          <textarea placeholder="Tavsif (ixtiyoriy)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2} className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition resize-none" />

          {/* Type toggle */}
          <div className="flex items-center gap-2">
            <button onClick={() => setForm({ ...form, type: 'cron' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${form.type === 'cron' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-400 border-white/10'}`}>
              <Repeat className="w-3.5 h-3.5" /> Takroriy (Cron)
            </button>
            <button onClick={() => setForm({ ...form, type: 'one-time' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${form.type === 'one-time' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'text-slate-400 border-white/10'}`}>
              <Calendar className="w-3.5 h-3.5" /> Bir martalik
            </button>
          </div>

          {form.type === 'cron' ? (
            <div className="space-y-2">
              <input type="text" placeholder="Cron ifoda: 0 9 * * 1" value={form.cronExpr} onChange={(e) => setForm({ ...form, cronExpr: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white font-mono placeholder-slate-500 outline-none focus:border-amber-500/40 transition" />
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.cron} onClick={() => setForm({ ...form, cronExpr: p.cron })}
                    className="px-2.5 py-1 rounded-lg text-[11px] border border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 transition">{p.label}</button>
                ))}
              </div>
            </div>
          ) : (
            <input type="datetime-local" value={form.oneTime} onChange={(e) => setForm({ ...form, oneTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white outline-none focus:border-amber-500/40 transition" />
          )}

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Teglar: haftalik, eslatma" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition">Bekor</button>
            <button onClick={save} disabled={saving || !form.title} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-40 transition">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Saqlash
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bell className="w-14 h-14 text-slate-600 mx-auto" />
          <p className="text-slate-400">Hali jadvallar yo'q</p>
          <p className="text-xs text-slate-500">Eslatma yoki takroriy vazifa yarating</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...active, ...inactive].map((s) => (
            <div key={s.id} className={`group glass-panel rounded-xl border p-4 transition ${s.isActive ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-white/5 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border flex-shrink-0 ${s.isActive ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/40 border-white/5'}`}>
                  {s.cronExpr ? <Repeat className={`w-4 h-4 ${s.isActive ? 'text-amber-400' : 'text-slate-500'}`} /> : <Calendar className={`w-4 h-4 ${s.isActive ? 'text-amber-400' : 'text-slate-500'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    {s.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500">
                    {s.cronExpr && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{s.cronExpr}</span>}
                    {s.oneTime && <span>{new Date(s.oneTime).toLocaleString('uz-UZ')}</span>}
                    {s.nextRun && <span>Keyingi: {new Date(s.nextRun).toLocaleString('uz-UZ')}</span>}
                  </div>
                  {s.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.tags.split(',').filter(Boolean).map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/8">{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => toggle(s)} className={`p-1.5 rounded-lg border transition text-xs ${s.isActive ? 'bg-slate-700/50 border-white/10 text-slate-300 hover:text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}>
                    {s.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/20 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
