"use client";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Bot, Check, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { CountUp } from "@/components/motion";
import { CausalGraph } from "@/components/CausalGraph";
import { simulate, defaultLeverValues } from "@/lib/simulator";
import { fmtMoney } from "@/lib/format";
import { StoryChain, type Stage } from "./StoryChain";

export type SceneProps = { f: CausalFixture; speed: number; onNext: () => void; onRestart: () => void; last: boolean };

/** reveal steps 0..n-1 one at a time, `every` ms apart (scaled by speed); restarts when `key` changes */
function useReveal(n: number, every: number, speed: number, key: unknown) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    let cur = 0;
    const id = window.setInterval(() => {
      cur += 1;
      setI(cur);
      if (cur >= n) window.clearInterval(id);
    }, every / speed);
    return () => window.clearInterval(id);
  }, [n, every, speed, key]);
  return i;
}

function NextButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition-transform hover:-translate-y-0.5"
    >
      {label}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/* ─────────────────────────── Scene 1 · Incident ─────────────────────────── */
export function IncidentScene({ f, onNext }: SceneProps) {
  const s = f.story;
  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full bg-[#f1ddd6] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-danger">
        <AlertTriangle size={13} /> Flagged for causal review
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 font-display text-3xl text-ink sm:text-4xl">
        {f.domain === "manufacturing" ? "Shipment" : "Admission"} {s.incidentId}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 text-[15px] text-ink-soft">
        An autonomous {s.agent.name.toLowerCase()} made a decision. Something went wrong downstream.
        This system reconstructs <b>what actually caused it</b> — and what would have happened if the agent had chosen differently.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mx-auto mt-7 max-w-md rounded-2xl border border-line bg-card p-5 text-left shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-line-soft pb-3 text-[12px] font-semibold uppercase tracking-wide text-muted">
          <Bot size={14} className="text-forest" /> AI decision receipt
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Agent" v={s.agent.name} />
          <Row k="Decision" v={<b className="text-ink">{s.agent.decision}</b>} />
          <Row k="Chosen over" v={s.agent.alt} />
          <Row k="Stated confidence" v={`${s.agent.confidencePct}%`} />
          <Row k="Case" v={s.caseId} />
        </dl>
        <div className="mt-3 border-t border-line-soft pt-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Signals the agent weighed</div>
          <div className="mt-1.5 space-y-1">
            {s.agent.signals.map((sig) => (
              <div key={sig.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[12px]">
                <span className="text-ink-soft">{sig.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full bg-forest/70" style={{ width: `${sig.weight * 100}%` }} />
                  </div>
                  <span className="w-7 text-right tabular-nums text-muted">{Math.round(sig.weight * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-7">
        <NextButton label="Watch what happened" onClick={onNext} />
      </motion.div>
    </div>
  );
}

/* ─────────────────────────── Scene 2 · Ripple ─────────────────────────── */
export function RippleScene({ f, speed, onNext }: SceneProps) {
  const s = f.story.ripple;
  const stages = s.stages as Stage[];
  const steps = s.steps;
  const shown = useReveal(steps.length, 1500, speed, "ripple");

  const sev: Record<string, "ok" | "warn" | "crit"> = {};
  let reached = -1;
  let activeId: string | undefined;
  steps.slice(0, shown).forEach((st) => {
    sev[st.stageId] = st.sev;
    const idx = stages.findIndex((g) => g.id === st.stageId);
    reached = Math.max(reached, idx);
    activeId = st.stageId;
  });
  const done = shown >= steps.length;
  const climbing = Math.min(s.finalDelayDays, (shown / steps.length) * s.finalDelayDays);

  return (
    <div className="mx-auto max-w-3xl">
      <SceneHead kicker="What happened" title="One decision, rippling through the chain" />
      <div className="mt-4 rounded-2xl border border-line bg-card p-5 shadow-sm">
        <StoryChain stages={stages} sev={sev} activeId={done ? undefined : activeId} reachedIndex={reached + (done ? 1 : 0)} />
        <div className="mt-2 min-h-[2.5rem] text-center text-[13px] text-ink-soft">
          {shown === 0 && `Trigger — ${f.story.trigger}.`}
          {shown > 0 && !done && steps[shown - 1] && (
            <span>
              <b className="tabular-nums text-ink">{steps[shown - 1].t}</b> · {steps[shown - 1].note}
            </span>
          )}
          {done && <span>The {f.story.agent.name}&rsquo;s choice propagated all the way to the customer.</span>}
        </div>
      </div>

      <div className="mt-5 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Downstream delay</div>
        <div className={clsx("font-display text-5xl", done ? "text-danger" : "text-ink")}>
          {climbing.toFixed(1)}
          <span className="ml-1 text-lg text-muted">{f.story.outcomeUnit}</span>
        </div>
      </div>

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
          <NextButton label="Why did this happen?" onClick={onNext} />
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────── Scene 3 · Cause ─────────────────────────── */
export function CauseScene({ f, speed, onNext }: SceneProps) {
  const c = f.story.cause;
  const activeEdges = useMemo(() => {
    const set = new Set<string>();
    f.causalGraph.edges.forEach((e) => {
      const a = f.causalGraph.nodes.find((n) => n.id === e.source)?.label;
      const b = f.causalGraph.nodes.find((n) => n.id === e.target)?.label;
      if (a && b && c.path.includes(a) && c.path.includes(b)) set.add(`${e.source}->${e.target}`);
    });
    return set;
  }, [f, c.path]);
  const reveal = useReveal(4, 900, speed, "cause");

  return (
    <div className="mx-auto max-w-3xl">
      <SceneHead kicker="What caused it" title="The same events, re-drawn as cause and effect" />
      <p className="mt-1 text-[13px] text-muted">
        A dashboard stops at &ldquo;Supplier A appears next to delays.&rdquo; We test whether it actually caused them.
      </p>

      <div className="mt-4 rounded-2xl border border-line bg-card p-4 shadow-sm">
        <CausalGraph graph={f.causalGraph} height={260} compact interactive={false} activeEdges={activeEdges} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric show={reveal >= 1} label="A dashboard reports" value={c.naiveDays.toFixed(2)} unit={f.story.outcomeUnit} tone="muted" />
        <Metric show={reveal >= 2} label={`Of that, ${c.confounderLabel.toLowerCase()}`} value={`−${c.confoundingDays.toFixed(2)}`} unit={`${f.story.outcomeUnit} (${c.confoundingPct}%)`} tone="amber" />
        <Metric show={reveal >= 3} label="True causal effect" value={c.effectDays.toFixed(2)} unit={f.story.outcomeUnit} tone="forest" />
      </div>

      {reveal >= 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-line bg-paper-2/60 p-4">
          <div className="font-display text-xl text-ink">
            {f.scenario.treatmentLabel} → <span className="text-forest">+{c.effectDays.toFixed(2)} {f.story.outcomeUnit}</span>
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">
            High-{c.confounderLabel.toLowerCase()} cases were routed here anyway and run slower regardless — that shared
            cause inflated the raw number. Adjusting it out leaves the real effect.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-soft pt-3 text-[13px]">
            <span className="text-muted">Agent&rsquo;s stated confidence <b className="text-ink">{f.story.confidenceGap.agentPct}%</b></span>
            <span className="text-muted">Causal support <b className="text-amber">{f.story.confidenceGap.causalPct}%</b></span>
            <span className="rounded-full bg-[#f4ead9] px-2 py-0.5 text-[11px] font-semibold text-amber">
              {f.story.confidenceGap.agentPct - f.story.confidenceGap.causalPct}-point confidence gap
            </span>
          </div>
        </motion.div>
      )}

      {reveal >= 3 && (
        <div className="mt-6 text-center">
          <NextButton label="What if the agent had chosen differently?" onClick={onNext} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Scene 4 · What-if ─────────────────────────── */
export function WhatIfScene({ f, speed, onNext }: SceneProps) {
  const w = f.story.whatIf;
  const stepsA = f.story.ripple.steps;
  const shown = useReveal(stepsA.length + 1, 1100, speed, "whatif");
  const done = shown > stepsA.length;

  const actual = done ? w.actualDays : (shown / stepsA.length) * w.actualDays;
  const cf = done ? w.cfDays : Math.min(w.cfDays, (shown / stepsA.length) * w.cfDays * 1.1);

  return (
    <div className="mx-auto max-w-3xl">
      <SceneHead kicker="What if" title="Replay the decision — both ways at once" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <World tone="danger" heading={`Actual · ${w.actualLabel}`} steps={stepsA.map((s) => s.note)} shown={shown} value={actual} unit={f.story.outcomeUnit} caption={f.story.ripple.steps.at(-1)?.note ?? ""} />
        <World
          tone="forest"
          heading={`Counterfactual · ${w.cfLabel}`}
          steps={stepsA.map((_, i) => (i === 0 ? `${w.cfLabel} selected instead` : i === stepsA.length - 1 ? "Delivered within the SLA window" : "Path holds near baseline"))}
          shown={shown}
          value={cf}
          unit={f.story.outcomeUnit}
          caption="On time"
        />
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 rounded-2xl border border-forest/30 bg-sage/50 p-5 text-center">
          <div className="font-display text-4xl text-forest">
            <CountUp value={w.savedDays} decimals={1} /> {f.story.outcomeUnit} could have been saved
          </div>
          <div className="mt-1 text-[13px] text-forest-deep">≈ {w.reductionPct}% less delay on this decision</div>
        </motion.div>
      )}

      {done && (
        <div className="mt-6 text-center">
          <NextButton label="Change the cause yourself" onClick={onNext} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Scene 5 · Intervention ─────────────────────────── */
export function TuneScene({ f, onNext }: SceneProps) {
  const lever = useMemo(() => f.simulator.levers.find((l) => l.kind === "slider") ?? f.simulator.levers[0], [f]);
  // start pre-nudged so the propagation is visible immediately; the judge can then play
  const [val, setVal] = useState(() => round1(lever.baseline + (lever.max - lever.baseline) * 0.45, lever.step));
  const values = { ...defaultLeverValues(f), [lever.id]: val };
  const r = simulate(f, values);
  const better = r.predicted < r.baseline - 0.05;
  const worse = r.predicted > r.baseline + 0.05;

  return (
    <div className="mx-auto max-w-3xl">
      <SceneHead kicker="Change the cause" title="Move a cause — watch the effect propagate" />
      <p className="mt-1 text-[13px] text-muted">
        This isn&rsquo;t a number that just updates. Each change flows through the fitted structural model:
        cause → mediators → outcome → cost.
      </p>

      <div className="mt-4 rounded-2xl border border-line bg-card p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-semibold text-ink">{lever.label}</label>
          <span className="tabular-nums text-sm text-forest">
            {val}
            {lever.unit}
          </span>
        </div>
        <input
          type="range"
          min={lever.min}
          max={lever.max}
          step={lever.step}
          value={val}
          onChange={(e) => setVal(+e.target.value)}
          className="mt-2 w-full"
        />
        <p className="mt-1 text-[11px] text-muted">{lever.hint}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {r.mediators.map((m) => (
            <div key={m.name} className="rounded-lg border border-line bg-paper-2/50 p-3">
              <div className="text-[11px] text-muted">{m.name}</div>
              <div className="font-display text-lg text-ink tabular-nums">
                {m.baseline.toFixed(1)} <span className="text-muted">→</span>{" "}
                <span className={m.predicted < m.baseline - 0.05 ? "text-forest" : "text-ink"}>{m.predicted.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-muted">{m.unit}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line-soft pt-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted">{f.simulator.outcomeLabel}</div>
            <div className="font-display text-3xl tabular-nums text-ink">
              {r.baseline.toFixed(1)} <span className="text-muted">→</span>{" "}
              <span className={better ? "text-forest" : worse ? "text-danger" : "text-ink"}>{r.predicted.toFixed(1)}</span>
              <span className="ml-1 text-base text-muted">{f.story.outcomeUnit}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-muted">Modeled annual impact</div>
            <div className="font-display text-2xl tabular-nums text-forest">
              {r.annualSavings > 0 ? `+${fmtMoney(r.annualSavings)}` : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <NextButton label="What should we do?" onClick={onNext} />
      </div>
    </div>
  );
}

function round1(n: number, step: number) {
  const s = step || 1;
  return Math.round(n / s) * s;
}

/* ─────────────────────────── Scene 6 · Action ─────────────────────────── */
export function ActionScene({ f, onNext }: SceneProps) {
  const a = f.story.action;
  return (
    <div className="mx-auto max-w-2xl">
      <SceneHead kicker="What to do" title="The intervention the causal model backs" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-forest-deep">
          <Sparkles size={14} /> {a.confidence} confidence
        </div>
        <h3 className="mt-1 font-display text-2xl text-ink">{a.title}</h3>
        <p className="mt-2 text-[14px] text-ink-soft">{a.detail}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric show label="Delay reduction" value={`~${a.reductionPct}%`} tone="forest" />
          <Metric show label="Modeled savings" value={`~${fmtMoney(a.annualSavings)}`} unit="/ yr" tone="forest" />
          <Metric show label="Payback" value={a.payback} tone="ink" />
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Savings are a modeled business estimate — reduction % from the causal simulator, applied to in-scope volume at a
          configurable cost per delay-day. The defensible part is the causal effect underneath it.
        </p>
      </motion.div>
      <div className="mt-6 text-center">
        <NextButton label="Can we trust this?" onClick={onNext} />
      </div>
    </div>
  );
}

/* ─────────────────────────── Scene 7 · Trust ─────────────────────────── */
export function TrustScene({ f, speed, onRestart }: SceneProps) {
  const t = f.story.trust;
  const shown = useReveal(t.checks.length, 700, speed, "trust");
  const [tech, setTech] = useState(false);
  const allDone = shown >= t.checks.length;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <SceneHead kicker="Can we trust it" title="The system challenges its own answer" center />
      <div className="mx-auto mt-4 max-w-md space-y-2 text-left">
        {t.checks.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, x: -8 }}
            animate={i < shown ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -8 }}
            className="flex items-start gap-2 rounded-lg border border-line bg-card p-3"
          >
            <span className={clsx("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", i < shown ? "bg-forest text-paper" : "bg-line-soft")}>
              {i < shown && <Check size={11} />}
            </span>
            <span>
              <span className="text-[13px] font-medium text-ink">{c.label}</span>
              <span className="block text-[11px] text-muted">{c.detail}</span>
            </span>
          </motion.div>
        ))}
      </div>

      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 font-display text-lg text-forest-deep">
            <ShieldCheck size={16} /> {t.verdict}
          </div>
          <div className="mt-3">
            <button onClick={() => setTech((v) => !v)} className="text-[12px] font-medium text-muted underline underline-offset-2 hover:text-ink">
              {tech ? "Hide" : "Show"} technical evidence
            </button>
          </div>
          {tech && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
              {t.evidence.map((e) => (
                <div key={e.k} className="rounded-lg border border-line bg-paper-2/50 p-2.5">
                  <div className="font-display text-base text-ink tabular-nums">{e.v}</div>
                  <div className="text-[10px] text-muted">{e.k}</div>
                </div>
              ))}
            </motion.div>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={onRestart} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:border-forest/40">
              <RotateCcw size={14} /> Replay
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────── shared bits ─────────────────────────── */
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft pb-1.5 last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-ink">{v}</dd>
    </div>
  );
}

function SceneHead({ kicker, title, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : undefined}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest">{kicker}</div>
      <h2 className="mt-1 font-display text-2xl text-ink sm:text-[28px]">{title}</h2>
    </div>
  );
}

function Metric({
  show,
  label,
  value,
  unit,
  tone = "ink",
}: {
  show: boolean;
  label: string;
  value: string;
  unit?: string;
  tone?: "ink" | "muted" | "forest" | "amber";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      className="rounded-lg border border-line bg-paper-2/50 p-3"
    >
      <div className="text-[11px] text-muted">{label}</div>
      <div
        className={clsx(
          "font-display text-xl tabular-nums",
          tone === "forest" && "text-forest",
          tone === "muted" && "text-muted",
          tone === "amber" && "text-amber",
          tone === "ink" && "text-ink",
        )}
      >
        {value}
        {unit ? <span className="ml-1 text-[0.6em] text-muted">{unit}</span> : null}
      </div>
    </motion.div>
  );
}

function World({
  tone,
  heading,
  steps,
  shown,
  value,
  unit,
  caption,
}: {
  tone: "danger" | "forest";
  heading: string;
  steps: string[];
  shown: number;
  value: number;
  unit: string;
  caption: string;
}) {
  return (
    <div className={clsx("rounded-2xl border p-4", tone === "danger" ? "border-danger/25 bg-[#f1ddd6]/25" : "border-forest/25 bg-sage/25")}>
      <div className={clsx("text-[11px] font-semibold uppercase tracking-wide", tone === "danger" ? "text-danger" : "text-forest-deep")}>{heading}</div>
      <ul className="mt-2 space-y-1.5">
        {steps.map((st, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: tone === "danger" ? -6 : 6 }}
            animate={i < shown ? { opacity: 1, x: 0 } : { opacity: 0.15 }}
            className="flex gap-2 text-[12px] text-ink-soft"
          >
            <span className={tone === "danger" ? "text-danger" : "text-forest"}>•</span> {st}
          </motion.li>
        ))}
      </ul>
      <div className={clsx("mt-3 border-t pt-2 font-display text-2xl tabular-nums", tone === "danger" ? "border-danger/20 text-danger" : "border-forest/20 text-forest")}>
        {value.toFixed(1)} <span className="text-sm text-muted">{unit} · {caption}</span>
      </div>
    </div>
  );
}

export const SCENES = [IncidentScene, RippleScene, CauseScene, WhatIfScene, TuneScene, ActionScene, TrustScene];
export const SCENE_LABELS = ["Incident", "What happened", "What caused it", "What if", "Change the cause", "What to do", "Can we trust it"];
