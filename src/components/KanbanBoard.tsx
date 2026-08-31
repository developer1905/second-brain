'use client';

import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  MoreVertical,
  Trash2,
  FolderKanban,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { ProjectItem, TaskItem } from '@/lib/types';

interface KanbanBoardProps {
  projects: ProjectItem[];
  onRefresh?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projects, onRefresh }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const columns = [
    { id: 'TODO', title: 'Rejada (TODO)', color: 'border-slate-500/50 bg-slate-500/10 text-slate-300' },
    { id: 'IN_PROGRESS', title: 'Bajarilmoqda (IN PROGRESS)', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' },
    { id: 'REVIEW', title: 'Tekshiruvda (REVIEW)', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
    { id: 'DONE', title: 'Bajarildi (DONE)', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
  ];

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          projectId: selectedProjectId,
          priority: newTaskPriority,
        }),
      });

      if (res.ok) {
        setNewTaskTitle('');
        setIsAddingTask(false);
        onRefresh?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      if (res.ok) onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="p-12 rounded-2xl glass-panel text-center text-slate-400 space-y-4">
        <FolderKanban className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white">Loyihalar mavjud emas</h3>
        <p className="text-xs">Yangi loyiha yaratish orqali Kanban doskasini faollashtiring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-cyan-400" />
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block">Faol Loyiha:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-9 px-3 text-sm font-bold bg-slate-950/80 border border-cyan-500/40 rounded-xl text-cyan-300 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.progress}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Progress Bar & Metadata */}
        {selectedProject && (
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">Bajarilish:</span>
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedProject.progress}%</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${selectedProject.progress}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Vazifa</span>
            </button>
          </div>
        )}
      </div>

      {/* New Task Creator Dialog */}
      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="p-4 rounded-2xl glass-panel border border-cyan-500/50 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">Loyiha uchun yangi vazifa qo'shish</h4>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Vazifa nomi..."
              className="flex-1 h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/60"
            />
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="h-9 px-3 text-xs bg-slate-950/80 border border-white/10 rounded-xl text-amber-400 font-bold focus:outline-none"
            >
              <option value="HIGH">Yuqori (High)</option>
              <option value="MEDIUM">O'rta (Medium)</option>
              <option value="LOW">Past (Low)</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition"
            >
              Qo'shish
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = (selectedProject?.tasks || []).filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between min-h-[400px]">
              <div>
                {/* Column Header */}
                <div className={`p-2.5 rounded-xl border text-xs font-bold uppercase font-mono flex items-center justify-between mb-4 ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 hover:border-cyan-500/40 text-xs space-y-2.5 transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-100 leading-snug">{t.title}</span>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono ${
                            t.priority === 'HIGH'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : t.priority === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {t.priority}
                        </span>

                        {/* Move Task Controls */}
                        <div className="flex items-center gap-1">
                          {col.id !== 'TODO' && (
                            <button
                              onClick={() =>
                                handleTaskStatusChange(
                                  t.id,
                                  col.id === 'DONE' ? 'REVIEW' : col.id === 'REVIEW' ? 'IN_PROGRESS' : 'TODO'
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== 'DONE' && (
                            <button
                              onClick={() =>
                                handleTaskStatusChange(
                                  t.id,
                                  col.id === 'TODO' ? 'IN_PROGRESS' : col.id === 'IN_PROGRESS' ? 'REVIEW' : 'DONE'
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:text-white"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-slate-600 text-xs italic">Vazifalar yo'q</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
