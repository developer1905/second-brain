'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, Eye, EyeOff, Zap, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || "Kirish muvaffaqiyatsiz");
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#020617]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.08) 0%, transparent 55%)',
      }}
    >
      {/* Animated grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/40 animate-pulse"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 shadow-glowCyan mb-2">
            <Brain className="w-10 h-10 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Ikkinchi Miya
            </h1>
            <p className="text-sm text-cyan-400 font-mono mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Neural Knowledge System · P.A.R.A v2.0
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-base font-bold text-slate-200 mb-6 font-mono text-center">
            🔐 Hisobingizga kiring
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                Email manzil
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sizning@email.com"
                className="w-full h-11 px-4 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-10 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition"
                  required
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
              <div className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-glowCyan transition active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="animate-pulse font-mono text-xs">Tekshirilmoqda...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Neyron Miyaga Kirish
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 font-mono">
          Hisobingiz yo'qmi? Admin bilan bog'laning.
        </p>
      </div>
    </div>
  );
}
