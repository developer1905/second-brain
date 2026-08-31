'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GraphNode, GraphLink } from '@/lib/types';
import {
  Sliders,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Globe,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Search,
  Zap,
  Info,
} from 'lucide-react';

interface NeuralGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectNode?: (node: GraphNode) => void;
  searchQuery?: string;
}

export const NeuralGraph: React.FC<NeuralGraphProps> = ({
  nodes,
  links,
  onSelectNode,
  searchQuery = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile for performance optimizations
  const isMobileRef = useRef<boolean>(typeof window !== 'undefined' && window.innerWidth < 768);
  // Canvas size tracking — only resize when container changes, not every frame
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // Throttle for mobile: render at 30fps
  const lastFrameTimeRef = useRef<number>(0);

  // Graph States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Planet Globe Controls
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotSpeed, setRotSpeed] = useState<number>(0.005);
  const [planetRadius, setPlanetRadius] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 160;
    }
    return 270;
  });
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [graphShape, setGraphShape] = useState<'SPHERE' | 'CUBE' | 'PRISM' | 'BLACK_HOLE' | 'CYBER_HELIX' | 'GALAXY_CLUSTER'>('SPHERE');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Mouse Dragging State
  const isMouseDownRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mutable Physics & 3D Nodes State
  const simNodesRef = useRef<(GraphNode & {
    x3d: number; y3d: number; z3d: number;
    x2d: number; y2d: number; z2d: number;
    vx: number; vy: number; vz: number;
    subTitle?: string;
  })[]>([]);
  const simLinksRef = useRef<{ sourceNode: any; targetNode: any; color?: string; label?: string }[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const pulseOffsetRef = useRef<number>(0);

  const activeSearch = useMemo(() => localSearch || searchQuery, [localSearch, searchQuery]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'PROJECT' && n.category !== 'PROJECT' && n.sourceType !== 'GITHUB') return false;
        if (selectedCategory === 'AREA' && n.category !== 'AREA') return false;
        if (selectedCategory === 'RESOURCE' && n.category !== 'RESOURCE' && n.sourceType !== 'BOOK' && n.sourceType !== 'TELEGRAM') return false;
        if (selectedCategory === 'ARCHIVE' && !n.isArchived) return false;
        if (selectedCategory === 'TELEGRAM' && n.sourceType !== 'TELEGRAM') return false;
        if (selectedCategory === 'GITHUB' && n.sourceType !== 'GITHUB') return false;
        if (selectedCategory === 'BOOK' && n.sourceType !== 'BOOK') return false;
        if (selectedCategory === 'VOICE' && n.sourceType !== 'VOICE') return false;
        if (selectedCategory === 'FINANCE' && !n.id.startsWith('finance-') && !n.tags.includes('Moliya')) return false;
        if (selectedCategory === 'HABIT' && !n.id.startsWith('habit-') && !n.tags.includes('Odat')) return false;
        if (selectedCategory === 'FLASHCARD' && !n.id.startsWith('flashcard-') && !n.tags.includes('Flashcard')) return false;
      }
      if (activeSearch.trim()) {
        const query = activeSearch.toLowerCase();
        const matchLabel = n.label.toLowerCase().includes(query);
        const matchTag = n.tags.some((t) => t.toLowerCase().includes(query));
        return matchLabel || matchTag;
      }
      return true;
    });
  }, [nodes, selectedCategory, activeSearch]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return links.filter(
      (l) => filteredNodeIds.has(l.source as string) && filteredNodeIds.has(l.target as string)
    );
  }, [links, filteredNodeIds]);

  // Connected node IDs for hover pathway highlight
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const set = new Set<string>([hoveredNode.id]);
    filteredLinks.forEach((l) => {
      const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      if (srcId === hoveredNode.id) set.add(tgtId);
      if (tgtId === hoveredNode.id) set.add(srcId);
    });
    return set;
  }, [hoveredNode, filteredLinks]);

  const getSubTitle = (n: GraphNode, index: number) => {
    const subtitles = ['_index', 'README', 'workflow', 'schema', '2026-08-08', 'llm-wiki', 'karpathy-llm-wiki', 'template', 'qayd'];
    return subtitles[index % subtitles.length];
  };

  // Initialize 3D Coordinates based on Selected Shape (Sphere, Cube, Prism, Black Hole)
  useEffect(() => {
    const count = filteredNodes.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    simNodesRef.current = filteredNodes.map((n, idx) => {
      let x3d = 0;
      let y3d = 0;
      let z3d = 0;

      if (graphShape === 'SPHERE') {
        // 🔮 Fibonacci 3D Sphere Globe
        const i = idx + 0.5;
        const phi = Math.acos(1 - (2 * i) / count);
        const theta = 2 * Math.PI * i / goldenRatio;
        const radiusLayer = planetRadius * (0.75 + (idx % 3) * 0.15);

        x3d = radiusLayer * Math.sin(phi) * Math.cos(theta);
        y3d = radiusLayer * Math.sin(phi) * Math.sin(theta);
        z3d = radiusLayer * Math.cos(phi);
      } else if (graphShape === 'CUBE') {
        // 🧊 3D Cubic Matrix Grid
        const side = Math.max(2, Math.ceil(Math.cbrt(count)));
        const spacing = (planetRadius * 1.8) / Math.max(side - 1, 1);
        const ix = idx % side;
        const iy = Math.floor(idx / side) % side;
        const iz = Math.floor(idx / (side * side));

        x3d = (ix - (side - 1) / 2) * spacing;
        y3d = (iy - (side - 1) / 2) * spacing;
        z3d = (iz - (side - 1) / 2) * spacing;
      } else if (graphShape === 'PRISM') {
        // 🔺 3D Pyramidal Triangular Prism / Tetrahedron
        const height = planetRadius * 2.2;
        const progress = count > 1 ? idx / (count - 1) : 0.5;
        y3d = -height / 2 + progress * height;

        const radiusAtLayer = planetRadius * 1.2 * (1 - progress * 0.7);
        const angle = idx * (2 * Math.PI / 3) + progress * Math.PI;

        x3d = radiusAtLayer * Math.cos(angle);
        z3d = radiusAtLayer * Math.sin(angle);
      } else if (graphShape === 'BLACK_HOLE') {
        // 🕳️ Gravitational Event Horizon Spiral & Accretion Vortex
        const spiralAngle = idx * 0.5;
        const dist = 30 + (idx / count) * (planetRadius * 1.5);

        x3d = dist * Math.cos(spiralAngle);
        z3d = dist * Math.sin(spiralAngle);
        // Singularity funnel depression
        y3d = -Math.pow(1 - dist / (planetRadius * 1.6), 2) * (planetRadius * 0.9);
      } else if (graphShape === 'CYBER_HELIX') {
        // 🧬 3D DNA Double Helix Strand
        const strand = idx % 2;
        const progress = count > 1 ? idx / count : 0.5;
        const t = progress * Math.PI * 6; // 3 full helix turns
        const height = (planetRadius * 2.2) * (progress - 0.5);
        const helixR = planetRadius * 0.8;
        const offsetAngle = strand === 0 ? 0 : Math.PI;

        x3d = helixR * Math.cos(t + offsetAngle);
        z3d = helixR * Math.sin(t + offsetAngle);
        y3d = height;
      } else if (graphShape === 'GALAXY_CLUSTER') {
        // 🌌 3D Cosmic Spiral Galaxy Nebula
        const arms = 4;
        const armIndex = idx % arms;
        const armOffset = (armIndex * 2 * Math.PI) / arms;
        const r = Math.pow(idx / count, 0.6) * (planetRadius * 1.6) + 20;
        const theta = armOffset + (r / (planetRadius * 1.6)) * Math.PI * 2.5;
        const diskScatter = ((idx % 7) - 3) * (planetRadius * 0.08);

        x3d = r * Math.cos(theta);
        z3d = r * Math.sin(theta);
        y3d = diskScatter;
      }

      return {
        ...n,
        x3d, y3d, z3d,
        x2d: 0, y2d: 0, z2d: 0,
        vx: 0, vy: 0, vz: 0,
        subTitle: getSubTitle(n, idx),
      };
    });

    const nodeMap = new Map(simNodesRef.current.map((n) => [n.id, n]));
    simLinksRef.current = filteredLinks
      .map((l) => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const sourceNode = nodeMap.get(srcId);
        const targetNode = nodeMap.get(tgtId);
        if (sourceNode && targetNode) {
          return { sourceNode, targetNode, color: l.color, label: l.label };
        }
        return null;
      })
      .filter(Boolean) as any;
  }, [filteredNodes, filteredLinks, planetRadius, graphShape]);

  // ResizeObserver — only resize canvas when container size changes (NOT every frame)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w !== canvasSizeRef.current.w || h !== canvasSizeRef.current.h) {
        canvas.width = w;
        canvas.height = h;
        canvasSizeRef.current = { w, h };
      }
    });
    ro.observe(container);
    // Set initial size
    const w = Math.floor(container.clientWidth);
    const h = Math.floor(container.clientHeight);
    canvas.width = w;
    canvas.height = h;
    canvasSizeRef.current = { w, h };
    return () => ro.disconnect();
  }, []);

  // Main 3D Planet Globe Animation & Rotation Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isMobile = isMobileRef.current;
    // 30fps on mobile to save battery, 60fps on desktop
    const TARGET_FPS = isMobile ? 30 : 60;
    const FRAME_MS = 1000 / TARGET_FPS;

    let running = true;

    const render = (timestamp: number) => {
      if (!running) return;

      // Throttle fps on mobile
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < FRAME_MS - 1) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      const width = canvasSizeRef.current.w || containerRef.current?.clientWidth || 900;
      const height = canvasSizeRef.current.h || containerRef.current?.clientHeight || 600;

      const centerX = width / 2;
      const centerY = height / 2;

      // Background — clearRect is fastest (canvas alpha:false)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Deep space gradient overlay (skip on mobile for perf)
      if (!isMobile) {
        const bgGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, width / 1.1);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.5, '#090d16');
        bgGrad.addColorStop(1, '#04060a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Background cosmic dust grid (skip on mobile)
      if (!isMobile) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let gx = 0; gx < width; gx += 45) {
          for (let gy = 0; gy < height; gy += 45) {
            ctx.fillRect(gx, gy, 1.2, 1.2);
          }
        }
      }

      // Auto-rotation physics
      if (autoRotate && !isMouseDownRef.current) {
        rotationRef.current.y += rotSpeed;
      }

      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // 1. Transform 3D Spherical Coordinates into 2D Screen Space with 3D Rotation Matrix
      const simNodes = simNodesRef.current;
      simNodes.forEach((n) => {
        const x1 = n.x3d * cosY - n.z3d * sinY;
        const z1 = n.x3d * sinY + n.z3d * cosY;

        const y2 = n.y3d * cosX - z1 * sinX;
        const z2 = n.y3d * sinX + z1 * cosX;

        n.x2d = centerX + x1 * zoomLevel;
        n.y2d = centerY + y2 * zoomLevel;
        n.z2d = z2 * zoomLevel;
      });

      const sortedNodes = [...simNodes].sort((a, b) => a.z2d - b.z2d);

      pulseOffsetRef.current = (pulseOffsetRef.current + 0.012) % 1;
      const pulseProgress = pulseOffsetRef.current;

      // 2. Draw 3D Shape Guides & Atmosphere (Sphere, Cube, Prism, Black Hole)
      ctx.save();
      if (graphShape === 'SPHERE') {
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, planetRadius * zoomLevel, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.14)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, planetRadius * zoomLevel, planetRadius * 0.3 * zoomLevel, rotX, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (graphShape === 'BLACK_HOLE') {
        // Singularity Event Horizon Core
        ctx.beginPath();
        ctx.arc(centerX, centerY, 32 * zoomLevel, 0, Math.PI * 2);
        ctx.fillStyle = '#020617';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Accretion Vortex Rings
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, planetRadius * 1.2 * zoomLevel, planetRadius * 0.4 * zoomLevel, rotX + pulseProgress, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (graphShape === 'CUBE') {
        const size = planetRadius * zoomLevel * 0.9;
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.strokeRect(centerX - size, centerY - size, size * 2, size * 2);
      } else if (graphShape === 'PRISM') {
        const r = planetRadius * zoomLevel * 0.9;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - r);
        ctx.lineTo(centerX - r, centerY + r * 0.7);
        ctx.lineTo(centerX + r, centerY + r * 0.7);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
      ctx.setLineDash([]);

      // 3. Draw 3D Synaptic Connections Across Planet Sphere
      const simLinks = simLinksRef.current;
      // Reset shadow before link batch
      ctx.shadowBlur = 0;
      simLinks.forEach(({ sourceNode: s, targetNode: t, color }) => {
        const isHoverConnected = hoveredNode && (connectedNodeIds.has(s.id) && connectedNodeIds.has(t.id));
        const isDimmed = hoveredNode && !isHoverConnected;

        const avgZ = (s.z2d + t.z2d) / 2;
        const depthAlpha = Math.max(0.08, Math.min(0.85, 0.45 + avgZ / 500));

        ctx.beginPath();
        ctx.moveTo(s.x2d, s.y2d);
        ctx.lineTo(t.x2d, t.y2d);

        let strokeColor = `rgba(255, 255, 255, ${depthAlpha * 0.35})`;
        if (isHoverConnected) {
          strokeColor = '#00f3ff';
        } else if (isDimmed) {
          strokeColor = 'rgba(255, 255, 255, 0.03)';
        } else if (color) {
          if (color.startsWith('#')) {
            strokeColor = `${color}${Math.round(depthAlpha * 255).toString(16).padStart(2, '0')}`;
          } else {
            strokeColor = color;
          }
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isHoverConnected ? 2.8 : Math.max(0.8, 1.2 * (1 + avgZ / 300));
        // shadowBlur only for hovered connections and only on desktop
        if (isHoverConnected && !isMobile) {
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.stroke();

        // 3D Synaptic Pulse Particles & Data Impulse Stream
        if (!isDimmed && avgZ > -150) {
          const pulseOffset1 = pulseProgress;
          const pulseOffset2 = (pulseProgress + 0.5) % 1;

          const px1 = s.x2d + (t.x2d - s.x2d) * pulseOffset1;
          const py1 = s.y2d + (t.y2d - s.y2d) * pulseOffset1;

          const px2 = s.x2d + (t.x2d - s.x2d) * pulseOffset2;
          const py2 = s.y2d + (t.y2d - s.y2d) * pulseOffset2;

          ctx.save();

          // Particle 1: Primary Cyan/Gold Signal Impulse
          ctx.beginPath();
          ctx.arc(px1, py1, isHoverConnected ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isHoverConnected ? '#00f3ff' : color || '#00f3ff';
          ctx.shadowColor = isHoverConnected ? '#00f3ff' : color || '#00f3ff';
          ctx.shadowBlur = 10;
          ctx.fill();

          // Particle 2: Secondary Violet/Magenta Signal Impulse
          ctx.beginPath();
          ctx.arc(px2, py2, isHoverConnected ? 3.5 : 2.0, 0, Math.PI * 2);
          ctx.fillStyle = isHoverConnected ? '#e0aaff' : '#a855f7';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 8;
          ctx.fill();

          ctx.restore();
        }
      });

      // 4. Draw 3D Nodes & Labels
      // Reset shadows before node batch
      ctx.shadowBlur = 0;
      sortedNodes.forEach((n) => {
        const isHovered = hoveredNode?.id === n.id;
        const isConnected = connectedNodeIds.has(n.id);
        const isDimmed = hoveredNode && !isConnected;

        const depthScale = Math.max(0.6, Math.min(1.5, 1 + n.z2d / 400));
        const alpha = isDimmed ? 0.15 : Math.max(0.3, Math.min(1.0, 0.7 + n.z2d / 350));
        const baseVal = isMobile ? (n.val || 12) * 1.15 : (n.val || 10);
        const radius = Math.max(isMobile ? 7 : 5, baseVal * depthScale * (isHovered ? 1.4 : 1));

        ctx.globalAlpha = alpha;

        // Outer Halo Glow — skip on mobile for performance
        if (!isDimmed && !isMobile) {
          ctx.beginPath();
          ctx.arc(n.x2d, n.y2d, radius + (isHovered ? 12 : 5), 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? `${n.color}50` : `${n.color}30`;
          ctx.shadowColor = n.color;
          ctx.shadowBlur = isHovered ? 20 : 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Inner Solid Node Circle
        ctx.beginPath();
        ctx.arc(n.x2d, n.y2d, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? '#334155' : n.color;
        ctx.fill();

        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = isHovered ? 2.5 : 1;
        ctx.stroke();

        // Node Title Text & Subtitle Tag (Only show text for front-facing nodes or hovered to prevent wall-of-text overlap)
        const isFrontNode = n.z2d > (isMobile ? 40 : -40);
        if (isHovered || (isFrontNode && !isDimmed)) {
          const fontPx = isMobile
            ? Math.max(10, Math.round(11 * depthScale))
            : Math.max(9, Math.round(11 * depthScale));
          ctx.font = isHovered ? `bold ${fontPx + 2}px sans-serif` : `${fontPx}px sans-serif`;
          ctx.fillStyle = isHovered ? '#ffffff' : '#e2e8f0';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          // Text shadow only on desktop
          if (!isMobile) {
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
          }

          const textX = n.x2d + radius + 5;
          const maxLen = isMobile ? 14 : 24;
          const displayLabel = n.label.length > maxLen ? n.label.substring(0, maxLen - 2) + '...' : n.label;
          ctx.fillText(displayLabel, textX, n.y2d - (n.subTitle ? 4 : 0));
          ctx.shadowBlur = 0;

          if (n.subTitle && !isMobile) {
            ctx.font = `italic ${Math.max(8, Math.round(9 * depthScale))}px monospace`;
            ctx.fillStyle = isHovered ? '#00f3ff' : '#94a3b8';
            ctx.fillText(n.subTitle, textX, n.y2d + 8);
          }
        }

        ctx.globalAlpha = 1;
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedCategory, rotSpeed, autoRotate, planetRadius, zoomLevel, hoveredNode, connectedNodeIds]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchDistRef = useRef<number | null>(null);

  // Mouse & Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isMouseDownRef.current) {
      const deltaX = e.clientX - lastMousePosRef.current.x;
      const deltaY = e.clientY - lastMousePosRef.current.y;

      rotationRef.current = {
        x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x + deltaY * 0.008)),
        y: rotationRef.current.y + deltaX * 0.008,
      };

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    let found: GraphNode | null = null;
    for (const n of simNodesRef.current) {
      const dx = mouseX - n.x2d;
      const dy = mouseY - n.y2d;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const depthScale = Math.max(0.5, 1 + n.z2d / 400);
      const radius = (n.val || 10) * depthScale;
      if (dist <= radius + 8 && n.z2d > -150) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  // Touch handlers for mobile / Telegram Mini App
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isMouseDownRef.current = true;
      const touch = e.touches[0];
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isMouseDownRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      touchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 1 && isMouseDownRef.current) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastMousePosRef.current.x;
      const deltaY = touch.clientY - lastMousePosRef.current.y;

      rotationRef.current = {
        x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x + deltaY * 0.012)),
        y: rotationRef.current.y + deltaX * 0.012,
      };

      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };

      const rect = canvas.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;

      let found: GraphNode | null = null;
      for (const n of simNodesRef.current) {
        const dx = mouseX - n.x2d;
        const dy = mouseY - n.y2d;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const depthScale = Math.max(0.5, 1 + n.z2d / 400);
        const radius = Math.max(12, (n.val || 10) * depthScale);
        if (dist <= radius + 12 && n.z2d > -160) {
          found = n;
          break;
        }
      }
      setHoveredNode(found);
    } else if (e.touches.length === 2 && touchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const factor = newDist / touchDistRef.current;
      setZoomLevel((prev) => Math.max(0.4, Math.min(3.5, prev * (factor > 1 ? 1.04 : 0.96))));
      touchDistRef.current = newDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) {
      if (touchStartRef.current && lastMousePosRef.current) {
        const dx = Math.abs(lastMousePosRef.current.x - touchStartRef.current.x);
        const dy = Math.abs(lastMousePosRef.current.y - touchStartRef.current.y);
        if (dx < 8 && dy < 8 && hoveredNode && onSelectNode) {
          onSelectNode(hoveredNode);
        }
      }
      isMouseDownRef.current = false;
      touchStartRef.current = null;
      touchDistRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoomLevel((prev) => Math.max(0.4, Math.min(3.0, prev * zoomFactor)));
  };

  const handleCanvasClick = () => {
    if (hoveredNode && onSelectNode) {
      onSelectNode(hoveredNode);
    }
  };

  const resetOrbit = () => {
    rotationRef.current = { x: 0.2, y: 0 };
    setZoomLevel(1.0);
    setPlanetRadius(isMobileRef.current ? 160 : 270);
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(3.5, prev * 1.25));
  const zoomOut = () => setZoomLevel((prev) => Math.max(0.4, prev / 1.25));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: isMobileRef.current ? '300px' : '520px', position: 'relative' }}
      className={`rounded-2xl glass-panel overflow-hidden border border-white/10 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''}`}
    >
      {/* 3D Canvas Element with Touch + Mouse support */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{ touchAction: 'none' }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Header & Filter Toolbar */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none z-20 max-w-full overflow-hidden">
        {/* Category Filters Pills — Horizontally scrollable on mobile */}
        <div className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl overflow-x-auto no-scrollbar max-w-full whitespace-nowrap">
          {[
            { id: 'ALL', label: 'Barchasi', color: '#00f3ff' },
            { id: 'PROJECT', label: 'Loyihalar', color: '#00f3ff' },
            { id: 'AREA', label: 'Sohalar', color: '#9d4edd' },
            { id: 'RESOURCE', label: 'Resurslar', color: '#ffd166' },
            { id: 'FINANCE', label: '💳 Moliya', color: '#10b981' },
            { id: 'HABIT', label: '🔥 Odatlar', color: '#f59e0b' },
            { id: 'FLASHCARD', label: '🧠 Flashcards', color: '#8b5cf6' },
            { id: 'TELEGRAM', label: 'Telegram', color: '#0088cc' },
            { id: 'GITHUB', label: 'GitHub', color: '#2ea44f' },
            { id: 'BOOK', label: 'Kitoblar', color: '#ff9f1c' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white/20 text-white shadow-glowCyan font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              style={{
                borderColor: selectedCategory === cat.id ? cat.color : 'transparent',
                borderWidth: '1px',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Search & Control Buttons */}
        <div className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl overflow-x-auto no-scrollbar max-w-full whitespace-nowrap">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <input
              type="text"
              placeholder="Qidiruv..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-28 sm:w-36 bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 transition"
            />
          </div>

            {/* 3D Shape Morphing Selector Pills */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              {[
                { id: 'SPHERE', label: '🔮 Shar', title: 'Sfera Shakli (Sphere)' },
                { id: 'CUBE', label: '🧊 Kub', title: 'Kub Matrix (Cube)' },
                { id: 'PRISM', label: '🔺 Prizma', title: 'Prizma Pyramid (Prism)' },
                { id: 'BLACK_HOLE', label: '🕳️ Vortex', title: 'Accretion Vortex (Black Hole)' },
                { id: 'CYBER_HELIX', label: '🧬 DNK', title: '3D Cyber DNA Helix' },
                { id: 'GALAXY_CLUSTER', label: '🌌 Galaktika', title: '3D Cosmic Spiral Galaxy' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setGraphShape(s.id as any)}
                  title={s.title}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono transition-all ${
                    graphShape === s.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glowCyan'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Animated Neural Impulse Status Badge */}
            <div
              className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-glowCyan animate-pulse"
              title="Miyadagi neyron sinapslar bo'ylab elektr impulslar va ma'lumotlar oqimi harakati"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>⚡ Sinaptik Impulslar</span>
            </div>

          {/* Settings / Radius Toggle */}
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition ${
              showSettings
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Sfera o'lchamlarini sozlash"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Planet Auto-Rotate Toggle Button */}
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-glowCyan'
                : 'bg-black/40 text-slate-400 border border-white/10 hover:text-white'
            }`}
            title="Sayyorani avtomatik aylantirish"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoRotate ? "Aylanish: Yoniq" : "Aylanish: O'chiq"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-black/40 text-slate-400 hover:text-cyan-400 border border-white/10 transition"
            title="To'liq ekranga o'tish"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Settings Slider Panel (When toggled) */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-30 w-72 p-4 rounded-xl bg-slate-950/90 border border-white/15 backdrop-blur-lg shadow-2xl space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold font-mono text-cyan-400 uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Sfera Parametrlari
            </span>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>Sfera Radiusi:</span>
              <span className="text-cyan-400 font-bold">{planetRadius}px</span>
            </div>
            <input
              type="range"
              min="140"
              max="360"
              value={planetRadius}
              onChange={(e) => setPlanetRadius(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>Aylanish Tezligi:</span>
              <span className="text-purple-400 font-bold">{(rotSpeed * 1000).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.015"
              step="0.001"
              value={rotSpeed}
              onChange={(e) => setRotSpeed(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Bottom Floating Navigation & Zoom Dock */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md pointer-events-auto shadow-xl z-20">
        <button
          onClick={zoomIn}
          className="p-2 rounded-lg bg-black/40 text-slate-300 hover:text-cyan-400 hover:bg-white/10 border border-white/10 transition"
          title="Kattalashtirish (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 rounded-lg bg-black/40 text-slate-300 hover:text-cyan-400 hover:bg-white/10 border border-white/10 transition"
          title="Kichiklashtirish (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetOrbit}
          className="p-2 rounded-lg bg-black/40 text-slate-300 hover:text-cyan-400 hover:bg-white/10 border border-white/10 transition"
          title="Kamerani nolga qaytarish"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-cyan-400">
          {(zoomLevel * 100).toFixed(0)}%
        </div>
      </div>

      {/* Bottom Left Real-time HUD Statistics */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 p-2 px-3 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md pointer-events-none z-20 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Globe className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Tugunlar: {filteredNodes.length}</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="text-purple-400 font-bold">
          Sinapslar: {filteredLinks.length}
        </div>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:inline text-slate-400 text-[11px]">
          Sichqoncha bilan 3D burchakni aylantiring
        </span>
      </div>

      {/* Floating Preview Card on Hover */}
      {hoveredNode && (
        <div
          className="fixed z-50 w-72 p-4 rounded-xl glass-panel border border-cyan-500/50 shadow-glowCyan pointer-events-none animate-float"
          style={{
            left: Math.min(mousePos.x + 15, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 300),
            top: Math.min(mousePos.y + 15, (typeof window !== 'undefined' ? window.innerHeight : 800) - 250),
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono border"
              style={{
                backgroundColor: `${hoveredNode.color}20`,
                color: hoveredNode.color,
                borderColor: `${hoveredNode.color}60`,
              }}
            >
              {hoveredNode.category} • {hoveredNode.sourceType}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ID: #{hoveredNode.id.split('-')[1]?.substring(0, 6)}</span>
          </div>

          <h4 className="font-bold text-sm text-white mb-1 leading-snug">{hoveredNode.label}</h4>

          {hoveredNode.details?.summary && (
            <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
              {hoveredNode.details.summary}
            </p>
          )}

          {/* Tags */}
          {hoveredNode.tags && hoveredNode.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {hoveredNode.tags.map((tag, idx) => (
                <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-slate-300 border border-white/10">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-cyan-400 font-semibold">
            <span>O'tish uchun bosing</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );
};
