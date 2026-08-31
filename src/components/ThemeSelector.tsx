'use client';

import React from 'react';
import { useTheme, AppTheme } from './ThemeProvider';
import { Palette, Moon, Sun, Trees } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { id: AppTheme; name: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'cyberpunk-dark',
      name: 'Cyberpunk Neoni',
      icon: Moon,
      color: 'from-cyan-500 to-purple-600',
      desc: 'Toq obsidian fonda neon nurlar (Default)',
    },
    {
      id: 'bootstrap-blue',
      name: 'Bootstrap Oq-Kok',
      icon: Sun,
      color: 'from-blue-500 to-sky-400',
      desc: 'Oq fonda klassik Bootstrap Royal Blue dizayn',
    },
    {
      id: 'emerald-forest',
      name: 'Obsidian Zumrad Yashil',
      icon: Trees,
      color: 'from-emerald-500 to-teal-400',
      desc: 'Zumrad ormon toq yashil premium dizayni',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
        <Palette className="w-4 h-4 text-cyan-400" />
        <span>Dizayn Mavzusini Tanlang (3 ta Tizim)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                isActive
                  ? 'border-cyan-400/80 bg-white/10 ring-2 ring-cyan-500/40 shadow-lg scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-gradient-to-r ${t.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    FAOL
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-white font-mono">{t.name}</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
