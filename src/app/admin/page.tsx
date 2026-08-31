'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  Plus,
  Users,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  Archive,
  LogOut,
  Phone,
  Mail,
  Building2,
  DollarSign,
  RefreshCw,
  FileText,
  AlertTriangle,
  Zap,
  TrendingUp,
  Database,
  Cpu,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  price: number;
  notes: string;
  status: 'TAYYOR' | 'TOPSHIRILDI' | 'ARXIV';
  dbFilename: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  TAYYOR: { label: 'Tayyor', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  TOPSHIRILDI: { label: 'Topshirildi', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: CheckCircle2 },
  ARXIV: { label: 'Arxiv', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: Archive },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // System statistics & API diagnostics
  const [sysStats, setSysStats] = useState<any>(null);
  const [sysMsg, setSysMsg] = useState<string>('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSysStats = async () => {
    try {
      const res = await fetch('/api/admin/system');
      if (res.ok) {
        const data = await res.json();
        setSysStats(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchClients();
    fetchSysStats();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleVacuum = async () => {
    setSysMsg('⚙️ Baza optimalizatsiya qilinmoqda...');
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vacuum' }),
      });
      const data = await res.json();
      setSysMsg(`✅ ${data.message}`);
      fetchSysStats();
    } catch (e) {
      setSysMsg('❌ Xatolik yuz berdi');
    }
    setTimeout(() => setSysMsg(''), 4000);
  };

  const handleClearTestData = async () => {
    if (!confirm("Barcha 'test' matnli xabarlarni o'chirishni tasdiqlaysizmi?")) return;
    setSysMsg('⚙️ Test ma\'lumotlari tozalanmoqda...');
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_test_data' }),
      });
      const data = await res.json();
      setSysMsg(`✅ ${data.message}`);
      fetchSysStats();
    } catch (e) {
      setSysMsg('❌ Xatolik yuz berdi');
    }
    setTimeout(() => setSysMsg(''), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" mijozini o'chirishni tasdiqlaysizmi?`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
      setClients((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (id: string, name: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/admin/clients/${id}/export`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeNamee = name.replace(/[^a-zA-Z0-9_]/g, '_');
      a.download = `SecondBrain_${safeNamee}_${new Date().toISOString().slice(0, 10)}.db`;
      a.click();
      URL.revokeObjectURL(url);

      await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'TOPSHIRILDI' }),
      });
      await fetchClients();
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchClients();
  };

  const totalRevenue = clients.reduce((sum, c) => sum + (c.price || 0), 0);
  const deliveredCount = clients.filter((c) => c.status === 'TOPSHIRILDI').length;
  const activeCount = clients.filter((c) => c.status === 'TAYYOR').length;

  return (
    <div className="min-h-screen bg-[#020617] text-white" style={{
      backgroundImage: 'radial-gradient(ellipse at 20% 0%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.06) 0%, transparent 50%)',
    }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">

        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white">Full Admin Control Panel</h1>
              <p className="text-xs text-slate-400 font-mono">Second Brain AI · 100% Tizim va Baza Boshqaruvi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchClients(); fetchSysStats(); }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition" title="Yangilash">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 text-xs font-mono transition">
              <LogOut className="w-4 h-4" /> Chiqish
            </button>
          </div>
        </div>

        {/* ── System Diagnostics & Maintenance Section ── */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-mono">100% Tizim Diagnostikasi & Baza Boshqaruvi</h2>
            </div>
            {sysMsg && <span className="text-xs font-mono text-cyan-300 animate-pulse">{sysMsg}</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="rounded-xl bg-white/5 p-3 space-y-1">
              <span className="text-slate-400">Baza Hajmi (SQLite):</span>
              <p className="text-sm font-bold text-cyan-300">{sysStats?.stats?.dbSizeMB || '0.0'} MB</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 space-y-1">
              <span className="text-slate-400">Qaydlar Soni:</span>
              <p className="text-sm font-bold text-purple-300">{sysStats?.stats?.notesCount || 0} ta</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 space-y-1">
              <span className="text-slate-400">Telegram Xabarlar:</span>
              <p className="text-sm font-bold text-sky-300">{sysStats?.stats?.telegramCount || 0} ta</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 space-y-1">
              <span className="text-slate-400">AI Motor (Groq API):</span>
              <p className="text-sm font-bold text-emerald-300">{sysStats?.apiStatus?.groqKey || 'Aktiv'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={handleVacuum}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition active:scale-95"
            >
              <Database className="w-4 h-4" />
              SQLite Bazani Optimalizatsiya Qilish (VACUUM)
            </button>
            <button
              onClick={handleClearTestData}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Test Ma'lumotlarini Tozalash
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Jami Mijozlar", value: clients.length, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            { label: "Faol / Tayyor", value: activeCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: "Topshirildi", value: deliveredCount, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: "Jami Daromad", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Mijozlar Ro'yxati ({clients.length})
          </h2>
          <Link
            href="/admin/clients/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Yangi Varoq Yaratish
          </Link>
        </div>

        {/* Client Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-cyan-400 font-mono text-sm animate-pulse">
            <Zap className="w-5 h-5 mr-2" /> Yuklanmoqda...
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <p className="text-slate-300 font-semibold">Hali hech qanday mijoz yo'q</p>
              <p className="text-xs text-slate-500 mt-1">Birinchi mijoz uchun "Yangi Varoq Yaratish" tugmasini bosing</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => {
              const statusCfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.TAYYOR;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={client.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 transition space-y-4 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-base">{client.name}</h3>
                      {client.company && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Building2 className="w-3 h-3" /> {client.company}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1 ${statusCfg.color}`}>
                      <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                    {client.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-xs text-slate-400 italic line-clamp-2 bg-white/5 p-2 rounded-lg border border-white/5">
                      "{client.notes}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-extrabold text-amber-400 font-mono">
                      ${(client.price || 0).toLocaleString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(client.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                      >
                        <option value="TAYYOR" className="bg-slate-900">Tayyor</option>
                        <option value="TOPSHIRILDI" className="bg-slate-900">Topshirildi</option>
                        <option value="ARXIV" className="bg-slate-900">Arxiv</option>
                      </select>

                      <button
                        onClick={() => handleExport(client.id, client.name)}
                        disabled={downloadingId === client.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 font-mono text-xs transition"
                        title="SQLite faylni yuklab olish"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === client.id ? 'Yuklanmoqda...' : '.DB Yuklash'}
                      </button>

                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        disabled={deletingId === client.id}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
