"use client";
import { clsx } from "clsx";
import { Sparkles, TrendingDown, ShieldCheck, ArrowRight, Check, X, AlertTriangle } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, Pill, SectionTitle, KeyVal } from "@/components/ui";
import { CountUp, FadeIn, Stagger, StaggerItem, motion } from "@/components/motion";
import { ValidationExplainer } from "@/components/ValidationExplainer";
import { AlertIllustration } from "@/components/Illustrations";
import { fmtMoney } from "@/lib/format";

export function OverviewTab({ f }: { f: CausalFixture }) {
  const es = f.executiveSummary;
  const topAction = f.recommendedActions[0];
  const m = f.discoveryMetrics;
  const t = f.effects[0];
  const maxImpact = Math.max(...f.topDrivers.map((d) => d.impactDays));

  return (
    <div className="space-y-5">
      {/* Causal Intelligence Alert */}
      <motion.div
        id="tour-alert"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[16px] border border-forest/30 bg-forest-deep text-white"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-2">
          <AlertTriangle size={13} /> Causal Intelligence Alert
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.9fr] lg:items-center">
          <div>
            <div className="font-display text-[26px] leading-tight">
              {es.alertOutcome} can be reduced by{" "}
              <span className="text-sage-2">
                <CountUp value={es.alertReductionPct} decimals={1} suffix="%" />
              </span>
            </div>
            <p className="mt-1 text-sm text-white/70">
              Root cause identified · business impact quantified · intervention validated through causal simulation.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
              {es.chain.map((c, i) => (
                <span key={c} className="flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-1">{c}</span>
                  {i < es.chain.length - 1 && <ArrowRight size={13} className="text-white/40" />}
                </span>
              ))}
              <ArrowRight size={13} className="text-white/40" />
              <span className="rounded-md bg-sage-2 px-2 py-1 font-semibold text-forest-deep">
                {es.alertReductionPct}% reduction
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
              <MiniDark label="Expected annual savings" value={`~${fmtMoney(topAction.annualSavings)}`} sub={`payback ${f.report.roiPayback}`} />
              <MiniDark label="Recovered causal effect" value={`${t.effectDays} ${f.scenario.outcomeUnit}`} sub={`planted ${t.groundTruthDays} · naive ${t.naiveDays}`} />
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <AlertIllustration domain={f.domain} />
          </div>
        </div>
      </motion.div>

      <FadeIn delay={0.05}>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Sparkles size={15} className="text-forest" /> AI Executive Summary
            </div>
            <Pill tone="forest">
              <ShieldCheck size={12} /> {es.confidence}
            </Pill>
          </div>
          <p className="font-display text-lg leading-snug text-ink">{es.headline}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            {es.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-forest" />
                {b}
              </li>
            ))}
          </ul>
        </Card>
      </FadeIn>

      <div id="tour-explainer" className="scroll-mt-24">
        <ValidationExplainer f={f} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2" delay={0.05}>
          <Card>
            <SectionTitle hint={f.scenario.timeRange}>Scenario at a glance</SectionTitle>
            <p className="text-sm leading-relaxed text-ink-soft">{f.scenario.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-x-6">
              <KeyVal k="Time range" v={f.scenario.timeRange} />
              <KeyVal k="Total events" v={f.scenario.totalEvents.toLocaleString()} />
              <KeyVal k="Treated arm" v={`${f.scenario.treatedPct}% (${f.scenario.treatedCases.toLocaleString()} cases)`} />
              <KeyVal k="Highest-risk segment" v={es.riskSegment} />
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <SectionTitle hint={<TrendingDown size={13} />}>Top drivers (by causal impact)</SectionTitle>
            <div className="space-y-2.5">
              {f.topDrivers.slice(0, 5).map((d, i) => (
                <div key={d.label}>
                  <div className="mb-1 flex justify-between text-[11px] text-muted">
                    <span>{d.label}</span>
                    <span>{d.impactDays.toFixed(2)}d</span>
                  </div>
                  <AnimatedBar value={d.impactDays} max={maxImpact} delay={i * 0.08} />
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Traditional PM vs CausalOCPM */}
      <Stagger className="grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <Card className="h-full bg-paper-2/50">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Traditional process mining</div>
            <div className="mt-1 font-display text-2xl text-ink">1 object type</div>
            <p className="mt-1 text-sm text-ink-soft">
              Case ID only — object relationships are invisible, so it reports correlations and cannot tell causation from
              coincidence.
            </p>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="h-full border-forest/30 bg-sage/40">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-forest-deep">CausalOCPM (this system)</div>
            <div className="mt-1 font-display text-2xl text-forest">{f.scenario.objectTypes} object types</div>
            <p className="mt-1 text-sm text-ink-soft">
              {f.scenario.objectNames.join(" · ")} — tracked simultaneously as OCEL 2.0, the structural foundation causal
              discovery builds on.
            </p>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* Pipeline Performance Summary */}
      <FadeIn>
        <Card>
          <SectionTitle hint="actual outputs of the reference pipeline's validate.py on the 15,000-row synthetic log">
            Pipeline Performance Summary
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <PerfTile v={f.pipelinePerf.effectErrorPct} decimals={1} suffix="%" l="Effect recovery error" hint={`DML ${f.effects[0].effectDays} vs planted ${f.effects[0].groundTruthDays}`} good />
            <PerfTile v={f.pipelinePerf.preF1} decimals={2} l="Discovery F1" hint="autonomous bootstrapped PC" />
            <PerfTile v={f.pipelinePerf.confoundingRemovedPct} decimals={1} suffix="%" l="Confounding removed" hint={`${f.naiveEffect.biasDays} ${f.scenario.outcomeUnit} of the naive estimate`} />
            <PerfTile v={f.pipelinePerf.bootstrapStability * 100} decimals={0} suffix="%" l="Bootstrap stability" hint="edges stable across 20 reruns" />
            <PerfTile v={f.pipelinePerf.eValue} decimals={1} l="E-value" hint="hidden-confounder robustness" good />
            <PerfTile v={f.pipelinePerf.avgModelR2} decimals={2} l="Outcome model R²" hint={`coefficients within ${f.pipelinePerf.avgCoefErrorPct}% of planted`} good />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            The headline is <b>effect recovery</b>: Double ML landed within <b>{f.pipelinePerf.effectErrorPct}%</b> of the
            planted causal effect ({f.effects[0].effectDays} vs {f.effects[0].groundTruthDays}), CI [{f.naiveEffect.ciLow},{" "}
            {f.naiveEffect.ciHigh}] containing the truth, where a naive estimate ran {f.naiveEffect.inflationPct}% high.
            Autonomous discovery scores <b>F1 {f.pipelinePerf.preF1.toFixed(2)}</b> ({m.truePositives}/
            {f.scenario.causalLinks} edges{m.falsePositives ? `, ${m.falsePositives} spurious` : ", no spurious edges"});
            domain knowledge recovers the {f.pipelinePerf.missingEdgesRecovered} missed edge
            {f.pipelinePerf.missingEdgesRecovered === 1 ? "" : "s"}. Structural coefficients are recovered within{" "}
            <b>{f.pipelinePerf.avgCoefErrorPct}%</b> of their planted values, all sign-correct.
          </p>
        </Card>
      </FadeIn>

      {/* Competitive positioning */}
      <FadeIn>
        <Card pad={false}>
          <div className="p-5 pb-2">
            <SectionTitle hint="how CausalOCPM compares to existing process analytics">Competitive positioning</SectionTitle>
          </div>
          <div className="scroll-slim overflow-x-auto px-5 pb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-4 font-semibold">Capability</th>
                  <th className="pb-2 pr-4 font-semibold">Traditional PM</th>
                  <th className="pb-2 pr-4 font-semibold">Celonis</th>
                  <th className="pb-2 pr-4 font-semibold text-forest">CausalOCPM</th>
                </tr>
              </thead>
              <tbody>
                {POSITIONING.map((r) => (
                  <tr key={r.cap} className="border-t border-line-soft">
                    <td className="py-2 pr-4 text-ink-soft">{r.cap}</td>
                    <td className="py-2 pr-4"><Mark v={r.tpm} /></td>
                    <td className="py-2 pr-4"><Mark v={r.celonis} /></td>
                    <td className="py-2 pr-4"><Mark v={r.ocpm} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}

const POSITIONING = [
  { cap: "Object-centric events", tpm: ["no", "Case ID only"], celonis: ["partial", "Partial"], ocpm: ["yes", "Full OCEL 2.0"] },
  { cap: "Causal discovery", tpm: ["no", "None"], celonis: ["no", "None"], ocpm: ["yes", "Bootstrap PC"] },
  { cap: "Confounding adjustment", tpm: ["no", "None"], celonis: ["no", "None"], ocpm: ["yes", "Double ML"] },
  { cap: "Counterfactual simulation", tpm: ["no", "None"], celonis: ["partial", "Rule-based"], ocpm: ["yes", "SCM-based"] },
  { cap: "Ground-truth validation", tpm: ["no", "No"], celonis: ["no", "No"], ocpm: ["yes", "Planted GT"] },
  { cap: "Uncertainty quantification", tpm: ["no", "None"], celonis: ["partial", "CI ranges"], ocpm: ["yes", "Bootstrap CIs + E-value"] },
] as const;

function Mark({ v }: { v: readonly [string, string] }) {
  const [state, text] = v;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      {state === "yes" ? (
        <Check size={13} className="text-forest" />
      ) : state === "partial" ? (
        <AlertTriangle size={12} className="text-amber" />
      ) : (
        <X size={13} className="text-muted" />
      )}
      <span className={state === "yes" ? "text-ink" : "text-muted"}>{text}</span>
    </span>
  );
}

function MiniDark({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-0.5 font-display text-lg text-white">{value}</div>
      <div className="text-[10px] text-white/45">{sub}</div>
    </div>
  );
}

function PerfTile({
  v,
  decimals,
  suffix = "",
  l,
  hint,
  good = false,
}: {
  v: number;
  decimals: number;
  suffix?: string;
  l: string;
  hint: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper-2/40 p-2.5">
      <div className={clsx("font-display text-lg leading-none", good ? "text-forest" : "text-ink")}>
        <CountUp value={v} decimals={decimals} suffix={suffix} duration={0.8} />
      </div>
      <div className="mt-1 text-[10px] font-medium leading-tight text-ink-soft">{l}</div>
      <div className="text-[9px] leading-tight text-muted">{hint}</div>
    </div>
  );
}

function AnimatedBar({ value, max, delay }: { value: number; max: number; delay: number }) {
  const pct = Math.max(3, Math.min(100, (Math.abs(value) / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line-soft">
      <motion.div
        className="h-full rounded-full bg-forest"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
