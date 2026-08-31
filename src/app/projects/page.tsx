'use client';

import React, { useEffect, useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ProjectItem } from '@/lib/types';
import { FolderKanban, Plus, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('AI,Loyiha');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.filter((p: any) => !p.isArchived));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, deadline, tags }),
      });

      if (res.ok) {
        setName('');
        setDescription('');
        setIsCreating(false);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glowCyan">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Loyihalar (Projects)
            </h1>
            <p className="text-xs text-slate-400">
              Aniq tugash muddati bor maqsadlar, Kanban doskasi va progress nazorati
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-glowCyan transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Loyiha</span>
        </button>
      </div>

      {/* New Project Creator */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="p-6 rounded-2xl glass-panel border border-cyan-500/50 space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-cyan-400 uppercase font-mono">Yangi Loyiha Yaratish</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Loyiha Nomi (masalan: O'zbek Voice Bot)..."
              className="h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-10 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Loyiha maqsadi va qisqacha tavsifi..."
            className="w-full p-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition"
            >
              Yaratish
            </button>
          </div>
        </form>
      )}

      {/* Main Kanban Board Component */}
      {loading ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-xs text-cyan-400 font-mono">
          Loyihalar yuklanmoqda...
        </div>
      ) : (
        <KanbanBoard projects={projects} onRefresh={fetchProjects} />
      )}
    </div>
  );
}
