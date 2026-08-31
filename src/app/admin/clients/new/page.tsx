'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  DollarSign,
  FileText,
  Lock,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    price: '',
    notes: '',
    password: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Mijoz ismi majburiy');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: form.price ? parseFloat(form.price) : 0,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/admin'), 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Xatolik yuz berdi");
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-11 px-4 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition font-mono";
  const labelClass = "block text-xs font-bold text-slate-300 mb-1.5 font-mono";

  return (
    <div className="min-h-screen bg-[#020617] text-white" style={{
      backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.07) 0%, transparent 55%)',
    }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white">Yangi Varoq Yaratish</h1>
              <p className="text-xs text-slate-400 font-mono">Yangi mijoz uchun tozalangan Second Brain</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="font-bold text-cyan-300 mb-1">Yangi varoq nima?</p>
            <p>
              Xuddi daftarning yangi, bo'sh varag'i kabi — bu mijoz uchun to'liq tozalangan,
              sizning shaxsiy ma'lumotlaringizdan <strong>hech qanday ma'lumot qolmagan</strong> yangi Second Brain tizimi yaratiladi.
              Mijoz keyinchalik o'z Telegram, kitob va qaydlarini kiritadi.
            </p>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col items-center gap-3 text-center animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-300 text-lg">Muvaffaqiyatli yaratildi!</p>
              <p className="text-xs text-slate-400 font-mono mt-1">Admin panelga yo'naltirilmoqda...</p>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-8 space-y-5 shadow-2xl">
            {/* Name */}
            <div>
              <label className={labelClass}>
                <User className="w-3.5 h-3.5 inline mr-1 text-cyan-400" /> Mijoz Ismi *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Masalan: Alisher Karimov"
                className={inputClass}
                autoFocus
                required
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Phone className="w-3.5 h-3.5 inline mr-1 text-emerald-400" /> Telefon
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="+998 90 123 45 67"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Mail className="w-3.5 h-3.5 inline mr-1 text-blue-400" /> Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="alisher@gmail.com"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className={labelClass}>
                <Lock className="w-3.5 h-3.5 inline mr-1 text-amber-400" /> Kirish Paroli * <span className="text-slate-500 font-normal">(mijoz shu parol bilan kiradi)</span>
              </label>
              <input
                type="text"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Masalan: Alisher2026!"
                className={inputClass}
                required
              />
            </div>

            {/* Company & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Building2 className="w-3.5 h-3.5 inline mr-1 text-purple-400" /> Kompaniya / Tashkilot
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={handleChange('company')}
                  placeholder="Masalan: TechUz LLC"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <DollarSign className="w-3.5 h-3.5 inline mr-1 text-amber-400" /> Narxi (USD)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={handleChange('price')}
                  placeholder="2000"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>
                <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> Izoh / Eslatma
              </label>
              <textarea
                value={form.notes}
                onChange={handleChange('notes')}
                placeholder="Mijoz haqida qisqacha izoh (ixtiyoriy)..."
                rows={3}
                className="w-full px-4 py-3 text-sm bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition font-mono resize-none"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 font-mono">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-glowCyan transition active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse font-mono">Yaratilmoqda...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  ✨ Yangi Varoq Yaratish
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
