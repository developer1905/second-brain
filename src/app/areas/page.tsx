'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Activity, Briefcase, DollarSign, BookOpen, Plus, FolderKanban, FileText, ArrowRight } from 'lucide-react';
import { AreaItem } from '@/lib/types';
import Link from 'next/link';

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/areas');
      if (res.ok) {
        const data = await res.json();
        setAreas(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return Activity;
      case 'DollarSign': return DollarSign;
      case 'BookOpen': return BookOpen;
      default: return Briefcase;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-glowViolet">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              Sohalar (Areas of Responsibility)
            </h1>
            <p className="text-xs text-slate-400">
              Doimiy e'tibor va yuqori standartlarni talab qiladigan hayotiy domenlar
            </p>
          </div>
        </div>
      </div>

      {/* Areas Grid */}
      {loading ? (
        <div className="p-12 glass-panel rounded-2xl text-center text-xs text-purple-400 font-mono">
          Hayotiy sohalar yuklanmoqda...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {areas.map((area) => {
            const Icon = getIconComponent(area.icon);
            return (
              <div
                key={area.id}
                className="p-6 rounded-2xl glass-panel glass-panel-hover border border-purple-500/20 space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{area.name}</h3>
                      {area.metric && (
                        <span className="text-[11px] font-mono text-cyan-400 font-semibold block mt-0.5">
                          {area.metric}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{area.description}</p>

                {/* Bottom Stats */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {(area as any).projects?.length || 0} ta Loyiha
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <FileText className="w-3.5 h-3.5" />
                      {(area as any).notes?.length || 0} ta Qayd
                    </span>
                  </div>

                  <Link
                    href="/projects"
                    className="flex items-center gap-1 text-purple-300 hover:text-white font-bold transition"
                  >
                    <span>Ko'rish</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
