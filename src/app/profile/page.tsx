'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain, Zap, TrendingUp, TrendingDown, Target, Flame, BookOpen,
  MessageSquare, Wallet, Star, RefreshCw, ChevronRight, Activity,
  Github, Hash, CheckCircle2, AlertCircle, BarChart2, Sparkles,
} from 'lucide-react';

interface Analysis {
  productivityScore: number;
  totalNotes: number;
  totalProjects: number;
  activeProjects: number;
  doneProjects: number;
  avgProjectProgress: number;
  topTags: { tag: string; count: number }[];
  habits: { total: number; active: number; avgStreak: number; best: { title: string; streak: number } | null };
  finance: { totalIncome: number; totalExpense: number; balance: number; topExpenseCategory: { name: string; amount: number } | null };
  learning: { flashcards: number; masteredCards: number; flashcardScore: number; booksRead: number; totalBooks: number; githubRepos: number; topLanguage: string | null };
  telegram: { total: number; thisWeek: number };
  areas: string[];
  weeklyActivity: { day: string; count: number }[];
  strengths: string[];
  improvements: string[];
  generatedAt: string;
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#00f3ff' : score >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] text-slate-400 font-mono">/100</span>
      </div>
    </div>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-cyan-500/60 to-cyan-400/30 transition-all duration-700"
            style={{ height: `${Math.max(4, (d.count / max) * 56)}px` }}
          />
          <span className="text-[9px] text-slate-500 font-mono">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'cyan' }: any) {
  const colors: Record<string, string> = {
    cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
    violet: 'border-violet-500/20 bg-violet-500/5 text-violet-400',
  };
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-[11px] text-slate-400 font-mono">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/selfanalysis');
      const data = await res.json();
      if (data.ok) setAnalysis(data.analysis);
      else setError(data.error || 'Tahlil qilishda xatolik');
    } catch {
      setError('Server bilan aloqa yo\'q');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalysis(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-5 rounded-3xl bg-cyan-500/10 border border-cyan-500/30">
          <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-sm font-mono text-cyan-400 animate-pulse">Ma'lumotlar tahlil qilinmoqda...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-red-400">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm font-mono">{error || 'Ma\'lumot yuklanmadi'}</p>
        <button onClick={fetchAnalysis} className="px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-sm hover:bg-slate-700 transition">
          Qayta urinish
        </button>
      </div>
    );
  }

  const scoreLabel =
    analysis.productivityScore >= 70 ? '🌟 Yuqori samaradorlik' :
    analysis.productivityScore >= 40 ? '📈 O\'rtacha darajada' :
    '💪 Rivojlanish bosqichi';

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-6 px-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <Brain className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">Shaxsiy Tahlil</h1>
            <p className="text-[11px] text-slate-400 font-mono">AI asosida to'liq profil</p>
          </div>
        </div>
        <button
          onClick={fetchAnalysis}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-300 text-sm hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Yangilash
        </button>
      </div>

      {/* ── Score + Weekly ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Productivity Score */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-950 to-[#0a0f1e] p-5 flex flex-col items-center gap-3">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Samaradorlik Indeksi</p>
          <ScoreRing score={analysis.productivityScore} />
          <span className="text-sm font-bold text-white">{scoreLabel}</span>
        </div>

        {/* Weekly Activity */}
        <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Haftalik Faollik</p>
          </div>
          <MiniBarChart data={analysis.weeklyActivity} />
          <p className="text-[11px] text-slate-500 font-mono">So'nggi 7 kun — qaydlar soni</p>
        </div>
      </div>

      {/* ── Key Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon={BookOpen} label="Jami Qayd" value={analysis.totalNotes} sub={`${analysis.topTags[0]?.tag || '—'} eng ko'p`} color="cyan" />
        <StatCard icon={Target} label="Loyihalar" value={analysis.totalProjects} sub={`${analysis.activeProjects} faol · ${analysis.doneProjects} yakunlangan`} color="purple" />
        <StatCard icon={Flame} label="Eng Yaxshi Odat" value={analysis.habits.best?.streak || 0} sub={analysis.habits.best?.title || 'Odat yo\'q'} color="amber" />
        <StatCard icon={Brain} label="Flashcard" value={`${analysis.learning.flashcardScore}%`} sub={`${analysis.learning.masteredCards}/${analysis.learning.flashcards} mukammal`} color="violet" />
        <StatCard icon={Wallet} label="Balans" value={`$${analysis.finance.balance.toLocaleString()}`} sub={analysis.finance.balance >= 0 ? '✅ Ijobiy' : '⚠️ Manfiy'} color={analysis.finance.balance >= 0 ? 'emerald' : 'rose'} />
        <StatCard icon={MessageSquare} label="Telegram" value={analysis.telegram.total} sub={`${analysis.telegram.thisWeek} bu hafta`} color="cyan" />
        <StatCard icon={BookOpen} label="Kitoblar" value={analysis.learning.booksRead} sub={`${analysis.learning.totalBooks} jami`} color="amber" />
        <StatCard icon={Github} label="GitHub Repo" value={analysis.learning.githubRepos} sub={analysis.learning.topLanguage || 'N/A'} color="emerald" />
      </div>

      {/* ── Strengths + Improvements ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Strengths */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-300 font-mono">Kuchli Tomonlar</h3>
          </div>
          {analysis.strengths.length > 0 ? (
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">Hali yetarli ma'lumot yo'q...</p>
          )}
        </div>

        {/* Improvements */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300 font-mono">Yaxshilash Kerak</h3>
          </div>
          {analysis.improvements.length > 0 ? (
            <ul className="space-y-2">
              {analysis.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">
              <Sparkles className="w-4 h-4 inline text-amber-400 mr-1" />
              Ajoyib! Hamma narsa yaxshi yo'lda.
            </p>
          )}
        </div>
      </div>

      {/* ── Top Tags ── */}
      {analysis.topTags.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">Eng Ko'p Ishlatiladigan Teglar</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono"
              >
                #{tag} <span className="text-slate-500">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Finance Summary ── */}
      <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white font-mono">Moliyaviy Holat</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
            <p className="text-[10px] text-slate-400 font-mono">Kirim</p>
            <p className="text-base font-black text-emerald-400">${analysis.finance.totalIncome.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
            <p className="text-[10px] text-slate-400 font-mono">Chiqim</p>
            <p className="text-base font-black text-rose-400">${analysis.finance.totalExpense.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-3 border ${analysis.finance.balance >= 0 ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <p className="text-[10px] text-slate-400 font-mono">Balans</p>
            <p className={`text-base font-black ${analysis.finance.balance >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              ${analysis.finance.balance.toLocaleString()}
            </p>
          </div>
        </div>
        {analysis.finance.topExpenseCategory && (
          <p className="text-xs text-slate-500 font-mono">
            Eng ko'p chiqim: <span className="text-amber-400">{analysis.finance.topExpenseCategory.name}</span>
            — ${analysis.finance.topExpenseCategory.amount.toLocaleString()}
          </p>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-600 font-mono pb-2">
        Tahlil vaqti: {analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleString('uz-UZ') : '—'}
      </p>
    </div>
  );
}
