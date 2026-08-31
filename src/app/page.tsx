'use client';

import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { GraphNode, GraphLink } from '@/lib/types';
import { Brain, FolderKanban, Network, Sparkles, RefreshCw, Layers, Expand } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Lazy load NeuralGraph to avoid SSR canvas issues and heavy initial bundle
const NeuralGraph = lazy(() =>
  import('@/components/NeuralGraph').then((m) => ({ default: m.NeuralGraph }))
);

// ── Skeleton Loader ──────────────────────────────────────────────────────────
function GraphSkeleton({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#090d16]">
      {/* Animated neural network skeleton */}
      <div className="relative w-32 h-32 md:w-40 md:h-40">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-cyan-500/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
        {/* Center brain */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30">
            <Brain className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 animate-pulse" />
          </div>
        </div>
        {/* Orbiting dots */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-cyan-400/60"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(56px) translateY(-50%)`,
              animation: `pulse ${1.5 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <div className="text-center space-y-1.5">
        <p className="text-sm md:text-base font-mono font-bold text-cyan-400 tracking-wider">
          {message}
        </p>
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
              style={{
                animation: 'bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[]; meta?: any }>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Neyron tarmoq yuklanmoqda...');
  const [isFullMode, setIsFullMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fetchGraph = useCallback(async (filters?: any, fullMode = false) => {
    setLoading(true);
    setLoadingMsg(fullMode ? 'To\'liq dataset yuklanmoqda...' : 'Neyron tarmoq yuklanmoqda...');
    try {
      const params = new URLSearchParams();
      if (fullMode) params.set('mode', 'full');
      if (filters) {
        if (filters.includeNotes !== undefined) params.set('includeNotes', filters.includeNotes.toString());
        if (filters.includeProjects !== undefined) params.set('includeProjects', filters.includeProjects.toString());
        if (filters.includeBooks !== undefined) params.set('includeBooks', filters.includeBooks.toString());
        if (filters.includeGithub !== undefined) params.set('includeGithub', filters.includeGithub.toString());
        if (filters.includeTelegram !== undefined) params.set('includeTelegram', filters.includeTelegram.toString());
      }

      const url = `/api/graph${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchGraph();

    const handleFilterChange = (e: any) => {
      if (e.detail) fetchGraph(e.detail, isFullMode);
    };
    window.addEventListener('source-filter-change', handleFilterChange);
    return () => window.removeEventListener('source-filter-change', handleFilterChange);
  }, [fetchGraph, isFullMode]);

  const handleSelectNode = (node: GraphNode) => {
    const rawId = node.id.replace(/^(note|project|area|resource|telegram|github|book|finance|habit|flashcard)-/, '');
    if (node.id.startsWith('note-'))      router.push(`/notes/${rawId}`);
    else if (node.id.startsWith('project-')) router.push(`/projects/${rawId}`);
    else if (node.id.startsWith('area-'))   router.push(`/areas/${rawId}`);
    else if (node.id.startsWith('resource-')) router.push(`/resources/${rawId}`);
  };

  const handleLoadFull = () => {
    setIsFullMode(true);
    fetchGraph(undefined, true);
  };

  const projectsCount = graphData.nodes.filter((n) => n.category === 'PROJECT').length;

  return (
    <div className="flex flex-col gap-2 h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-5.5rem)] w-full overflow-hidden">
      {/* ── Top Banner ─────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-950/60 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Brain className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-extrabold text-white tracking-wide font-mono flex items-center gap-1.5">
              3D NEURAL SPHERE
              {isFullMode && (
                <span className="px-1.5 py-0.5 text-[9px] font-sans font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">FULL</span>
              )}
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {graphData.meta ? `${graphData.meta.totalNodes} tugun · ${graphData.meta.totalLinks} sinaps` : 'Sfera neyron bilimlar bazasi'}
            </p>
          </div>
        </div>

        {/* HUD Metrics */}
        <div className="flex items-center gap-1 text-[11px] font-mono flex-wrap justify-end">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="font-bold">{graphData.nodes.length}</span>
            <span className="hidden sm:inline text-slate-400">Tugun</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-purple-300">
            <FolderKanban className="w-3 h-3 text-purple-400" />
            <span className="font-bold">{projectsCount}</span>
            <span className="hidden sm:inline text-slate-400">Loyiha</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-amber-300">
            <Network className="w-3 h-3 text-amber-400" />
            <span className="font-bold">{graphData.links.length}</span>
            <span className="hidden sm:inline text-slate-400">Sinaps</span>
          </div>

          {/* Load Full button */}
          {!isFullMode && !loading && (
            <button
              onClick={handleLoadFull}
              title="Barcha ma'lumotlarni yuklash (Finance, Odat, Flashcard)"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition font-bold text-[10px]"
            >
              <Expand className="w-3 h-3" />
              <span className="hidden sm:inline">To&apos;liq</span>
            </button>
          )}

          <button
            onClick={() => fetchGraph(undefined, isFullMode)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition font-bold"
            title="Neyron grafikni qayta yuklash"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yangi</span>
          </button>
        </div>
      </div>

      {/* ── Graph Canvas ─────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0 glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
        {loading && <GraphSkeleton message={loadingMsg} />}

        {!loading && isMounted && (
          <Suspense fallback={<GraphSkeleton message="3D Canvas ishga tushmoqda..." />}>
            <NeuralGraph
              nodes={graphData.nodes}
              links={graphData.links}
              onSelectNode={handleSelectNode}
            />
          </Suspense>
        )}

        {/* Node count info bar */}
        {!loading && !isFullMode && graphData.nodes.length > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={handleLoadFull}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-white/10 text-[11px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition backdrop-blur-md"
            >
              <Layers className="w-3 h-3" />
              Moliya, Odat, Flashcard ko&apos;rsatish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
