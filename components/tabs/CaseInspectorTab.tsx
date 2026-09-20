"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Crosshair, Sparkles } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle, KeyVal, Pill } from "@/components/ui";
import { Waterfall } from "@/components/Waterfall";
import { fmtMoney } from "@/lib/format";

export function CaseInspectorTab({ f }: { f: CausalFixture }) {
  const [idx, setIdx] = useState(0);
  const c = f.cases[idx];
  const highestRiskIdx = useMemo(
    () => f.cases.reduce((best, cur, i) => (cur.actualDelayDays > f.cases[best].actualDelayDays ? i : best), 0),
    [f.cases],
  );

  const vsPop = c.actualDelayDays - c.populationAvg;
  const outperform = vsPop < 0;
  const steps = c.drivers.map((dr) => ({ label: dr.label, value: dr.contributionDays }));
  const predictedFromShap = c.populationAvg + c.drivers.reduce((s, dr) => s + dr.contributionDays, 0);
  const similar = c.similarCaseIds.map((sid) => f.cases.findIndex((x) => x.id === sid)).filter((i) => i >= 0);

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-ink-soft">
          Case {idx + 1} of {f.cases.length}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} className="rounded-lg border border-line p-1.5 hover:bg-paper-2">
            <ChevronLeft size={14} />
          </button>
          <select value={c.id} onChange={(e) => setIdx(f.cases.findIndex((x) => x.id === e.target.value))} className="rounded-lg border border-line bg-paper-2 px-3 py-1.5 text-sm">
            {f.cases.map((x) => (
              <option key={x.id} value={x.id}>{x.id} — {x.primaryEntity}</option>
            ))}
          </select>
          <button onClick={() => setIdx((i) => Math.min(f.cases.length - 1, i + 1))} className="rounded-lg border border-line p-1.5 hover:bg-paper-2">
            <ChevronRight size={14} />
          </button>
        </div>
        <button onClick={() => setIdx(highestRiskIdx)} className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-2.5 py-1.5 text-[12px] font-medium text-white">
          <Crosshair size={13} /> Jump to highest-risk case
        </button>
      </Card>

      {/* executive interpretation */}
      <Card className="border-forest/25 bg-sage/30">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles size={15} className="text-forest" /> Executive interpretation
        </div>
        <p className="text-sm text-ink-soft">
          Case {c.id} recorded an outcome of <b>{c.actualDelayDays} {f.scenario.outcomeUnit}</b>,{" "}
          {outperform ? "outperforming" : "trailing"} the population average by{" "}
          <b>{Math.abs(vsPop).toFixed(2)} {f.scenario.outcomeUnit}</b>. {c.dominantDriver} was the dominant contributor.
          Interventions targeting controllable factors could shift the outcome by approximately{" "}
          <b className={outperform ? "text-forest" : "text-amber"}>{Math.abs(c.controllableDays).toFixed(2)} {f.scenario.outcomeUnit}</b>.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric value={`${c.actualDelayDays}`} label={`Actual outcome (${f.scenario.outcomeUnit})`} tone={outperform ? "good" : "warn"} />
        <Metric value={`${c.complexityScore} / 10`} label="Complexity profile" />
        <Metric value={c.treated ? "Yes" : "No"} label="Treatment strategy applied" />
        <Metric value={`${c.percentile}%`} label="Population percentile" />
      </div>

      <Card>
        <SectionTitle hint="SHAP decomposition — how each factor pushed this case away from the population average">
          Why did this outcome occur?
        </SectionTitle>
        <Waterfall
          start={{ label: "Population avg", value: c.populationAvg }}
          steps={steps}
          end={{ label: "Case prediction", value: predictedFromShap }}
          unit={f.scenario.outcomeUnit}
          height={230}
        />
        <p className="mt-2 text-[12px] text-muted">
          Bars build up the model&apos;s predicted outcome ({predictedFromShap.toFixed(2)}); the actual recorded outcome was{" "}
          {c.actualDelayDays} {f.scenario.outcomeUnit} — the gap is the model&apos;s residual error for this case.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-forest/25">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-forest-deep">Intervention opportunities</div>
          <div className="mt-1 font-display text-2xl text-forest">{c.controllableDays > 0 ? "+" : ""}{c.controllableDays.toFixed(2)} {f.scenario.outcomeUnit}</div>
          <p className="mt-1 text-sm text-ink-soft">
            Controllable factors — operational actions targeting these could substantially influence future outcomes. The
            underlying causal effect is robust (E-value {f.sensitivity.eValue}, CI [{f.naiveEffect.ciLow}, {f.naiveEffect.ciHigh}]).
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-muted">
            {c.drivers.filter((d) => d.kind === "controllable").map((d) => (
              <li key={d.label}>{d.label}: {d.contributionDays > 0 ? "+" : ""}{d.contributionDays.toFixed(2)} {f.scenario.outcomeUnit}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">System constraints</div>
          <div className="mt-1 font-display text-2xl text-ink">{c.structuralDays > 0 ? "+" : ""}{c.structuralDays.toFixed(2)} {f.scenario.outcomeUnit}</div>
          <p className="mt-1 text-sm text-ink-soft">
            Structural contribution — these drivers arise from underlying process characteristics. Altering them requires
            longer-term system-level transformation.
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-muted">
            {c.drivers.filter((d) => d.kind === "structural").map((d) => (
              <li key={d.label}>{d.label}: {d.contributionDays > 0 ? "+" : ""}{d.contributionDays.toFixed(2)} {f.scenario.outcomeUnit}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle>Case summary</SectionTitle>
          <KeyVal k="Case ID" v={c.id} />
          <KeyVal k="Primary entity" v={c.primaryEntity} />
          <KeyVal k="Category" v={c.category} />
          <KeyVal k="Value" v={fmtMoney(c.value)} />
          <KeyVal k="Predicted" v={`${c.predictedDelayDays} ${f.scenario.outcomeUnit}`} />
        </Card>
        <Card className="border-forest/30 bg-sage/40 lg:col-span-2">
          <SectionTitle>What-if (counterfactual)</SectionTitle>
          <p className="text-sm text-ink-soft">{c.counterfactualLabel}</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="text-center">
              <div className="font-display text-2xl text-ink">{c.actualDelayDays}</div>
              <div className="text-[10px] text-muted">actual</div>
            </div>
            <ChevronRight size={18} className="text-forest" />
            <div className="text-center">
              <div className="font-display text-2xl text-forest">{c.counterfactualDelayDays}</div>
              <div className="text-[10px] text-muted">counterfactual</div>
            </div>
            <div className="rounded-lg bg-card px-3 py-2 text-sm">
              reduction{" "}
              <b className="text-forest">
                {(c.actualDelayDays - c.counterfactualDelayDays).toFixed(2)} {f.scenario.outcomeUnit} (
                {Math.round(((c.actualDelayDays - c.counterfactualDelayDays) / c.actualDelayDays) * 100)}%)
              </b>
            </div>
          </div>
        </Card>
      </div>

      <Card pad={false}>
        <div className="p-5 pb-2"><SectionTitle hint="nearest cases by delay profile">Similar cases</SectionTitle></div>
        <div className="scroll-slim overflow-x-auto px-5 pb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                {["Case", "Entity", "Category", "Actual", "Predicted", "Counterfactual"].map((h) => (
                  <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {similar.map((si) => {
                const s = f.cases[si];
                return (
                  <tr key={s.id} className="border-t border-line-soft text-ink-soft">
                    <td className="py-2 pr-4"><button className="text-forest hover:underline" onClick={() => setIdx(si)}>{s.id}</button></td>
                    <td className="py-2 pr-4">{s.primaryEntity}</td>
                    <td className="py-2 pr-4">{s.category}</td>
                    <td className="py-2 pr-4">{s.actualDelayDays}</td>
                    <td className="py-2 pr-4">{s.predictedDelayDays}</td>
                    <td className="py-2 pr-4">{s.counterfactualDelayDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <details className="card p-0">
        <summary className="cursor-pointer p-5 text-sm font-semibold text-ink">Methodological foundation</summary>
        <div className="space-y-2 border-t border-line-soft px-5 py-4 text-sm text-ink-soft">
          <p>
            This attribution is <b>SCM-grounded SHAP</b>, not formal Causal SHAP: Shapley values are computed over the
            fitted structural equations, so each bar is a feature&apos;s marginal contribution to the predicted outcome
            given the discovered DAG — features are split into <b>controllable</b> (operational levers) and{" "}
            <b>structural</b> (process characteristics).
          </p>
          <p>
            Every case&apos;s attribution rests on the same Double ML effect ({f.naiveEffect.causalDays} {f.scenario.outcomeUnit},
            95% CI [{f.naiveEffect.ciLow}, {f.naiveEffect.ciHigh}]). Sensitivity: placebo effect{" "}
            {f.sensitivity.placeboEffect} {f.scenario.outcomeUnit} (expected ≈ 0), E-value {f.sensitivity.eValue}. {f.sensitivity.verdict}
          </p>
        </div>
      </details>
    </div>
  );
}

function Metric({ value, label, tone }: { value: string; label: string; tone?: "good" | "warn" }) {
  return (
    <div className="card p-4">
      <div className="font-display text-2xl text-ink">{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
      {tone && (
        <div className="mt-1">
          <Pill tone={tone === "good" ? "forest" : "amber"}>{tone === "good" ? "Better than baseline" : "Above baseline"}</Pill>
        </div>
      )}
    </div>
  );
}
