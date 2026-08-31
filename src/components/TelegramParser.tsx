'use client';

import React, { useState, useEffect } from 'react';
import { Send, UploadCloud, CheckCircle2, FileJson, Sparkles, MessageSquare, AlertCircle, Database, MessageCircleCode, Eye, PlusCircle } from 'lucide-react';
import { TelegramChatBrowser } from './TelegramChatBrowser';

export const TelegramParser: React.FC = () => {
  const [mode, setMode] = useState<'browser' | 'upload'>('browser');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalMessages: number; totalChats: number } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ingest/telegram');
      if (res.ok) {
        const data = await res.json();
        setStats({ totalMessages: data.totalMessages, totalChats: data.totalChats });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);
      } catch (err) {
        alert("Faylni o'qishda xatolik yuz berdi");
      }
    };
    reader.readAsText(file);
  };

  const handleProcessTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let bodyData: any = {};
      if (fileContent) {
        bodyData = JSON.parse(fileContent);
      } else if (rawText.trim()) {
        bodyData = { rawText };
      } else {
        alert("Fayl yuklang yoki matn kiriting!");
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ingest/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResultMsg(data.message);
      setFileContent(null);
      setRawText('');
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/80 border border-white/10">
          <button
            onClick={() => setMode('browser')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'browser'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-glowCyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Chatlar va Fayllar Eksploreri (403 Chat)</span>
          </button>

          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'upload'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-glowCyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Yangi JSON Import / Export Sync</span>
          </button>
        </div>
      </div>

      {mode === 'browser' ? (
        <TelegramChatBrowser />
      ) : (
        <div className="w-full max-w-3xl mx-auto p-6 md:p-8 rounded-2xl glass-panel border border-sky-500/30 shadow-glowCyan space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Telegram Data Sync & Parser
              </h3>
              <p className="text-xs text-slate-400">
                Telegram exports (`DataExport` / `result.json`) fayllari va Saqlangan xabarlarni neyron grafik bilan bog'lash
              </p>
            </div>
          </div>

          {/* Sync Stats Banner */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-sky-950/40 border border-sky-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-mono block">Sinxronlangan xabarlar</span>
                  <span className="text-lg font-extrabold text-white font-mono">{stats.totalMessages.toLocaleString()} ta</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <MessageCircleCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-mono block">Mavjud Chatlar</span>
                  <span className="text-lg font-extrabold text-white font-mono">{stats.totalChats.toLocaleString()} ta chat</span>
                </div>
              </div>
            </div>
          )}

          {resultMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{resultMsg}</span>
            </div>
          )}

          <form onSubmit={handleProcessTelegram} className="space-y-5">
            {/* Drag & Drop JSON Uploader */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-sky-500/40 bg-slate-950/60 hover:bg-slate-950/80 transition text-center space-y-3 relative cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileJson className="w-10 h-10 text-sky-400 mx-auto animate-pulse" />
              <div>
                <span className="text-sm font-bold text-white block">
                  {fileContent ? "Telegram JSON Fayli Yuklandi!" : "Telegram result.json faylini tanlang yoki bura suring"}
                </span>
                <span className="text-xs text-slate-400">Telegram Desktop &gt; Settings &gt; Export Telegram Data &gt; JSON format</span>
              </div>
            </div>

            {/* Text Input Fallback */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">
                Yoki Telegram xabarlari matnini to'g'ridan-to'g'ri joylashtiring:
              </label>
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Telegram kanal posts yoki saqlangan xabarlar nusxasi..."
                className="w-full p-3 text-xs font-mono bg-slate-950/80 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-glowCyan transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Pars Qilinmoqda..." : "Telegram Resurslarini Neyron Miyaga Qo'shish"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
