"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { Play, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle } from "@/components/ui";

type Decision = CausalFixture["agentDecisions"][number];

const SEV = {
  ok: "bg-forest",
  warn: "bg-amber",
  crit: "bg-danger",
} as const;

export function CounterfactualReplay({ f, decision }: { f: CausalFixture; decision: Decision }) {
  const [run, setRun] = useState(0);
  const n = f.narrative;
  const unit = f.scenario.outcomeUnit;
  const observed = decision.outcomeDays;
  const counter = decision.counterfactualDays;
  const saved = +(observed - counter).toFixed(1);

  // observed track = the incident steps; counterfactual track = same stages, held at baseline
  const steps = n.incident.steps;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionTitle hint={`case ${decision.caseId}`}>Counterfactual replay</SectionTitle>
        <button
          onClick={() => setRun((r) => r + 1)}
          className="no-print inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft hover:border-forest/40 hover:text-forest"
        >
          <Play size={12} /> Replay
        </button>
      </div>
      <p className="-mt-1 mb-3 text-[12px] text-muted">
        Left: what the {n.agentName} actually did. Right: what the causal model says would have happened had it chosen{" "}
        <b className="text-ink-soft">{n.altLabel}</b>.
      </p>

      <div key={run} className="grid gap-4 sm:grid-cols-2">
        <Track title={`Observed · ${n.decisionLabel}`} tone="danger">
          {steps.map((st, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.35 }}
              className="relative flex gap-2.5 pb-3 pl-3"
            >
              <span className={clsx("absolute left-0 top-1 h-2 w-2 rounded-full", SEV[st.sev])} />
              <span className="text-[11px] tabular-nums text-muted">{st.t}</span>
              <span className="text-[12px] text-ink-soft">{st.note}</span>
            </motion.li>
          ))}
          <Endcap value={observed} unit={unit} tone="danger" label={n.outcomeLabel} />
        </Track>

        <Track title={`Counterfactual · ${n.altLabel}`} tone="forest">
          {steps.map((st, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.35 }}
              className="relative flex gap-2.5 pb-3 pl-3"
            >
              <span className="absolute left-0 top-1 h-2 w-2 rounded-full bg-forest" />
              <span className="text-[11px] tabular-nums text-muted">{st.t}</span>
              <span className="text-[12px] text-ink-soft">
                {i === 0 ? `${n.altLabel} selected instead` : i === steps.length - 1 ? "Delivered within SLA window" : "Path stays near baseline"}
              </span>
            </motion.li>
          ))}
          <Endcap value={counter} unit={unit} tone="forest" label="On-time / near baseline" />
        </Track>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + steps.length * 0.35 }}
        className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper-2/60 p-3 text-sm"
      >
        <span className="font-display text-lg text-ink tabular-nums">{observed.toFixed(1)}</span>
        <ArrowRight size={14} className="text-muted" />
        <span className="font-display text-lg text-forest tabular-nums">{counter.toFixed(1)}</span>
        <span className="text-muted">{unit}</span>
        <span className="ml-1 rounded-full bg-sage px-2 py-0.5 text-[11px] font-semibold text-forest-deep">
          −{saved} {unit} attributable to this decision
        </span>
        <span className="w-full text-[11px] text-muted">
          Case total delay {decision.outcomeDays.toFixed(1)} {unit} decomposes into ~
          {decision.controllableDays.toFixed(1)} controllable and ~{decision.structuralDays.toFixed(1)} structural{" "}
          {unit}; the replay isolates the portion driven by this one decision.
        </span>
      </motion.div>
    </Card>
  );
}

function Track({ title, tone, children }: { title: string; tone: "forest" | "danger"; children: React.ReactNode }) {
  return (
    <div>
      <div
        className={clsx(
          "mb-2 text-[11px] font-semibold uppercase tracking-wide",
          tone === "forest" ? "text-forest-deep" : "text-danger",
        )}
      >
        {title}
      </div>
      <ul className="relative ml-1 border-l border-line-soft">{children}</ul>
    </div>
  );
}

function Endcap({ value, unit, tone, label }: { value: number; unit: string; tone: "forest" | "danger"; label: string }) {
  return (
    <li className="relative flex items-baseline gap-2 pl-3 pt-1">
      <span className={clsx("absolute left-0 top-2 h-2 w-2 rounded-full", tone === "forest" ? "bg-forest" : "bg-danger")} />
      <span className={clsx("font-display text-xl tabular-nums", tone === "forest" ? "text-forest" : "text-danger")}>
        {value.toFixed(1)}
      </span>
      <span className="text-[11px] text-muted">
        {unit} · {label}
      </span>
    </li>
  );
}
