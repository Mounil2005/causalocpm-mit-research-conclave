"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { FileText, Printer } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle, Pill } from "@/components/ui";
import { ImpactTrendChart } from "@/components/Charts";
import { fmtMoney } from "@/lib/format";

const SUB = ["Recommendations", "Executive Report", "Action Log"] as const;

export function DecisionIntelligenceTab({ f }: { f: CausalFixture }) {
  const [sub, setSub] = useState<(typeof SUB)[number]>("Recommendations");
  const pi = f.projectedImpact;
  const r = f.report;

  return (
    <div className="space-y-5">
      <div className="no-print flex gap-1 border-b border-line">
        {SUB.map((s) => (
          <button key={s} onClick={() => setSub(s)} className={clsx("px-3 py-2 text-sm", sub === s ? "tab-underline font-semibold text-ink" : "text-muted hover:text-ink")}>
            {s}
          </button>
        ))}
      </div>

      {sub === "Recommendations" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {f.recommendedActions.map((a, i) => (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-muted">
                      #{i + 1} · {a.lever} · <span className={a.evidence === "MEASURED" ? "text-forest" : "text-amber"}>{a.evidence}</span>
                    </div>
                    <div className="mt-0.5 font-display text-lg text-ink">{a.title}</div>
                  </div>
                  <Pill tone="forest">{a.confidence} confidence</Pill>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{a.detail}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span className="text-muted">Delay reduction <b className="text-forest">~{a.reductionPct}%</b></span>
                  <span className="text-muted">Annual savings <b className="text-forest">~{fmtMoney(a.annualSavings)}</b></span>
                  <span className="text-muted">Capex <b className="text-ink">{fmtMoney(a.capex)}</b></span>
                  <span className="text-muted">Effort <b className="text-ink">{a.effort}</b></span>
                  <span className="text-muted">Timeline <b className="text-ink">{a.timeline}</b></span>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <SectionTitle hint={f.scenario.outcomeUnit}>Projected impact (all actions)</SectionTitle>
            <div className="font-display text-3xl text-forest">{pi.totalReductionPct}%</div>
            <div className="text-[12px] text-muted">≈ {pi.totalReductionDays.toFixed(2)} {f.scenario.outcomeUnit} total reduction</div>
            <div className="mt-3"><ImpactTrendChart data={pi.trend} /></div>
            <p className="mt-2 text-[11px] text-muted">Orange = baseline trajectory · green = with the recommended actions phased in.</p>
          </Card>
        </div>
      )}

      {sub === "Executive Report" && (
        <Card id="tour-report">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText size={15} className="text-forest" /> Executive Causal Analysis Report
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft hover:border-forest/40 hover:text-forest"
              >
                <Printer size={13} /> Save as PDF
              </button>
              <Pill tone="neutral">Confidential</Pill>
            </div>
          </div>
          <div className="print-only mb-2 mt-1 text-[11px] text-muted">
            Generated from CausalOCPM · {f.scenario.org} · {r.date}
          </div>
          <div className="mt-1 text-[12px] text-muted">
            {f.scenario.domainLabel} Domain · {r.date} · {r.casesAnalysed.toLocaleString()} cases analysed
          </div>

          <Section label="01 · Key findings">
            <div className="grid gap-3 sm:grid-cols-3">
              <KeyFinding v={`${r.groundTruthEffect} ${f.scenario.outcomeUnit}`} l="Ground-truth effect" sub="planted SCM coefficient — DML validates recovery" />
              <KeyFinding v={`${r.confoundingRemoved} ${f.scenario.outcomeUnit}`} l="Confounding bias removed" sub={`naive ${r.naiveDays} ${f.scenario.outcomeUnit}`} />
              <KeyFinding v={`${r.achievableReductionPct}%`} l="Achievable reduction" sub={`from ${r.baselineDays} → ${r.targetDays} ${f.scenario.outcomeUnit}`} />
            </div>
          </Section>

          <Section label="02 · Primary causal chain">
            <div className="font-display text-lg text-ink">{r.primaryChain.join("  →  ")}</div>
            <p className="mt-1 text-sm text-ink-soft">
              The confounding path closes through {f.scenario.confounderLabel.toLowerCase()} — traditional analytics
              cannot detect it. Autonomous bootstrapped PC recovers {f.discoveryMetrics.truePositives} of{" "}
              {f.scenario.causalLinks} planted edges (F1 {f.discoveryMetrics.f1.toFixed(2)}, precision{" "}
              {f.discoveryMetrics.precision.toFixed(2)}, recall {f.discoveryMetrics.recall.toFixed(2)}); domain-knowledge
              constraints then complete the DAG. Structural coefficients recovered within {f.pipelinePerf.avgCoefErrorPct}%
              of their planted values.
            </p>
          </Section>

          <Section label="03 · Recommended action plan">
            <div className="scroll-slim overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                    {["#", "Action", "Impact", "Confidence", "Value", "Timeline"].map((h) => (
                      <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.actions.map((a) => (
                    <tr key={a.rank} className="border-t border-line-soft text-ink-soft">
                      <td className="py-2 pr-4">{a.rank}</td>
                      <td className="py-2 pr-4">{a.action}</td>
                      <td className="py-2 pr-4 text-forest">{a.impactPct}%</td>
                      <td className="py-2 pr-4">{a.confidence}</td>
                      <td className="py-2 pr-4">{a.value}</td>
                      <td className="py-2 pr-4">{a.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              <span>Total capex: <b className="text-ink">~{fmtMoney(r.totalCapex)}</b></span>
              <span>ROI payback: <b className="text-ink">{r.roiPayback}</b></span>
              <span>Risk level: <b className="text-ink">{r.riskLevel}</b></span>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              ✱ Value estimates apply to the ~{f.simulator.annualVolume.toLocaleString()} in-scope{" "}
              {f.domain === "manufacturing" ? "shipments" : "admissions"}/year at ${f.simulator.costPerDelayDay.toLocaleString()}{" "}
              avg cost per {f.scenario.outcomeUnit.replace(/s$/, "")}-day (configurable domain parameters). Reduction % from
              the policy simulator under the stated lever scenario.
            </p>
          </Section>

          <Section label="04 · Methodology & confidence">
            <div className="space-y-2">
              {r.methodology.map((mm) => (
                <div key={mm.phase} className="text-sm">
                  <span className="font-medium text-ink">{mm.phase}</span>
                  <span className="text-muted"> — {mm.detail}</span>
                </div>
              ))}
              <div className="text-sm"><span className="font-medium text-ink">Model confidence</span><span className="text-muted"> — {r.signConsistency} across the estimated causal coefficients · E-value {f.sensitivity.eValue}</span></div>
            </div>
          </Section>

          <Section label="05 · Cross-domain validation benchmark">
            <p className="mb-2 text-[12px] text-muted">
              The identical pipeline, run on an independent domain with no code changes — evidence the framework is
              generalised, not overfit to one dataset.
            </p>
            <div className="scroll-slim overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                    {["Domain", "Discovery F1", "Naive", "Causal (DML)", "Planted", "E-value"].map((h) => (
                      <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {f.crossDomain.map((d) => (
                    <tr key={d.domain} className={clsx("border-t border-line-soft text-ink-soft", d.domain === f.scenario.domainLabel && "font-medium text-ink")}>
                      <td className="py-2 pr-4">{d.domain}</td>
                      <td className="py-2 pr-4">{d.f1.toFixed(2)}</td>
                      <td className="py-2 pr-4">{d.naive.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-forest">{d.causal.toFixed(2)}</td>
                      <td className="py-2 pr-4">{d.planted.toFixed(2)}</td>
                      <td className="py-2 pr-4">{d.eValue.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
            Generated by CausalOCPM · Causal Process Intelligence Framework · {r.date}
          </p>
        </Card>
      )}

      {sub === "Action Log" && (
        <Card pad={false}>
          <div className="scroll-slim overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                  {["Timestamp", "Action", "Lever", "Δ days", "Status"].map((h) => (
                    <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {f.recommendedActions.map((a, i) => (
                  <tr key={a.id} className="border-t border-line-soft text-ink-soft">
                    <td className="py-2 pr-4">2024-06-{String(10 + i * 3).padStart(2, "0")} 09:{String(12 + i).padStart(2, "0")}</td>
                    <td className="py-2 pr-4">{a.title}</td>
                    <td className="py-2 pr-4">{a.lever}</td>
                    <td className="py-2 pr-4 text-forest">−{a.deltaDays.toFixed(2)}</td>
                    <td className="py-2 pr-4"><Pill tone={i === 0 ? "forest" : "neutral"}>{i === 0 ? "Approved" : "Proposed"}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-deep">{label}</div>
      {children}
    </div>
  );
}

function KeyFinding({ v, l, sub }: { v: string; l: string; sub: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper-2/50 p-3">
      <div className="font-display text-xl text-ink">{v}</div>
      <div className="text-[11px] font-medium text-ink-soft">{l}</div>
      <div className="text-[10px] text-muted">{sub}</div>
    </div>
  );
}
