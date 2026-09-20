"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Minus, Plus, RotateCcw, Route } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";

type G = CausalFixture["causalGraph"];
type Node = G["nodes"][number];
type Edge = G["edges"][number];

const ROLE_COLOR: Record<string, string> = {
  confounder: "#b9762f",
  treatment: "#3d5a3d",
  mediator: "#7ba05b",
  exogenous: "#9a9683",
  outcome: "#2f4630",
};
const ROLE_LABEL: Record<string, string> = {
  confounder: "Confounder — biases both treatment and outcome",
  treatment: "Treatment — the intervention we estimate",
  mediator: "Mediator — carries the effect downstream",
  exogenous: "Exogenous — external, not on the causal path",
  outcome: "Outcome — what we're trying to move",
};

const VB_W = 680;

export function CausalGraph({
  graph,
  height = 320,
  activeEdges,
  compact = false,
  interactive = true,
}: {
  graph: G;
  height?: number;
  activeEdges?: Set<string>;
  compact?: boolean;
  interactive?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ---- base layout (internal coords) --------------------------------------
  const base = useMemo(() => {
    const pad = 54;
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const spanX = Math.max(...xs) - Math.min(...xs) || 1;
    const spanY = Math.max(...ys) - Math.min(...ys) || 1;
    const map: Record<string, { x: number; y: number }> = {};
    for (const n of graph.nodes) {
      map[n.id] = {
        x: pad + ((n.x - Math.min(...xs)) / spanX) * (VB_W - pad * 2),
        y: pad + ((n.y - Math.min(...ys)) / spanY) * (height - pad * 2),
      };
    }
    return map;
  }, [graph.nodes, height]);

  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>(base);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ kind: "node"; id: string } | { kind: "edge"; i: number } | null>(null);
  const [backdoor, setBackdoor] = useState(false);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const drag = useRef<
    | { mode: "node"; id: string; ox: number; oy: number }
    | { mode: "pan"; ox: number; oy: number; vx: number; vy: number }
    | null
  >(null);

  const P = (id: string) => pos[id] ?? base[id];

  const confounder = graph.nodes.find((n) => n.role === "confounder");
  const treatment = graph.nodes.find((n) => n.role === "treatment");
  const outcome = graph.nodes.find((n) => n.role === "outcome");

  // ---- causal-path tracing ----------------------------------------------
  const focus = useMemo(() => {
    if (!selected) return null;
    const nodes = new Set<string>([selected]);
    const edges = new Set<number>();
    const walk = (start: string, dir: "down" | "up") => {
      const stack = [start];
      while (stack.length) {
        const cur = stack.pop()!;
        graph.edges.forEach((e, i) => {
          if (e.pruned || edges.has(i)) return;
          const from = dir === "down" ? e.source : e.target;
          const to = dir === "down" ? e.target : e.source;
          if (from === cur) {
            edges.add(i);
            if (!nodes.has(to)) {
              nodes.add(to);
              stack.push(to);
            }
          }
        });
      }
    };
    walk(selected, "down");
    walk(selected, "up");
    return { nodes, edges };
  }, [selected, graph.edges]);

  const backdoorEdges = useMemo(() => {
    if (!confounder) return new Set<number>();
    const s = new Set<number>();
    graph.edges.forEach((e, i) => {
      if (e.source === confounder.id && !e.pruned) s.add(i);
    });
    return s;
  }, [graph.edges, confounder]);

  // ---- pointer handlers ------------------------------------------------
  const toLocal = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: (pt.x - view.x) / view.z, y: (pt.y - view.y) / view.z };
  }, [view]);

  const onPointerDownNode = (e: React.PointerEvent, id: string) => {
    if (!interactive) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const l = toLocal(e.clientX, e.clientY);
    drag.current = { mode: "node", id, ox: l.x - P(id).x, oy: l.y - P(id).y };
  };
  const onPointerDownBg = (e: React.PointerEvent) => {
    if (!interactive) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { mode: "pan", ox: e.clientX, oy: e.clientY, vx: view.x, vy: view.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.mode === "node") {
      const l = toLocal(e.clientX, e.clientY);
      setPos((p) => ({ ...p, [d.id]: { x: l.x - d.ox, y: l.y - d.oy } }));
    } else {
      setView((v) => ({ ...v, x: d.vx + (e.clientX - d.ox), y: d.vy + (e.clientY - d.oy) }));
    }
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const zoom = (delta: number) =>
    setView((v) => ({ ...v, z: Math.max(0.5, Math.min(2.4, +(v.z + delta).toFixed(2))) }));
  const reset = () => {
    setPos(base);
    setView({ z: 1, x: 0, y: 0 });
    setSelected(null);
  };

  // ---- render helpers ------------------------------------------------
  const edgeState = (e: Edge, i: number) => {
    if (e.pruned) return "pruned";
    if (activeEdges?.has(`${e.source}->${e.target}`)) return "active";
    if (backdoor && backdoorEdges.has(i)) return "backdoor";
    if (focus) return focus.edges.has(i) ? "focus" : "dim";
    if (hover?.kind === "node") return hover.id === e.source || hover.id === e.target ? "focus" : "dim";
    return "normal";
  };
  const nodeDim = (id: string) => {
    if (focus) return !focus.nodes.has(id);
    if (hover?.kind === "node") return hover.id !== id;
    return false;
  };

  const tip = hover
    ? hover.kind === "node"
      ? tipForNode(graph.nodes.find((n) => n.id === hover.id)!, graph, treatment, outcome)
      : tipForEdge(graph.edges[hover.i], graph)
    : null;
  const tipXY = hover
    ? hover.kind === "node"
      ? screenXY(P(hover.id), view)
      : screenXY(midpoint(P(graph.edges[hover.i].source), P(graph.edges[hover.i].target)), view)
    : null;

  return (
    <div ref={wrapRef} className="relative select-none" style={{ height }}>
      {interactive && !compact && (
        <div className="absolute right-1 top-1 z-10 flex items-center gap-1">
          <ToolBtn onClick={() => setBackdoor((b) => !b)} active={backdoor} title="Highlight the confounding backdoor path">
            <Route size={13} />
          </ToolBtn>
          <ToolBtn onClick={() => zoom(0.2)} title="Zoom in"><Plus size={13} /></ToolBtn>
          <ToolBtn onClick={() => zoom(-0.2)} title="Zoom out"><Minus size={13} /></ToolBtn>
          <ToolBtn onClick={reset} title="Reset layout"><RotateCcw size={13} /></ToolBtn>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${height}`}
        width="100%"
        height={height}
        style={{ cursor: drag.current?.mode === "pan" ? "grabbing" : "default", touchAction: "none" }}
        onPointerDown={onPointerDownBg}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setHover(null);
        }}
        onClick={() => setSelected(null)}
        role="img"
        aria-label="Interactive causal graph"
      >
        <defs>
          {["arw", "arw-a", "arw-b", "arw-f"].map((id, k) => (
            <marker key={id} id={`cg-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={["#9a9683", "#3d5a3d", "#c98b45", "#2c452e"][k]} />
            </marker>
          ))}
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
          {graph.edges.map((e, i) => {
            const st = edgeState(e, i);
            const a = P(e.source);
            const b = P(e.target);
            const mx = (a.x + b.x) / 2;
            const cy = (a.y + b.y) / 2 - 20;
            const stroke =
              st === "pruned" ? "#c98b45" :
              st === "active" || st === "focus" ? "#3d5a3d" :
              st === "backdoor" ? "#c98b45" :
              st === "dim" ? "#cbc6b6" : e.discovered ? "#a8a492" : "#cbb89a";
            const w = st === "active" || st === "focus" || st === "backdoor" ? 2.4 : e.strength === "strong" ? 1.9 : e.strength === "moderate" ? 1.3 : 0.9;
            const marker =
              st === "active" || st === "focus" ? "url(#cg-arw-a)" :
              st === "backdoor" || st === "pruned" ? "url(#cg-arw-b)" : "url(#cg-arw)";
            return (
              <g key={i} opacity={st === "dim" ? 0.16 : st === "pruned" ? 0.6 : 1}>
                <path
                  d={`M ${a.x} ${a.y} Q ${mx} ${cy} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={w}
                  strokeDasharray={e.pruned || !e.discovered ? "5 4" : undefined}
                  markerEnd={marker}
                  className={st === "active" ? "flow-dash" : undefined}
                />
                {/* fat invisible hit area */}
                <path
                  d={`M ${a.x} ${a.y} Q ${mx} ${cy} ${b.x} ${b.y}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ cursor: "pointer" }}
                  onPointerEnter={() => setHover({ kind: "edge", i })}
                  onPointerLeave={() => setHover(null)}
                />
                {e.pruned && (
                  <g transform={`translate(${mx} ${(a.y + b.y) / 2}) scale(${1 / view.z})`}>
                    <circle r={6} fill="#fcfbf6" stroke="#c98b45" strokeWidth={1} />
                    <path d="M-2.6 -2.6 L2.6 2.6 M2.6 -2.6 L-2.6 2.6" stroke="#c98b45" strokeWidth={1.4} />
                  </g>
                )}
                {st === "active" && (
                  <circle r={3.4} fill="#3d5a3d">
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="linear"
                      path={`M ${a.x} ${a.y} Q ${mx} ${cy} ${b.x} ${b.y}`}
                    />
                    <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.15;0.7;1" />
                  </circle>
                )}
                {!compact && !e.pruned && st !== "dim" && (
                  <text x={mx} y={cy + 5} textAnchor="middle" fontSize={8.5} fill="#8b887b" pointerEvents="none">
                    {e.coef > 0 ? "+" : ""}
                    {e.coef}
                  </text>
                )}
              </g>
            );
          })}

          {graph.nodes.map((n) => {
            const p = P(n.id);
            const r = n.role === "outcome" ? 13 : n.role === "treatment" ? 11 : 9;
            const isSel = selected === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                opacity={nodeDim(n.id) ? 0.28 : 1}
                style={{ cursor: interactive ? "grab" : "pointer" }}
                onPointerDown={(e) => onPointerDownNode(e, n.id)}
                onPointerEnter={() => setHover({ kind: "node", id: n.id })}
                onPointerLeave={() => setHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((s) => (s === n.id ? null : n.id));
                }}
              >
                {isSel && <circle r={r + 6} fill="none" stroke={ROLE_COLOR[n.role]} strokeWidth={1.5} opacity={0.5} />}
                <circle r={r} fill={ROLE_COLOR[n.role]} stroke="#fcfbf6" strokeWidth={2.5} />
                <text
                  x={0}
                  y={r + 12}
                  textAnchor="middle"
                  fontSize={compact ? 8.5 : 9.5}
                  fill="#55534a"
                  fontWeight={n.role === "outcome" || n.role === "treatment" ? 700 : 500}
                  pointerEvents="none"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {tip && tipXY && wrapRef.current && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-line bg-card px-2.5 py-2 text-[11px] leading-snug text-ink-soft shadow-[0_6px_20px_rgba(44,46,30,0.12)]"
          style={{
            left: Math.max(4, Math.min((tipXY.x / VB_W) * (wrapRef.current.clientWidth || VB_W) + 10, (wrapRef.current.clientWidth || VB_W) - 224)),
            top: Math.max(4, (tipXY.y / height) * height - 8),
          }}
        >
          <div className="font-semibold text-ink">{tip.title}</div>
          {tip.lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      {interactive && !compact && (
        <div className="pointer-events-none absolute bottom-1 left-1 text-[10px] text-muted">
          {selected ? "click a node again or the background to clear · drag to rearrange" : "click a node to trace its causal paths · drag to rearrange"}
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
        active ? "border-forest/50 bg-forest text-white" : "border-line bg-card text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function tipForNode(n: Node, g: G, treatment?: Node, outcome?: Node) {
  const inn = g.edges.filter((e) => e.target === n.id && !e.pruned).length;
  const out = g.edges.filter((e) => e.source === n.id && !e.pruned).length;
  const lines = [ROLE_LABEL[n.role], `${inn} in · ${out} out`];
  if (n.id === treatment?.id) lines.push("Click to see every path to the outcome");
  if (n.id === outcome?.id) lines.push("Click to see all upstream drivers");
  return { title: n.label, lines };
}

function tipForEdge(e: Edge, g: G) {
  const s = g.nodes.find((n) => n.id === e.source)?.label ?? e.source;
  const t = g.nodes.find((n) => n.id === e.target)?.label ?? e.target;
  if (e.pruned) {
    return { title: `${s} → ${t}`, lines: ["Spurious — retained by PC, pruned by domain knowledge", `Bootstrap frequency ${Math.round(e.bootstrapFreq * 100)}%`] };
  }
  return {
    title: `${s} → ${t}`,
    lines: [
      `Structural coefficient ${e.coef > 0 ? "+" : ""}${e.coef}`,
      `Bootstrap frequency ${Math.round(e.bootstrapFreq * 100)}%`,
      e.discovered ? "Recovered by autonomous PC" : "Added by domain knowledge (Fisher-Z blind)",
    ],
  };
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function screenXY(p: { x: number; y: number }, v: { z: number; x: number; y: number }) {
  return { x: p.x * v.z + v.x, y: p.y * v.z + v.y };
}

export function GraphLegend({ showDiscovery = true }: { showDiscovery?: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
      {Object.entries(ROLE_COLOR).map(([k, c]) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          <span className="capitalize">{k}</span>
        </span>
      ))}
      {showDiscovery && (
        <>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0 w-4 border-t-2 border-dashed border-[#cbb89a]" />
            added by domain knowledge
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[#c98b45]">✕</span> spurious · pruned
          </span>
        </>
      )}
    </div>
  );
}
