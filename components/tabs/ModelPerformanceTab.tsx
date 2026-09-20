"use client";
import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Sparkles, RotateCcw, Zap, Gauge, Check, ShieldCheck } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, Stat, SectionTitle, Bar, KeyVal, Pill } from "@/components/ui";
import { EffectAccuracyChart, CoefficientChart, CateChart, SensitivitySweepChart } from "@/components/Charts";
import { Waterfall } from "@/components/Waterfall";
import { CausalGraph, GraphLegend } from "@/components/CausalGraph";
import { simulate, recommendPlan, defaultLeverValues, maxImpactValues, type LeverValues } from "@/lib/simulator";
import { CountUp, LiveNumber } from "@/components/motion";
import { fmtMoney } from "@/lib/format";

export function ModelPerformanceTab({ f }: { f: CausalFixture }) {
  const m = f.discoveryMetrics;
  const ne = f.naiveEffect;
  const unit = f.scenario.outcomeUnit;
  const maxDriver = Math.max(...f.topDrivers.map((d) => d.impactDays));

  const [values, setValues] = useState<LeverValues>(() => defaultLeverValues(f));
  const [target, setTarget] = useState(20);
  const sim = useMemo(() => simulate(f, values), [f, values]);
  const plan = useMemo(() => recommendPlan(f, target), [f, target]);
  const groups = useMemo(() => [...new Set(f.simulator.levers.map((l) => l.group))], [f]);

  const presets = useMemo(
    () => [
      { key: "none", label: "Do nothing", values: defaultLeverValues(f) },
      { key: "single", label: "Best single move", values: recommendPlan(f, 20).values },
      { key: "push", label: "Push to −50%", values: recommendPlan(f, 50).values },
      { key: "max", label: "Max impact", values: maxImpactValues(f) },
    ],
    [f],
  );
  const sameValues = (a: LeverValues, b: LeverValues) =>
    f.simulator.levers.every((l) => (a[l.id] ?? l.baseline) === (b[l.id] ?? l.baseline));
  const activePreset = presets.find((p) => sameValues(p.values, values))?.key ?? null;

  // one-sentence summary of the current scenario
  const activeLevers = f.simulator.levers.filter((l) => (values[l.id] ?? l.baseline) !== l.baseline);
  const leverPhrase =
    activeLevers.length <= 3
      ? listAnd(activeLevers.map((l) => l.label))
      : `${activeLevers.slice(0, 2).map((l) => l.label).join(", ")}, and ${activeLevers.length - 2} more levers`;
  const payback =
    sim.roiMonths === 0
      ? ", payback immediate."
      : sim.roiMonths
        ? sim.roiMonths < 1
          ? ", payback under a month."
          : `, payback ~${Math.round(sim.roiMonths)} mo.`
        : ".";
  const headline =
    activeLevers.length === 0
      ? "All levers at baseline — pick a preset or drag a lever to model an intervention."
      : `With ${leverPhrase}, ${f.scenario.outcomeVariable.toLowerCase()} ` +
        `drops from ${f.simulator.baselineOutcome} to ${sim.predicted} ${unit} — ` +
        (sim.annualSavings > 0 ? `~${fmtMoney(sim.annualSavings)}/yr` : "no modeled savings") +
        payback;

  const [applied, setApplied] = useState(false);
  const set = (id: string, val: number) => setValues((s) => ({ ...s, [id]: val }));
  const reset = () => {
    setValues(defaultLeverValues(f));
    setApplied(false);
  };
  const applyPlan = () => {
    setValues(plan.values);
    setApplied(true);
    document.getElementById("tour-sim")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => setApplied(false), 2600);
  };

  // active-edge set for the live graph, from lever deltas
  const activeEdges = useMemo(() => {
    const s = new Set<string>();
    const changed = (id: string) => (values[id] ?? 0) !== (f.simulator.levers.find((l) => l.id === id)?.baseline ?? 0);
    if (f.domain === "manufacturing") {
      if (changed("supplier_reliability_pct") || changed("material_lead_time_mode")) {
        s.add("supplier_a->material_lead_time");
        s.add("material_lead_time->shipment_delay");
      }
      if (changed("machine_capacity_expanded") || changed("additional_workforce")) s.add("machine_queue_length->approval_duration");
      if (changed("export_flag_reduction")) s.add("export_flag->approval_duration");
      if (changed("approval_automation") || changed("export_flag_reduction")) s.add("approval_duration->shipment_delay");
      if (changed("carrier_express_pct")) s.add("carrier_express->shipment_delay");
    } else {
      if (changed("specialist_allocation_pct") || changed("diagnostic_speed_mode")) {
        s.add("specialist_required->treatment_duration");
        s.add("treatment_duration->length_of_stay");
      }
      if (changed("bed_capacity_expanded")) s.add("bed_occupancy_rate->approval_wait");
      if (changed("triage_automation")) s.add("approval_wait->length_of_stay");
    }
    return s;
  }, [values, f]);

  return (
    <div className="space-y-5">
      <Card className="border-forest/25 bg-sage/30">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles size={15} className="text-forest" /> AI Causal Interpretation
          <Pill tone="forest">HIGH CONFIDENCE</Pill>
        </div>
        <p className="text-sm text-ink-soft">
          Confounding adjustment recovered a causal effect of <b className="text-forest">{ne.causalDays} {unit}</b> for{" "}
          {f.scenario.treatmentLabel} — the naive, uncorrected estimate ran {ne.inflationPct}% higher. Naive correlation
          suggested {ne.naiveDays} {unit}; Double ML (cross-fitted GBM, sandwich SEs) gives {ne.causalDays} {unit} (95% CI
          [{ne.ciLow}, {ne.ciHigh}]), matching the planted ground truth of {f.effects[0].groundTruthDays} to{" "}
          {f.pipelinePerf.effectErrorPct}%. Confounding accounts for {ne.biasDays} {unit} ({ne.biasPct}% of the naive
          figure).
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat value={m.precision.toFixed(2)} label="Precision" sub="pre-domain-knowledge" accent />
        <Stat value={m.recall.toFixed(2)} label="Edge Recall" sub="pre-domain-knowledge" />
        <Stat value={m.f1.toFixed(2)} label="Recovery F1" sub="DAG recovery" accent />
        <Stat value={`${Math.round(m.stability * 100)}%`} label="Bootstrap Stability" sub={`${m.bootstrapRuns} reruns`} />
      </div>

      <Card id="tour-effect" className="scroll-mt-24">
        <SectionTitle hint="Double ML backdoor adjustment">Naive correlation vs. recovered causal effect</SectionTitle>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="font-display text-3xl text-amber"><CountUp value={ne.naiveDays} decimals={2} /></div>
            <div className="text-[11px] text-muted">naive correlation ({unit})</div>
          </div>
          <div className="pb-2 text-sm text-muted">− {ne.biasDays} {unit} ({ne.biasPct}%) confounding bias →</div>
          <div>
            <div className="font-display text-3xl text-forest"><CountUp value={ne.causalDays} decimals={2} /></div>
            <div className="text-[11px] text-muted">Double ML causal effect · 95% CI [{ne.ciLow}, {ne.ciHigh}] · planted {f.effects[0].groundTruthDays}</div>
          </div>
        </div>
      </Card>

      {/* ── What-If Simulator ── */}
      <Card id="tour-sim" pad={false} className="border-forest/25 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Zap size={15} className="text-forest" /> What-If Causal Simulator
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span>Baseline {f.simulator.baselineOutcome} {unit}</span>
            <span className="inline-flex items-center gap-1 text-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-forest" /> Live engine active
            </span>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-ink-soft hover:bg-paper-2">
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>

        {/* plain-language summary of the current scenario */}
        <div className="border-b border-line bg-sage/25 px-5 py-3 text-[13px] leading-snug text-ink-soft">
          {headline}
        </div>

        {/* one-click scenarios */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Scenarios</span>
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setValues(p.values);
                setApplied(false);
              }}
              className={clsx(
                "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                activePreset === p.key
                  ? "border-forest/50 bg-forest text-white"
                  : "border-line bg-card text-ink-soft hover:border-forest/40 hover:text-forest",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.15fr]">
          {/* levers */}
          <div className="space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Intervention Levers</div>
            {groups.map((grp) => (
              <div key={grp}>
                <div className="mb-1.5 text-[12px] font-medium text-ink">{grp}</div>
                <div className="space-y-3 rounded-lg border border-line-soft bg-paper-2/40 p-3">
                  {f.simulator.levers.filter((l) => l.group === grp).map((l) => {
                    const v = values[l.id] ?? l.baseline;
                    const on = v !== l.baseline;
                    return (
                      <div key={l.id}>
                        <div className="flex items-center justify-between gap-2 text-[12px]">
                          <span className={clsx(on ? "font-medium text-ink" : "text-ink-soft")}>{l.label}</span>
                          {l.kind === "toggle" ? (
                            <button
                              onClick={() => set(l.id, v >= 1 ? 0 : 1)}
                              className={clsx("relative h-5 w-9 rounded-full transition-colors", v >= 1 ? "bg-forest" : "bg-line")}
                            >
                              <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", v >= 1 ? "left-4" : "left-0.5")} />
                            </button>
                          ) : l.kind === "mode" ? (
                            <span className="tabular-nums text-muted">{l.modes?.[Math.round(v)]}</span>
                          ) : (
                            <span className="tabular-nums text-muted">{v}{l.unit}</span>
                          )}
                        </div>
                        {l.kind !== "toggle" && (
                          <input
                            type="range"
                            min={l.min}
                            max={l.max}
                            step={l.step}
                            value={v}
                            onChange={(e) => set(l.id, Number(e.target.value))}
                            className="mt-1 w-full accent-[#3d5a3d]"
                          />
                        )}
                        <div className="text-[10px] text-muted">{l.hint}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-line bg-card px-3 py-2 text-[11px] text-muted">
              {sim.activeCount === 0
                ? "All levers at baseline — adjust above to simulate."
                : `${sim.activeCount} active intervention${sim.activeCount > 1 ? "s" : ""}.`}
            </div>
          </div>

          {/* predicted outcomes */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Predicted Outcomes</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-forest/30 bg-sage/40 p-4">
                <div className="text-[11px] text-muted">Predicted {f.scenario.outcomeVariable.toLowerCase()}</div>
                <div className="font-display text-4xl text-forest">
                  <LiveNumber value={sim.predicted} decimals={1} /> <span className="text-base text-muted">{unit}</span>
                </div>
                <div className={clsx("text-[12px] font-medium", sim.improvementPct > 0 ? "text-forest" : "text-muted")}>
                  −{sim.improvementPct.toFixed(1)}% vs baseline · 95% CI [{sim.ciLow} – {sim.ciHigh}]
                </div>
              </div>
              <div
                className={clsx(
                  "rounded-lg px-2 py-3 text-center text-[10px] font-bold text-white",
                  sim.improvementPct > 25 ? "bg-forest" : sim.improvementPct > 10 ? "bg-amber" : sim.improvementPct > 0 ? "bg-[#c2703a]" : "bg-muted",
                )}
              >
                {sim.improvementPct > 25 ? "HIGH IMPACT" : sim.improvementPct > 10 ? "MODERATE" : sim.improvementPct > 0 ? "LOW" : "NO CHANGE"}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MiniOut label="Throughput" value={`${sim.throughput}/day`} delta={`${sim.throughput - 100 >= 0 ? "+" : ""}${sim.throughput - 100}`} />
              <MiniOut label="Risk index" value={`${sim.riskIndex}`} delta={`${sim.riskIndex - 45 >= 0 ? "+" : ""}${(sim.riskIndex - 45).toFixed(1)}`} />
              <MiniOut label="ROI payback" value={sim.roiMonths === null ? "—" : sim.roiMonths === 0 ? "Immediate" : `${sim.roiMonths} mo`} delta="" />
            </div>
            <div className="rounded-lg border border-line bg-card p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Annual savings</span><b className="text-forest">{sim.annualSavings > 0 ? `~${fmtMoney(sim.annualSavings)}` : "—"}</b></div>
              <div className="flex justify-between"><span className="text-muted">Implementation cost</span><b className="text-ink">{sim.implCost > 0 ? fmtMoney(sim.implCost) : "$0"}</b></div>
              <div className="mt-1 text-[10px] text-muted">${f.simulator.costPerDelayDay.toLocaleString()}/day/case · {f.simulator.annualVolume.toLocaleString()} cases/yr</div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Causal Effect Decomposition</div>
              <div className="rounded-lg border border-line bg-card p-3">
                <Waterfall
                  start={{ label: "Baseline", value: sim.baseline }}
                  steps={sim.deltas.length ? sim.deltas : [{ label: "no levers set", value: 0 }]}
                  end={{ label: "Predicted", value: sim.predicted }}
                  unit={unit}
                  height={180}
                />
              </div>
            </div>
          </div>
        </div>

        {/* mediator states */}
        <div className="border-t border-line px-5 py-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Mediator Variable States</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                {["Variable", "Baseline", "Predicted", "Change"].map((h) => (
                  <th key={h} className="pb-1.5 pr-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sim.mediators.map((s) => {
                const d = Math.round((s.predicted - s.baseline) * 100) / 100;
                return (
                  <tr key={s.name} className="border-t border-line-soft text-ink-soft">
                    <td className="py-1.5 pr-4">{s.name}</td>
                    <td className="py-1.5 pr-4">{s.baseline} {s.unit}</td>
                    <td className="py-1.5 pr-4">{s.predicted} {s.unit}</td>
                    <td className={clsx("py-1.5 pr-4 font-medium", d < 0 ? "text-forest" : d > 0 ? "text-amber" : "text-muted")}>
                      {d > 0 ? "+" : ""}{d} {s.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* live causal graph propagation */}
        <div className="border-t border-line px-5 py-4">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Live Causal Graph — Intervention Propagation
          </div>
          <p className="mb-2 text-[11px] text-muted">
            Highlighted edges are the causal paths your current lever settings are pulling on.
          </p>
          <CausalGraph graph={f.causalGraph} height={280} activeEdges={activeEdges} />
          <GraphLegend />
        </div>
      </Card>

      {/* Recommended action plan */}
      <Card className="border-forest/25">
        <SectionTitle hint="cheapest lever combination that reaches your target — searched over the same causal engine">
          Recommended Action Plan
        </SectionTitle>
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px]">
          <span className="text-muted">Target {f.scenario.outcomeVariable.toLowerCase()} reduction</span>
          <input type="range" min={5} max={50} step={5} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-40 accent-[#3d5a3d]" />
          <span className="font-semibold text-ink">{target}%</span>
          <Pill tone={plan.reachable ? "forest" : "amber"}>{plan.reachable ? "Target reachable" : "Best effort"}</Pill>
        </div>
        <p className="text-sm text-ink-soft">
          Predicted {f.scenario.outcomeVariable.toLowerCase()}:{" "}
          <b className="text-forest">{plan.predicted} {unit}</b> (−{plan.reductionPct}% vs {f.simulator.baselineOutcome} {unit} baseline)
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <KeyVal k="Impl. cost" v={plan.implCost > 0 ? fmtMoney(plan.implCost) : "$0 (process change)"} />
          <KeyVal k="Annual savings" v={plan.annualSavings > 0 ? `~${fmtMoney(plan.annualSavings)}` : "—"} />
          <KeyVal k="Payback" v={plan.paybackMonths == null ? "—" : plan.paybackMonths === 0 ? "Immediate" : `${plan.paybackMonths} mo`} />
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {plan.levers.length === 0 && <li className="text-muted">Baseline already meets the target.</li>}
          {plan.levers.map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-ink-soft">
              <Check size={13} className="text-forest" /> {l.label}: <span className="text-muted">{l.setting}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={applyPlan}
          disabled={plan.levers.length === 0}
          className={clsx(
            "mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors",
            applied ? "bg-forest-deep" : "bg-forest hover:bg-forest-deep",
            plan.levers.length === 0 && "opacity-40",
          )}
        >
          {applied ? <Check size={14} /> : <Gauge size={14} />}
          {applied ? "Applied — simulator updated above" : "Apply this plan to the simulator"}
        </button>
      </Card>

      {/* coefficients + CATE */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="Double ML estimate vs. planted coefficient">Recovery Visualization</SectionTitle>
          <CoefficientChart data={f.coefficients} />
        </Card>
        <Card>
          <SectionTitle hint={`by ${f.cate.segmentVar} · 95% CI`}>Treatment-Effect Heterogeneity (CATE)</SectionTitle>
          <CateChart segments={f.cate.segments} ate={f.cate.ate} />
          <p className="mt-2 text-[12px] text-muted">{f.cate.note}</p>
        </Card>
      </div>

      {/* Sensitivity */}
      <Card id="tour-sensitivity" className="scroll-mt-24">
        <SectionTitle hint="how much would an unmeasured confounder have to matter before this flips?">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-forest" /> Sensitivity to Unmeasured Confounding</span>
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <SensTile
            title="Placebo Test"
            verdict={f.sensitivity.placeboPass ? "Pass" : "Fail"}
            ok={f.sensitivity.placeboPass}
            detail={`Effect under permuted treatment: ${f.sensitivity.placeboEffect > 0 ? "+" : ""}${f.sensitivity.placeboEffect} ${unit} (expect ~0)`}
          />
          <SensTile
            title="Random Common Cause"
            verdict={f.sensitivity.randomCauseStable ? "Stable" : "Unstable"}
            ok={f.sensitivity.randomCauseStable}
            detail={`Re-estimate with a noise variable added: ${f.sensitivity.randomCauseEstimate} ${unit}`}
          />
          <SensTile
            title="E-value"
            verdict={`${f.sensitivity.eValue}`}
            ok={f.sensitivity.eValue >= 2}
            detail="Confounder strength (risk-ratio scale) needed to nullify the result"
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Causal estimate vs. assumed unmeasured-confounder strength
            </div>
            <SensitivitySweepChart
              strengths={f.sensitivity.strengths}
              estimates={f.sensitivity.estimatesUnderConfounding}
              reported={f.sensitivity.reportedEstimate}
            />
          </div>
          <div className="rounded-lg border border-line bg-paper-2/40 p-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {f.sensitivity.seedRobustness.nSeeds}-seed robustness
            </div>
            <p className="text-[12px] text-ink-soft">
              Regenerate the dataset {f.sensitivity.seedRobustness.nSeeds}× from the same causal structure and re-run the
              full pipeline on each:
            </p>
            <div className="mt-2 space-y-1 text-[12px]">
              <div className="flex justify-between"><span className="text-muted">Causal estimate</span><b className="text-forest">{f.sensitivity.seedRobustness.causalMean} ± {f.sensitivity.seedRobustness.causalStd}</b></div>
              <div className="flex justify-between"><span className="text-muted">Range</span><span className="text-ink">[{f.sensitivity.seedRobustness.causalLo}, {f.sensitivity.seedRobustness.causalHi}]</span></div>
              <div className="flex justify-between"><span className="text-muted">Naive range</span><span className="text-muted">[{f.sensitivity.seedRobustness.naiveLo}, {f.sensitivity.seedRobustness.naiveHi}]</span></div>
              <div className="flex justify-between border-t border-line-soft pt-1"><span className="text-muted">Planted truth</span><b className="text-ink">{f.effects[0].groundTruthDays}</b></div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-muted">{f.sensitivity.verdict}</p>
      </Card>

      {/* accuracy + top drivers */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="absolute error vs planted truth (days)">Causal Effect Accuracy</SectionTitle>
          <EffectAccuracyChart data={f.effectAccuracy} />
        </Card>
        <Card>
          <SectionTitle hint="recovered effect, days">Top Drivers by Causal Impact</SectionTitle>
          <div className="space-y-3">
            {f.topDrivers.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="text-ink-soft">{d.label}</span>
                  <span className="font-semibold text-forest">{d.impactDays.toFixed(2)}d</span>
                </div>
                <Bar value={d.impactDays} max={maxDriver} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* domain-agnostic banner */}
      <Card className="border-forest/25 bg-sage/30 text-center">
        <div className="font-display text-lg text-ink">Domain-Agnostic Causal Intelligence</div>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-ink-soft">
          The same pipeline recovered the confounding structure and true causal effects across Manufacturing and
          Healthcare with no domain-specific modification — controlled benchmark, pre-domain-knowledge discovery.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[12px]">
          {["Generalises across industries", "Preserves causal validity", "Requires no custom redesign"].map((x) => (
            <span key={x} className="rounded-full bg-card px-3 py-1 text-forest-deep">✓ {x}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function listAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function MiniOut({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-display text-base text-ink">{value}</div>
      {delta && <div className="text-[10px] text-muted">{delta}</div>}
    </div>
  );
}

function SensTile({ title, verdict, ok, detail }: { title: string; verdict: string; ok: boolean; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper-2/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</span>
        <Pill tone={ok ? "forest" : "amber"}>{verdict}</Pill>
      </div>
      <p className="mt-1.5 text-[12px] text-ink-soft">{detail}</p>
    </div>
  );
}
