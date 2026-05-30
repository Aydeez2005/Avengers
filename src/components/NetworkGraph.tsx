"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type GraphNode = {
  id: string;
  label: string;
  ring: 0 | 1 | 2;
  parentId?: string;
  badge?: string;
};

export type GraphEdge = { from: string; to: string };

export type HighlightedPath = {
  bridgeId?: string;
  targetId?: string;
};

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meId: string;
  highlight?: HighlightedPath;
  onSelect?: (nodeId: string) => void;
  height?: number;
}

// Each node carries: current position, velocity, and anchor position (the
// polar-layout home it wants to spring back to).
type NodeState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number; // anchor x
  ay: number; // anchor y
};

// Physics params — tuned for ~14-node demo graph.
const SPRING_K = 0.025;     // pull back to anchor
const DAMPING = 0.82;       // velocity decay per frame
const REPULSION = 220;      // node-to-node push
const MAX_FORCE = 4;        // clamp so things don't explode on drag

export default function NetworkGraph({
  nodes,
  edges,
  meId,
  highlight,
  onSelect,
  height = 380,
}: Props) {
  const W = 420;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;
  const R1 = 110;
  const R2 = 78;

  // Compute anchors deterministically (same polar layout as before).
  const anchors = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    map.set(meId, { x: cx, y: cy });

    const ring1 = nodes.filter((n) => n.ring === 1);
    ring1.forEach((n, i) => {
      const angle = (i / Math.max(ring1.length, 1)) * Math.PI * 2 - Math.PI / 2;
      map.set(n.id, { x: cx + Math.cos(angle) * R1, y: cy + Math.sin(angle) * R1 });
    });

    const ring2ByParent = new Map<string, GraphNode[]>();
    for (const n of nodes) {
      if (n.ring !== 2 || !n.parentId) continue;
      const list = ring2ByParent.get(n.parentId) ?? [];
      list.push(n);
      ring2ByParent.set(n.parentId, list);
    }
    for (const [pid, kids] of ring2ByParent) {
      const ppos = map.get(pid);
      if (!ppos) continue;
      const base = Math.atan2(ppos.y - cy, ppos.x - cx);
      const spread = (kids.length - 1) * 0.32;
      kids.forEach((k, i) => {
        const a = base - spread / 2 + i * 0.32;
        map.set(k.id, {
          x: ppos.x + Math.cos(a) * R2,
          y: ppos.y + Math.sin(a) * R2,
        });
      });
    }
    return map;
  }, [nodes, meId, cx, cy]);

  // Live position state — kept in a ref so we don't trigger React renders
  // for every physics tick. We bump a `tick` counter at 60fps instead.
  const positionsRef = useRef<Map<string, NodeState>>(new Map());
  const dragRef = useRef<string | null>(null);
  const panRef = useRef<{ startSvgX: number; startSvgY: number; startPanX: number; startPanY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Seed positions whenever the node set changes.
  useEffect(() => {
    const next = new Map<string, NodeState>();
    for (const [id, a] of anchors) {
      const existing = positionsRef.current.get(id);
      next.set(id, {
        x: existing?.x ?? a.x,
        y: existing?.y ?? a.y,
        vx: 0,
        vy: 0,
        ax: a.x,
        ay: a.y,
      });
    }
    positionsRef.current = next;
    setTick((t) => t + 1);
  }, [anchors]);

  // Physics loop.
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const positions = positionsRef.current;
      const ids = Array.from(positions.keys());

      for (const id of ids) {
        if (dragRef.current === id) continue;
        const p = positions.get(id)!;

        // Spring back to anchor
        let fx = (p.ax - p.x) * SPRING_K;
        let fy = (p.ay - p.y) * SPRING_K;

        // Repulsion from every other node
        for (const oid of ids) {
          if (oid === id) continue;
          const op = positions.get(oid)!;
          const dx = p.x - op.x;
          const dy = p.y - op.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 1) continue;
          const inv = 1 / Math.sqrt(d2);
          const force = REPULSION / d2;
          fx += dx * inv * force;
          fy += dy * inv * force;
        }

        // Clamp + apply
        fx = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, fx));
        fy = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, fy));
        p.vx = (p.vx + fx) * DAMPING;
        p.vy = (p.vy + fy) * DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }

      setTick((t) => (t + 1) % 10000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Translate a client-side coord into the SVG's viewBox space.
  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  function onPointerDown(id: string, e: React.PointerEvent) {
    e.stopPropagation();
    dragRef.current = id;
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onSvgPointerDown(e: React.PointerEvent) {
    // pan-start on empty area only (node handlers stopPropagation)
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    panRef.current = { startSvgX: x, startSvgY: y, startPanX: pan.x, startPanY: pan.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragRef.current) {
      const p = positionsRef.current.get(dragRef.current);
      if (!p) return;
      // Convert client to graph (account for zoom + pan).
      const { x, y } = clientToSvg(e.clientX, e.clientY);
      p.x = (x - pan.x) / zoom;
      p.y = (y - pan.y) / zoom;
      p.vx = 0;
      p.vy = 0;
      return;
    }
    if (panRef.current) {
      const { x, y } = clientToSvg(e.clientX, e.clientY);
      setPan({
        x: panRef.current.startPanX + (x - panRef.current.startSvgX),
        y: panRef.current.startPanY + (y - panRef.current.startSvgY),
      });
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
      dragRef.current = null;
    }
    if (panRef.current) {
      try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
      panRef.current = null;
    }
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3.5, zoom * factor));
    // Keep cursor point stable under zoom.
    const k = newZoom / zoom;
    setPan({
      x: x - (x - pan.x) * k,
      y: y - (y - pan.y) * k,
    });
    setZoom(newZoom);
  }
  function zoomBy(factor: number) {
    const x = W / 2;
    const y = H / 2;
    const newZoom = Math.max(0.5, Math.min(3.5, zoom * factor));
    const k = newZoom / zoom;
    setPan({
      x: x - (x - pan.x) * k,
      y: y - (y - pan.y) * k,
    });
    setZoom(newZoom);
  }
  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const pathNodes = useMemo(() => {
    const set = new Set<string>();
    set.add(meId);
    if (highlight?.bridgeId) set.add(highlight.bridgeId);
    if (highlight?.targetId) set.add(highlight.targetId);
    return set;
  }, [highlight, meId]);

  const pathEdges = useMemo(() => {
    const set = new Set<string>();
    if (highlight?.bridgeId) set.add(edgeKey(meId, highlight.bridgeId));
    if (highlight?.bridgeId && highlight.targetId) {
      set.add(edgeKey(highlight.bridgeId, highlight.targetId));
    }
    return set;
  }, [highlight, meId]);

  const positions = positionsRef.current;

  return (
    <div style={{ position: "relative" }}>
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      onPointerDown={onSvgPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      style={{
        background: "transparent",
        touchAction: "none",
        display: "block",
        cursor: panRef.current ? "grabbing" : "grab",
      }}
    >
      <defs>
        <radialGradient id="meGlow">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="targetGlow">
          <stop offset="0%" stopColor="rgba(74,222,128,0.85)" />
          <stop offset="100%" stopColor="rgba(74,222,128,0)" />
        </radialGradient>
      </defs>

      {/* Pan+zoom transform applied to all content */}
      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
      {/* Edges */}
      <g>
        {edges.map((e) => {
          const a = positions.get(e.from);
          const b = positions.get(e.to);
          if (!a || !b) return null;
          const k = edgeKey(e.from, e.to);
          const onPath = pathEdges.has(k);
          return (
            <line
              key={k}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={onPath ? "rgba(74,222,128,0.85)" : "rgba(255,255,255,0.12)"}
              strokeWidth={onPath ? 1.6 : 0.8}
              style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
            />
          );
        })}
      </g>

      {/* Glow under "me" */}
      {positions.get(meId) && (
        <circle
          cx={positions.get(meId)!.x}
          cy={positions.get(meId)!.y}
          r={36}
          fill="url(#meGlow)"
          opacity={0.5}
        />
      )}

      {/* Target glow */}
      {highlight?.targetId && positions.get(highlight.targetId) && (
        <circle
          cx={positions.get(highlight.targetId)!.x}
          cy={positions.get(highlight.targetId)!.y}
          r={32}
          fill="url(#targetGlow)"
          opacity={0.9}
          style={{ transition: "opacity 0.4s ease" }}
        />
      )}

      {/* Nodes */}
      <g>
        {nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const isMe = n.id === meId;
          const isOnPath = pathNodes.has(n.id);
          const isBridge = highlight?.bridgeId === n.id;
          const isTarget = highlight?.targetId === n.id;
          const r = n.ring === 0 ? 16 : n.ring === 1 ? 9 : 6;
          const fill = isMe
            ? "#fff"
            : isTarget
            ? "rgba(74,222,128,1)"
            : isBridge
            ? "rgba(120,200,255,1)"
            : n.ring === 1
            ? "rgba(255,255,255,0.85)"
            : "rgba(255,255,255,0.4)";

          return (
            <g
              key={n.id}
              onPointerDown={(e) => onPointerDown(n.id, e)}
              onClick={() => onSelect?.(n.id)}
              style={{ cursor: "grab", touchAction: "none" }}
            >
              {/* invisible hitbox for easy grabbing */}
              <circle cx={p.x} cy={p.y} r={Math.max(r + 8, 14)} fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={fill}
                stroke={isOnPath ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}
                strokeWidth={isOnPath ? 1.5 : 1}
                style={{ transition: "fill 0.4s ease, stroke 0.4s ease" }}
              />
              <text
                x={p.x}
                y={p.y + r + 12}
                textAnchor="middle"
                fontSize={n.ring === 0 ? 11 : 10}
                fontWeight={n.ring === 0 ? 700 : 500}
                fill={isOnPath ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)"}
                style={{
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  letterSpacing: "0.02em",
                  pointerEvents: "none",
                  userSelect: "none",
                  transition: "fill 0.4s ease",
                }}
              >
                {n.label}
              </text>
              {n.badge && (
                <text
                  x={p.x}
                  y={p.y + r + 24}
                  textAnchor="middle"
                  fontSize={8}
                  fill="rgba(255,255,255,0.3)"
                  style={{
                    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {n.badge}
                </text>
              )}
            </g>
          );
        })}
      </g>
      </g>
    </svg>

    {/* Zoom controls — bottom-right overlay */}
    <div
      style={{ position: "absolute", right: 12, bottom: 12 }}
      className="flex flex-col gap-1"
    >
      <button
        onClick={() => zoomBy(1.25)}
        className="w-8 h-8 rounded-full bg-white/8 border border-white/15 text-white text-base hover:bg-white/15 transition-colors"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => zoomBy(0.8)}
        className="w-8 h-8 rounded-full bg-white/8 border border-white/15 text-white text-base hover:bg-white/15 transition-colors"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={reset}
        className="w-8 h-8 rounded-full bg-white/8 border border-white/15 text-white text-[10px] tracking-[0.05em] uppercase hover:bg-white/15 transition-colors"
        aria-label="Reset view"
      >
        ⌂
      </button>
    </div>
    </div>
  );
}

function edgeKey(a: string, b: string) {
  return [a, b].sort().join("→");
}
