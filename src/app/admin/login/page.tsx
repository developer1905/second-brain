'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Lock, Eye, EyeOff, Zap } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || "Noto'g'ri parol");
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]" style={{
      backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)',
    }}>
      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 mb-4 shadow-glowCyan">
            <Brain className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Admin Panel</h1>
          <p className="text-sm text-slate-400 font-mono">Second Brain AI · Mijoz Boshqaruvi</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-xs font-mono text-slate-400 border border-white/10 rounded-xl p-3 bg-white/5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Kirish uchun admin parolni kiriting</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                🔑 Admin Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting..."
                  className="w-full h-11 px-4 pr-10 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-sm shadow-glowCyan transition active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse font-mono text-xs">Tekshirilmoqda...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Admin Paneliga Kirish</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 font-mono">
          Second Brain AI · P.A.R.A v2.0 · Admin Only
        </p>
      </div>
    </div>
  );
}
