'use client';

import React, { useState } from 'react';
import { Github, RefreshCw, CheckCircle2, Star, GitFork, ExternalLink, Code } from 'lucide-react';

export const GithubSync: React.FC = () => {
  const [username, setUsername] = useState('octocat');
  const [token, setToken] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const handleGithubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/ingest/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token, repoUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResultMsg(data.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-8 rounded-2xl glass-panel border border-emerald-500/30 shadow-glowCyan space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <Github className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            GitHub Projects & Repos Ingest
          </h3>
          <p className="text-xs text-slate-400">
            Repozitoriyalarni, README fayllarini va commit ma'lumotlarini P.A.RA "Loyihalar" moduliga sinxronlash
          </p>
        </div>
      </div>

      {resultMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{resultMsg}</span>
        </div>
      )}

      <form onSubmit={handleGithubSync} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">GitHub Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="masalan: user"
            className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Personal Access Token (PAT) - Ixtiyoriy:</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Yoki Aloxida Repository URL:</label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-glowCyan transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? "Sinxronlanmoqda..." : "GitHub Repozitoriyalarini Sinxronlash"}</span>
        </button>
      </form>
    </div>
  );
};
