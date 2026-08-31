'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  PieChart,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Filter,
  Loader2,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  description: string | null;
  createdAt: string;
}

interface FinanceData {
  transactions: Transaction[];
  stats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
  };
  categoryBreakdown: Record<string, number>;
}

const CATEGORIES = [
  'Maosh',
  'Frilans',
  'Investitsiya',
  'Oziq-ovqat',
  'Transport',
  'Kommunal',
  'Texnologiya',
  'Kiyim-kechak',
  'Dam olish',
  'Boshqa',
];

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    category: 'Oziq-ovqat',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Finance load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;

    setSaving(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          title: '',
          amount: '',
          type: 'EXPENSE',
          category: 'Oziq-ovqat',
          date: new Date().toISOString().split('T')[0],
          description: '',
        });
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
    if (!confirm("Ushbu moliyaviy yozuvni bazadan o'chirmoqchimisiz?")) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = (data?.transactions || []).filter((tx) => {
    if (filterType === 'INCOME') return tx.type === 'INCOME';
    if (filterType === 'EXPENSE') return tx.type === 'EXPENSE';
    return true;
  });

  const totalExpense = data?.stats.totalExpense || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-emerald-500/30 shadow-glowCyan">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/40">
            <Wallet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Kirim-Chiqim (Shaxsiy Moliya)
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                3D Miyaga Ulangan
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Shaxsiy byudjet, daromad va xarajatlarni boshqarish hamda 3D neyron grafikda vizualizatsiya
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Amaliyot</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Balance */}
        <div className="p-5 rounded-2xl glass-panel border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>JAMI BALANS</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className={`text-2xl font-extrabold font-mono ${(data?.stats.balance || 0) >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            ${(data?.stats.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400">
            {(data?.stats.balance || 0) >= 0 ? '🟢 Musbat moliya holati' : '🔴 Manfiy balans'}
          </p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>KIRIM (INCOME)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-400">
            +${(data?.stats.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-400/80">Jami daromadlar tushumi</p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl glass-panel border border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CHIQIM (EXPENSES)</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-400">
            -${(data?.stats.totalExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-rose-400/80">Jami qilingan xarajatlar</p>
        </div>
      </div>

      {/* Add Transaction Form Modal / Panel */}
      {showForm && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl glass-panel border border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Yangi Kirim / Chiqim Amaliyotini Qo'shish
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Sarlavha *</label>
              <input
                type="text"
                required
                placeholder="Masalan: Maosh yoki Oziq-ovqat"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/60"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Summa ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Amaliyot Turi *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/60"
              >
                <option value="EXPENSE">🔴 Chiqim (Expense)</option>
                <option value="INCOME">🟢 Kirim (Income)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Kategoriya *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/60"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Sana</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Tavsif (Ixtiyoriy)</label>
              <input
                type="text"
                placeholder="Qisqacha izoh..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/60"
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
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Saqlash va Miyaga Qo'shish</span>
            </button>
          </div>
        </form>
      )}

      {/* Category Expense Breakdown Progress Bar Section */}
      {data && Object.keys(data.categoryBreakdown).length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            Xarajatlar Kategoriyalari Tahlili
          </h3>
          <div className="space-y-2">
            {Object.entries(data.categoryBreakdown).map(([cat, amount]) => {
              const percent = Math.round((amount / totalExpense) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{cat}</span>
                    <span className="text-rose-400 font-bold">
                      ${amount.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions List & Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Moliyaviy Amaliyotlar Ro'yxati ({filteredTransactions.length})
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🟢 Kirim
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔴 Chiqim
            </button>
          </div>
        </div>

        {/* Transactions Table / List */}
        {loading ? (
          <div className="p-12 glass-panel rounded-2xl text-center text-xs text-emerald-400 font-mono">
            Moliyaviy ma'lumotlar yuklanmoqda...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 glass-panel rounded-2xl text-center text-slate-400 space-y-3">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm">Mavjud amaliyotlar topilmadi.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <div
                  key={tx.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel border ${
                    isIncome ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-rose-500/30 hover:border-rose-500/50'
                  } transition group`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isIncome ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{tx.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          {tx.category}
                        </span>
                        <span>{tx.date}</span>
                        {tx.description && <span className="text-slate-500">— {tx.description}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-base font-extrabold font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>

                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
