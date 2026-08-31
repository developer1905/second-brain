'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders, ShieldCheck, Download, LogOut, Moon, Sun, Monitor,
  Zap, Database, RefreshCw, Smartphone, CheckCircle2, User, Key, Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeSelector } from '@/components/ThemeSelector';

export default function SettingsPage() {
  const router = useRouter();
  const [fpsLimit, setFpsLimit] = useState('30');
  const [user, setUser] = useState<any>(null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      document.cookie = 'user_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `second_brain_backup_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-6 px-1">
      {/* ── Header Banner ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-4 bg-slate-950/80 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Sliders className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white font-mono">Sozlamalar va Xavfsizlik</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              3 ta Dizayn Mavzusi, 3D grafik tezligi, xavfsizlik va zaxira nusxalari
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 1: 3 Distinct UI Themes Selector ── */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Palette className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white font-mono">Interfeys va Dizayn Mavzulari (3 ta)</h2>
        </div>
        <ThemeSelector />
      </div>

      {/* ── Section 2: User Account & Workspace Isolation ── */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <User className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white font-mono">Foydalanuvchi Hisobi & Izolyatsiya</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <span className="text-slate-400">Foydalanuvchi Nomi:</span>
            <p className="text-sm font-bold text-cyan-300">{user?.name || 'Telegram User'}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <span className="text-slate-400">Elektron Pochtasi:</span>
            <p className="text-sm font-bold text-purple-300">{user?.email || 'Telegram Auth'}</p>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center flex-wrap gap-2">
          <span className="text-xs text-slate-400">
            Boshqa Telegram akkauntdan kirilganda avtomatik yangi izolyatsiyalangan workspace ochiladi.
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Tizimdan Chiqish (Logout)
          </button>
        </div>
      </div>

      {/* ── Section 3: 3D Canvas & Performance Options ── */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white font-mono">3D Grafik va Unumdorlik Rejimi</h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Telefon batareyasi va tezligini tejash uchun kadrlar chastotasini sozlang:
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: '30', label: '⚡ 30 FPS', desc: 'Tejamkor (Mobile)' },
              { id: '60', label: '🚀 60 FPS', desc: 'Silliq (Desktop)' },
              { id: '120', label: '🔥 Ultra', desc: 'Maksimal tezlik' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFpsLimit(item.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  fpsLimit === item.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-mono">{item.label}</span>
                <span className="text-[10px] text-slate-500">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Data Backup & Export ── */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Database className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white font-mono">Zaxira Nusxasi (Backup & Export)</h2>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-300">
              Ikkinchi miyangizdagi barcha qaydlar, loyihalar va ma'lumotlarni JSON fayl ko'rinishida yuklab oling.
            </p>
          </div>
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            {exported ? '✅ Yuklab Olindi!' : 'JSON Zaxira Yuklash'}
          </button>
        </div>
      </div>
    </div>
  );
}
