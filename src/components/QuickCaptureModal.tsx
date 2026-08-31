'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Tag,
  FolderKanban,
  Layers,
  BookMarked,
  Sparkles,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'PROJECT' | 'AREA' | 'RESOURCE' | 'ARCHIVE'>('RESOURCE');
  const [tags, setTags] = useState('Tezkor,Qayd');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Voice memo Web Audio API recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open modal
          const btn = document.querySelector('[data-quick-capture-btn]') as HTMLButtonElement;
          btn?.click();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Voice recording handlers using Web Audio API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Mikrofon ruxsati berilmadi yoki qo'llab-quvvatlanmaydi!");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim() && !audioUrl) {
      alert("Matn yoki ovozli memo kiriting!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/quick-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          sourceType: audioUrl ? 'VOICE' : 'NOTE',
          tags,
          audioData: audioUrl ? 'AUDIO_BLOB_RECORDED' : undefined,
        }),
      });

      if (!res.ok) throw new Error("Saqlashda xatolik yuz berdi");

      setSuccessMsg("Eslatma neyron miyaga saqlandi!");
      setTimeout(() => {
        setTitle('');
        setContent('');
        setAudioUrl(null);
        setSuccessMsg('');
        setLoading(false);
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl p-6 rounded-2xl glass-panel border border-cyan-500/40 shadow-glowCyan text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                Tezkor Qayd & Ovozli Memo
              </h3>
              <p className="text-xs text-slate-400">Cmd+K / Ctrl+K orqali har doim ochiq</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Qayd sarlavhasi (ixtiyoriy)..."
              className="w-full h-10 px-3 text-sm bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
            />
          </div>

          {/* Content Area with [[Backlink]] indicator */}
          <div className="relative">
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O'ylaringizni yozing... Qaydlarni bog'lash uchun [[Note Title]] ishlating."
              className="w-full p-3 text-sm bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition resize-none"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-cyan-400 font-mono">
              [[Backlink]] qo'llab-quvvatlanadi
            </span>
          </div>

          {/* Voice Memo Web Audio API Section */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/40 hover:bg-pink-500/30 text-xs font-semibold transition"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Ovoz Yozish</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/30 text-red-300 border border-red-500/50 hover:bg-red-500/40 text-xs font-semibold transition animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  <span>To'xtatish ({recordingTime}s)</span>
                </button>
              )}

              {audioUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAudioPlay}
                    className="p-2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    Ovozli xabar tayyor
                  </span>
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-mono">Web Audio API • Ovozli Eslatgich</span>
          </div>

          {/* PARA Category Selection Pills */}
          <div>
            <label className="block text-xs text-slate-400 font-mono mb-2">PARA Kategoriya:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'PROJECT', label: 'Loyiha', icon: FolderKanban, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
                { id: 'AREA', label: 'Soha', icon: Layers, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
                { id: 'RESOURCE', label: 'Resurs', icon: BookMarked, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
                { id: 'ARCHIVE', label: 'Arxiv', icon: X, color: 'text-slate-400 border-slate-500/40 bg-slate-500/10' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as any)}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-semibold transition ${
                      isSelected ? item.color + ' ring-1 ring-white/30' : 'bg-slate-950/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Input */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Teglar (vergul bilan): Dasturlash, Fikr, AI..."
              className="flex-1 h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-medium text-xs shadow-glowCyan transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Saqlanmoqda..." : "Neyron Miyaga Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
