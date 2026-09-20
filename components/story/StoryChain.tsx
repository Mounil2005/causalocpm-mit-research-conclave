"use client";
import { motion } from "framer-motion";

type Sev = "ok" | "warn" | "crit";
const DOT = { ok: "#3d5a3d", warn: "#b1702c", crit: "#b0413a" } as const;

export type Stage = { id: string; label: string; agent?: string };

/** Controlled horizontal supply-chain flow. Parent drives severity + which node is active. */
export function StoryChain({
  stages,
  sev,
  activeId,
  reachedIndex = -1,
  height = 150,
}: {
  stages: Stage[];
  sev: Record<string, Sev>;
  activeId?: string;
  reachedIndex?: number;
  height?: number;
}) {
  const W = 760;
  const gap = W / stages.length;
  return (
    <div className="scroll-slim overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full min-w-[560px]" style={{ height }}>
        {stages.slice(0, -1).map((_, i) => {
          const lit = i < reachedIndex;
          return (
            <line
              key={i}
              x1={gap * (i + 0.5)}
              y1={height / 2}
              x2={gap * (i + 1.5)}
              y2={height / 2}
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
          const active = activeId === s.id;
          return (
            <g key={s.id}>
              {active && (
                <motion.circle
                  cx={cx}
                  cy={height / 2}
                  fill="none"
                  stroke={DOT[st]}
                  strokeWidth={1.5}
                  initial={{ r: 12, opacity: 0.8 }}
                  animate={{ r: 27, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <motion.circle cx={cx} cy={height / 2} r={11} animate={{ fill: DOT[st] }} transition={{ duration: 0.4 }} />
              <text x={cx} y={height / 2 + 33} textAnchor="middle" className="fill-ink" style={{ fontSize: 11, fontWeight: 600 }}>
                {s.label}
              </text>
              {s.agent && (
                <text x={cx} y={height / 2 - 21} textAnchor="middle" className="fill-forest" style={{ fontSize: 8.5 }}>
                  ▸ {s.agent}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
