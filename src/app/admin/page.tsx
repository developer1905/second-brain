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

  useEffect(() => { fetchClients(); }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
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

      // Mark as delivered
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
      {/* Fixed grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white">Admin Panel</h1>
              <p className="text-xs text-slate-400 font-mono">Second Brain AI · Mijoz Boshqaruvi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchClients} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition" title="Yangilash">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 text-xs font-mono transition">
              <LogOut className="w-4 h-4" /> Chiqish
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => {
              const statusCfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.TAYYOR;
              const StatusIcon = statusCfg.icon;
              return (
                <div
                  key={client.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-sm p-5 space-y-4 hover:border-cyan-500/30 transition group"
                >
                  {/* Client Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border border-purple-500/20 text-purple-200">
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">{client.name}</h3>
                        {client.company && (
                          <p className="text-xs text-slate-400 font-mono">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono flex items-center gap-1 ${statusCfg.color}`}>
                      <StatusIcon className="w-3 h-3" /> {statusCfg.label}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-400 font-mono">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-500" /> {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500" /> {client.email}
                      </div>
                    )}
                    {client.price > 0 && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <DollarSign className="w-3 h-3" /> ${client.price.toLocaleString()} USD
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3 h-3" /> {new Date(client.createdAt).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>

                  {/* Notes */}
                  {client.notes && (
                    <p className="text-xs text-slate-500 italic border-t border-white/5 pt-3 line-clamp-2">
                      {client.notes}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <button
                      onClick={() => handleExport(client.id, client.name)}
                      disabled={downloadingId === client.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold transition disabled:opacity-50"
                      title="Bo'sh DB faylini yuklab olish"
                    >
                      {downloadingId === client.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Eksport
                    </button>

                    <select
                      value={client.status}
                      onChange={(e) => handleStatusChange(client.id, e.target.value)}
                      className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500/40 cursor-pointer"
                    >
                      <option value="TAYYOR">✅ Tayyor</option>
                      <option value="TOPSHIRILDI">📦 Topshirildi</option>
                      <option value="ARXIV">🗄️ Arxiv</option>
                    </select>

                    <button
                      onClick={() => handleDelete(client.id, client.name)}
                      disabled={deletingId === client.id}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition disabled:opacity-50"
                      title="O'chirish"
                    >
                      {deletingId === client.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-700 font-mono pt-4 border-t border-white/5">
          Second Brain AI · Admin Panel v1.0 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
