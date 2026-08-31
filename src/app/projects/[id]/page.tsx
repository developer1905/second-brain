'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit,
  Tag,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setEditName(data.name);
        setEditDesc(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Ushbu loyihani o'chirib tashlashni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/projects');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          projectId: projectId,
          priority: 'HIGH',
        }),
      });

      if (res.ok) {
        setNewTaskTitle('');
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: nextStatus }),
      });
      if (res.ok) fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-xs text-cyan-400 font-mono">
        Loyiha ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 glass-panel rounded-2xl text-center text-red-400 space-y-3">
        <h3 className="text-base font-bold">Loyiha topilmadi</h3>
        <button onClick={() => router.push('/projects')} className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold">
          Loyihalarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-white/10">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Loyihalar Ro'yxatiga Qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Tahrirlash</span>
          </button>

          <button
            onClick={handleDeleteProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>O'chirish</span>
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleUpdateProject} className="p-6 rounded-2xl glass-panel border border-cyan-500/50 space-y-4">
          <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono">Loyihani Tahrirlash</h3>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
          />
          <textarea
            rows={3}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full p-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-slate-400">Bekor qilish</button>
            <button type="submit" className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold">Saqlash</button>
          </div>
        </form>
      )}

      {/* Project Main Banner */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel border border-cyan-500/30 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glowCyan">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold">LOYIHA DETAILS</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{project.name}</h1>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            {project.status}
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Loyiha Bajarilishi:</span>
            <span className="text-cyan-400 font-bold">{project.progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Loyiha Vazifalari ({project.tasks.length})
          </h3>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Yangi vazifa sarlavhasi..."
            className="flex-1 h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold">
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2">
          {project.tasks.map((task: any) => (
            <div
              key={task.id}
              onClick={() => handleToggleTaskStatus(task.id, task.status)}
              className="p-3 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 flex items-center justify-between text-xs cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'DONE'}
                  onChange={() => {}}
                  className="accent-cyan-400 cursor-pointer"
                />
                <span className={task.status === 'DONE' ? 'line-through text-slate-500' : 'text-slate-200 font-semibold'}>
                  {task.title}
                </span>
              </div>

              <span className="text-[10px] font-mono text-cyan-400">{task.priority}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Notes */}
      {project.notes && project.notes.length > 0 && (
        <div className="p-6 rounded-2xl glass-panel border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Biriktirilgan Qaydlar ({project.notes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.notes.map((n: any) => (
              <Link
                key={n.id}
                href={`/notes/${n.id}`}
                className="p-3 rounded-xl bg-slate-950/60 border border-white/5 hover:border-purple-500/40 text-xs text-purple-300 font-bold block transition"
              >
                [[{n.title}]]
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
