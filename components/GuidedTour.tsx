"use client";
import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { AnimatePresence, motion } from "@/components/motion";

export interface TourStep {
  tab: string;
  anchor: string;
  kicker: string;
  title: string;
  body: string;
}

export function buildTour(f: CausalFixture): TourStep[] {
  const t = f.effects[0];
  const a = f.recommendedActions[0];
  const [c0, c1] = f.executiveSummary.chain;
  return [
    {
      tab: "overview",
      anchor: "tour-alert",
      kicker: "1 · The problem",
      title: `A dashboard would blame ${f.scenario.treatmentLabel} for ${t.naiveDays} ${f.scenario.outcomeUnit}`,
      body: `Traditional process mining reads raw correlation. It sees ${f.scenario.treatmentLabel} next to long delays and says "change it". Acting on that number wastes money — because it's confounded.`,
    },
    {
      tab: "data",
      anchor: "tour-dag",
      kicker: "2 · The confounding trap",
      title: `${c0} drives both ${c1} and the outcome`,
      body: `Click ${c1} in the graph to trace its paths: complex work is routed to it AND is inherently slower. That shared cause (${c0}) inflates the correlation — the link constraint-based mining cannot see.`,
    },
    {
      tab: "overview",
      anchor: "tour-explainer",
      kicker: "3 · Honest discovery",
      title: `Autonomous discovery: F1 ${f.discoveryMetrics.f1.toFixed(2)}`,
      body: `Bootstrapped PC recovers ${f.discoveryMetrics.truePositives} of ${f.scenario.causalLinks} planted edges${f.discoveryMetrics.falsePositives ? `, plus ${f.discoveryMetrics.falsePositives} spurious one` : " with no spurious edges"}. Not 1.0 — and it shouldn't be. Domain knowledge closes the gap; toggle "Autonomous PC / + Domain knowledge" to see.`,
    },
    {
      tab: "model",
      anchor: "tour-effect",
      kicker: "4 · The true effect",
      title: `${t.effectDays} ${f.scenario.outcomeUnit}, not ${t.naiveDays}`,
      body: `Double ML removes the confounding bias. The recovered effect is ${t.effectDays} ${f.scenario.outcomeUnit} — within ${f.pipelinePerf.effectErrorPct}% of the value we planted, with a CI that contains the truth.`,
    },
    {
      tab: "model",
      anchor: "tour-sim",
      kicker: "5 · What to do about it",
      title: a.title,
      body: `Drag the simulator levers and the structural model re-solves live. The recommended plan: ${a.reductionPct}% reduction, ~$${Math.round(a.annualSavings / 1000)}K/year, payback ${f.report.roiPayback}.`,
    },
    {
      tab: "model",
      anchor: "tour-sensitivity",
      kicker: "6 · Why trust it",
      title: `E-value ${f.sensitivity.eValue} · robust to what we can't measure`,
      body: `Placebo test ≈ 0, stable when a noise confounder is added, and the same pipeline reproduces the result on an independent domain with no code changes.`,
    },
  ];
}

export function GuidedTour({
  steps,
  onGo,
  onClose,
}: {
  steps: TourStep[];
  onGo: (tab: string, anchor: string) => void;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const step = steps[i];

  const go = useCallback(
    (n: number) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, n));
      setI(clamped);
      onGo(steps[clamped].tab, steps[clamped].anchor);
    },
    [steps, onGo],
  );

  // initial navigation, once
  useEffect(() => {
    onGo(steps[0].tab, steps[0].anchor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keyboard nav
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [i, go, onClose]);

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-[560px] px-4"
    >
      <div className="rounded-2xl border border-forest/30 bg-forest-deep text-white shadow-[0_20px_50px_rgba(20,30,20,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sage-2">{step.kicker}</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {steps.map((_, k) => (
                <button
                  key={k}
                  onClick={() => go(k)}
                  className={clsx("h-1.5 rounded-full transition-all", k === i ? "w-5 bg-sage-2" : "w-1.5 bg-white/25")}
                  aria-label={`Step ${k + 1}`}
                />
              ))}
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close tour">
              <X size={15} />
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3"
          >
            <div className="font-display text-lg leading-snug">{step.title}</div>
            <p className="mt-1 text-sm text-white/75">{step.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-white/70 hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <span className="text-[11px] text-white/40">{i + 1} / {steps.length}</span>
          {i < steps.length - 1 ? (
            <button
              onClick={() => go(i + 1)}
              className="inline-flex items-center gap-1 rounded-lg bg-sage-2 px-3 py-1.5 text-[13px] font-medium text-forest-deep"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={onClose} className="rounded-lg bg-sage-2 px-3 py-1.5 text-[13px] font-medium text-forest-deep">
              Done
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TourButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-forest px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-forest-deep"
    >
      <Play size={13} /> Guided tour
    </button>
  );
}
