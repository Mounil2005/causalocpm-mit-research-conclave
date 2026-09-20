"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Bot } from "lucide-react";
import { motion } from "framer-motion";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle, Pill } from "@/components/ui";

type Sev = "ok" | "warn" | "crit";

const DOT = { ok: "#3d5a3d", warn: "#b1702c", crit: "#b0413a" } as const;

export function LiveSupplyChain({ f }: { f: CausalFixture }) {
  const n = f.narrative;
  const stages = n.stages;
  const steps = n.incident.steps;
  const [sev, setSev] = useState<Record<string, Sev>>({});
  const [cursor, setCursor] = useState(-1); // -1 = idle, index into steps
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setSev({});
    setCursor(-1);
  }, [stop]);

  const play = useCallback(() => {
    reset();
    let i = 0;
    const advance = () => {
      if (i >= steps.length) return;
      const st = steps[i];
      setCursor(i);
      setSev((prev) => ({ ...prev, [st.stageId]: st.sev }));
      i += 1;
      timer.current = window.setTimeout(advance, 1400);
    };
    timer.current = window.setTimeout(advance, 400);
  }, [reset, steps]);

  useEffect(() => () => stop(), [stop]);

  const active = cursor >= 0 && cursor < steps.length ? steps[cursor] : null;
  const worst = Object.values(sev).includes("crit") ? "crit" : Object.values(sev).includes("warn") ? "warn" : "ok";

  const W = 720;
  const H = 150;
  const gap = W / stages.length;

  return (
    <Card id="tour-twin">
      <div className="flex items-center justify-between">
        <SectionTitle hint={n.agentRole}>Live supply-chain twin</SectionTitle>
        <div className="no-print flex gap-1.5">
          <button
            onClick={play}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft hover:border-forest/40 hover:text-forest"
          >
            <Play size={12} /> Run incident
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft hover:border-forest/40 hover:text-forest"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      <div className="scroll-slim overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" style={{ height: H }}>
          {stages.slice(0, -1).map((_, i) => {
            const x1 = gap * (i + 0.5);
            const x2 = gap * (i + 1.5);
            const lit = cursor >= 0 && i < cursor;
            return (
              <line
                key={i}
                x1={x1}
                y1={H / 2}
                x2={x2}
                y2={H / 2}
                stroke={lit ? DOT.warn : "#d9d2c2"}
                strokeWidth={lit ? 2.5 : 1.5}
                strokeDasharray="5 5"
                className={lit ? "flow-dash" : undefined}
              />
            );
          })}
          {stages.map((s, i) => {
            const cx = gap * (i + 0.5);
            const st: Sev = sev[s.id] ?? "ok";
            const isActive = active?.stageId === s.id;
            return (
              <g key={s.id}>
                {isActive && (
                  <motion.circle
                    cx={cx}
                    cy={H / 2}
                    r={18}
                    fill="none"
                    stroke={DOT[st]}
                    strokeWidth={1.5}
                    initial={{ r: 12, opacity: 0.8 }}
                    animate={{ r: 26, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                <motion.circle
                  cx={cx}
                  cy={H / 2}
                  r={11}
                  animate={{ fill: DOT[st] }}
                  transition={{ duration: 0.4 }}
                />
                <text x={cx} y={H / 2 + 34} textAnchor="middle" className="fill-ink" style={{ fontSize: 11, fontWeight: 600 }}>
                  {s.label}
                </text>
                {s.agent && (
                  <text x={cx} y={H / 2 - 22} textAnchor="middle" className="fill-forest" style={{ fontSize: 8.5 }}>
                    ▸ {s.agent}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Pill tone={worst === "crit" ? "danger" : worst === "warn" ? "amber" : "forest"}>
          {worst === "crit" ? "SLA breach" : worst === "warn" ? "Degrading" : "Nominal"}
        </Pill>
        <span className="text-[12px] text-muted">
          {active ? (
            <>
              <b className="tabular-nums text-ink-soft">{active.t}</b> — {active.note}
            </>
          ) : cursor >= steps.length ? (
            `Trigger: ${n.incident.trigger}. The ${n.agentName}'s choice propagated to an SLA breach — now auditable in Decision Audit.`
          ) : (
            `Idle. Press "Run incident" to replay: ${n.incident.trigger}.`
          )}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-paper-2/60 p-3 text-[12px] text-ink-soft">
        <Bot size={14} className="mt-0.5 shrink-0 text-forest" />
        <span>
          This is a digital twin of the process the {n.agentName} operates in — not a live feed. Each incident is a
          replayable scenario the causal engine can then audit.
        </span>
      </div>
    </Card>
  );
}
