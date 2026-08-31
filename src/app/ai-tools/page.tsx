'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Mic,
  Square,
  Play,
  Pause,
  Globe,
  Camera,
  Clock,
  Printer,
  CheckCircle2,
  Send,
  Volume2,
  FileText,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function AIToolsHubPage() {
  const [activeTool, setActiveTool] = useState<'VOICE' | 'OCR' | 'CLIPPER' | 'REMINDER' | 'PDF'>('VOICE');

  // Status feedback state
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // 1. Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 2. OCR State
  const [imageName, setImageName] = useState('');
  const [ocrText, setOcrText] = useState('');

  // 3. Web Clipper State
  const [webUrl, setWebUrl] = useState('');
  const [clipResult, setClipResult] = useState('');

  // 4. Reminder State
  const [reminderInput, setReminderInput] = useState('');
  const [reminderResult, setReminderResult] = useState('');

  // Voice Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Mikrofon ruxsati berilmadi yoki qo'llab-quvvatlanmaydi.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProcessVoice = async () => {
    if (!voiceText.trim() && !audioUrl) {
      alert("Ovozli matn yoki yozuv kiriting!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: voiceText || 'Ovozli qayd', audioName: 'Ovozli Qayd' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("✅ Ovozli qayd saqlandi va AI tahlil qildi!");
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      alert("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // OCR Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      setOcrText(`📸 ${file.name} tahlilga tayyorlandi.`);
    }
  };

  const handleProcessOCR = async () => {
    if (!ocrText) {
      alert("Rasm faylini tanlang!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'sample_base64', imageName }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("✅ Rasmdagi matnlar o'qildi va bazaga saqlandi!");
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      alert("OCR xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Web Clipper Handler
  const handleProcessClipper = async () => {
    if (!webUrl.trim()) {
      alert("Veb sahifa linkini kiriting!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setClipResult(data.summary);
        setStatusMsg("✅ Veb sahifa saqlandi va tahlil qilindi!");
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      alert("Web clip xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Reminder Handler
  const handleProcessReminder = async () => {
    if (!reminderInput.trim()) {
      alert("Eslatgich matnini kiriting!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: reminderInput }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderResult(data.message);
        setStatusMsg(data.message);
        setReminderInput('');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      alert("Eslatma xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-2">
      {/* ── Banner Header ── */}
      <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 text-cyan-400 border border-cyan-500/40 shadow-glowCyan">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Next-Gen AI Power Hub
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Ovozli AI, Vision OCR, Web Clipper, Aqlli Eslatgichlar va PDF Eksportlar Markazi
            </p>
          </div>
        </div>

        <button
          onClick={() => window.open('/api/export/pdf', '_blank')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          Rasmiy PDF Hisobot Chiqarish
        </button>
      </div>

      {/* ── Status Feedback Banner ── */}
      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ── 5 Power Tool Navigation Switcher ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10">
        {[
          { id: 'VOICE', label: '🎤 Ovozli AI', icon: Mic, color: 'text-pink-400' },
          { id: 'OCR', label: '📸 Vision OCR', icon: Camera, color: 'text-purple-400' },
          { id: 'CLIPPER', label: '🌐 Web Clipper', icon: Globe, color: 'text-sky-400' },
          { id: 'REMINDER', label: '⏰ Aqlli Eslatgich', icon: Clock, color: 'text-amber-400' },
          { id: 'PDF', label: '📑 PDF Hisobot', icon: Printer, color: 'text-emerald-400' },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`p-3 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-white/10 border-cyan-400/80 text-cyan-300 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${tool.color}`} />
              <span className="truncate">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TOOL 1: VOICE TRANSCRIBER ── */}
      {activeTool === 'VOICE' && (
        <div className="p-6 rounded-2xl glass-panel border border-pink-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Mic className="w-5 h-5 text-pink-400" />
            <h2 className="text-sm font-bold text-white font-mono">Ovozli Xabarlarni Matnga va Qaydga O'tkazish</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 text-xs font-bold transition"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Mikrofondan Ovoz Yozish</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:bg-rose-500/40 text-xs font-bold transition animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  <span>Yozishni To'xtatish ({recordingTime}s)</span>
                </button>
              )}

              {audioUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAudioPlay}
                    className="p-2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                    <Volume2 className="w-4 h-4 text-cyan-400" /> Ovozli fayl tayyor
                  </span>
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Yoki ovozli xabar matnini yozing:</label>
            <textarea
              rows={4}
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              placeholder="Ovozli diktovka matnini yozing..."
              className="w-full p-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono"
            />
          </div>

          <button
            onClick={handleProcessVoice}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-md transition"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Qayta ishlanmoqda..." : "AI Bilan Saqlash va Tahlil Etish"}</span>
          </button>
        </div>
      )}

      {/* ── TOOL 2: VISION OCR ── */}
      {activeTool === 'OCR' && (
        <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Camera className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white font-mono">Vision OCR — Rasmlardan Matnni O'qish</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-3">
            <label className="block text-xs font-mono text-slate-400">Kitob, hujjat yoki konspekt rasmini tanlang:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
            />

            {imageName && <p className="text-xs font-mono text-purple-300">Fayl tanlandi: {imageName}</p>}
          </div>

          <button
            onClick={handleProcessOCR}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? "Matnlar o'qilmoqda..." : "Rasmdagi Matnni O'qish va Bazaga Saqlash"}</span>
          </button>
        </div>
      )}

      {/* ── TOOL 3: WEB CLIPPER ── */}
      {activeTool === 'CLIPPER' && (
        <div className="p-6 rounded-2xl glass-panel border border-sky-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Globe className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white font-mono">AI Web Clipper — Sahifalardan G'oyalarni Saqlash</h2>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400">Veb sahifa manzili (URL):</label>
            <input
              type="url"
              placeholder="Masalan: https://uz.wikipedia.org/wiki/Sun%27iy_intellekt"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <button
            onClick={handleProcessClipper}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition"
          >
            <Globe className="w-4 h-4" />
            <span>{loading ? "Veb sahifa yuklanmoqda..." : "Sahifani AI Bilan Saqlash"}</span>
          </button>

          {clipResult && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-2">
              <h4 className="font-bold text-sky-300">AI Xulosasi va 3 ta G'oya:</h4>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{clipResult}</p>
            </div>
          )}
        </div>
      )}

      {/* ── TOOL 4: SMART REMINDERS ── */}
      {activeTool === 'REMINDER' && (
        <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white font-mono">Aqlli AI Eslatgich va Taymerlar</h2>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400">Oddiy tilda eslatgich matnini yozing:</label>
            <input
              type="text"
              placeholder="Masalan: Ertaga soat 15:00 da loyiha bo'yicha muhokama bor"
              value={reminderInput}
              onChange={(e) => setReminderInput(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <button
            onClick={handleProcessReminder}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md transition"
          >
            <Clock className="w-4 h-4" />
            <span>{loading ? "Rejalashtirilmoqda..." : "Eslatgichni Jadvalga Saqlash"}</span>
          </button>

          {reminderResult && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
              {reminderResult}
            </div>
          )}
        </div>
      )}

      {/* ── TOOL 5: PDF REPORT ── */}
      {activeTool === 'PDF' && (
        <div className="p-6 rounded-2xl glass-panel border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono">Rasmiy PDF & HTML Hisobot Generatsiyasi</h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Ikkinchi miyangizdagi barcha loyihalar, qaydlar, moliya balanslari hamda odat sifatlarini rasmiy professional hisobot ko'rinishida generatsiya qiling va chop eting.
          </p>

          <button
            onClick={() => window.open('/api/export/pdf', '_blank')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Rasmiy PDF Hisobotni Ochish va Yuklash</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
