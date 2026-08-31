'use client';

import React, { useEffect, useRef } from 'react';
import { GraphNode, GraphLink } from '@/lib/types';
import { Network, Sparkles } from 'lucide-react';

interface LocalGraphProps {
  currentNodeId: string;
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode?: (id: string) => void;
}

export const LocalGraph: React.FC<LocalGraphProps> = ({
  currentNodeId,
  nodes,
  links,
  onSelectNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filter 1-hop and 2-hop neighbor nodes around current node
  const neighborIds = new Set<string>([currentNodeId]);
  
  // 1-hop
  links.forEach((l) => {
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
    if (src === currentNodeId) neighborIds.add(tgt);
    if (tgt === currentNodeId) neighborIds.add(src);
  });

  // 2-hop
  links.forEach((l) => {
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
    if (neighborIds.has(src) || neighborIds.has(tgt)) {
      neighborIds.add(src);
      neighborIds.add(tgt);
    }
  });

  const localNodes = nodes.filter((n) => neighborIds.has(n.id));
  const localLinks = links.filter((l) => {
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
    return neighborIds.has(src) && neighborIds.has(tgt);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 320);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 220);
    const centerX = width / 2;
    const centerY = height / 2;

    const render = () => {
      angle += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Background radial glow
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, width / 2);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const count = localNodes.length;
      const radius = Math.min(width, height) * 0.35;

      // Project positions around circle
      const positions = localNodes.map((node, i) => {
        if (node.id === currentNodeId) {
          return { ...node, x: centerX, y: centerY };
        }
        const a = angle + (i * 2 * Math.PI) / Math.max(count - 1, 1);
        return {
          ...node,
          x: centerX + Math.cos(a) * radius,
          y: centerY + Math.sin(a) * radius,
        };
      });

      const posMap = new Map(positions.map((p) => [p.id, p]));

      // Draw connections
      localLinks.forEach((l) => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const p1 = posMap.get(srcId);
        const p2 = posMap.get(tgtId);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p1.id === currentNodeId || p2.id === currentNodeId ? 'rgba(0, 243, 255, 0.4)' : 'rgba(157, 78, 221, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw nodes
      positions.forEach((p) => {
        const isCenter = p.id === currentNodeId;
        const r = isCenter ? 10 : 6;

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = isCenter ? 'rgba(0, 243, 255, 0.25)' : 'rgba(168, 85, 247, 0.15)';
        ctx.fill();

        // Node core
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isCenter ? '#00f3ff' : p.color || '#38bdf8';
        ctx.fill();

        // Label
        ctx.fillStyle = isCenter ? '#ffffff' : '#94a3b8';
        ctx.font = isCenter ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        const labelText = p.label.length > 18 ? p.label.slice(0, 16) + '..' : p.label;
        ctx.fillText(labelText, p.x, p.y + r + 12);
      });

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrame);
  }, [currentNodeId, localNodes.length, localLinks.length]);

  return (
    <div className="rounded-2xl glass-panel border border-cyan-500/30 p-3 space-y-2 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          Mahalliy Neyron Tarmoq (Local Graph)
        </h4>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
          {localNodes.length} tugun · {localLinks.length} sinaps
        </span>
      </div>

      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/5">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
};
