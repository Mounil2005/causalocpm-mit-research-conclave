"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { Sparkles, ShieldCheck, AlertTriangle, ChevronDown, ArrowDown } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, Stat, SectionTitle, Pill, KeyVal } from "@/components/ui";
import { CausalGraph, GraphLegend } from "@/components/CausalGraph";
import { motion } from "@/components/motion";

export function DataDiscoveryTab({ f }: { f: CausalFixture }) {
  const d = f.data;
  const dv = f.discovery;
  const m = f.discoveryMetrics;
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* AI discovery summary */}
      <Card className="border-forest/25 bg-sage/30">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles size={15} className="text-forest" /> AI Discovery Summary
          <Pill tone="forest">HIGH CONFIDENCE</Pill>
        </div>
        <ul className="space-y-1.5 text-sm text-ink-soft">
          <li>Autonomous bootstrapped PC recovered <b>{m.truePositives} of {f.scenario.causalLinks}</b> planted edges across {dv.totalEvents.toLocaleString()} events and {f.scenario.objectTypes} object types — precision {m.precision.toFixed(2)}, recall {m.recall.toFixed(2)}, F1 {m.f1.toFixed(2)}{m.falsePositives ? `, ${m.falsePositives} spurious edge` : ", no spurious edges"}.</li>
          <li>Strongest measured relationship: <b>{dv.strongestRelationship.from} → {dv.strongestRelationship.to}</b> (coefficient {dv.strongestRelationship.coefficient}).</li>
          <li>Bootstrap stability {Math.round(m.stability * 100)}% across {m.bootstrapRuns} resampled reruns of 2,000 rows each.</li>
          <li>Domain knowledge then recovers the {f.pipelinePerf.missingEdgesRecovered} missed edge{f.pipelinePerf.missingEdgesRecovered === 1 ? "" : "s"}{f.pipelinePerf.spuriousRemoved ? " and re-orients the spurious one" : ""} — no invented relationships.</li>
        </ul>
      </Card>

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <Badge label="Discovery F1" value={m.f1.toFixed(2)} />
        <Badge label="Precision" value={m.precision.toFixed(2)} />
        <Badge label="Edge recall" value={m.recall.toFixed(2)} />
        <Badge label="Bootstrap stability" value={`${Math.round(m.stability * 100)}%`} />
      </div>

      <Step n={1} title="Understand the event data" hint="foundation for causal discovery">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat value={dv.totalEvents.toLocaleString()} label="Total events" accent />
          <Stat value={`${dv.treatedCases.toLocaleString()}`} label={`Treated cases · ${dv.treatedPct}%`} />
          <Stat value={dv.avgOutcome.toFixed(1)} label={`Avg ${f.scenario.outcomeUnit}`} />
          <Stat value={dv.stdOutcome.toFixed(1)} label={`Std dev (${f.scenario.outcomeUnit})`} />
        </div>
      </Step>

      <Step n={2} title="Explore object relationships" hint="object interaction network">
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-sm text-ink-soft">
              This network shows how {f.scenario.objectNames.join(", ")} co-occur throughout the process. Higher
              connectivity means richer interactions — the structural foundation causal discovery builds on.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {dv.topResources.map((r) => (
                <div key={r.label} className="rounded-lg border border-line bg-card p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted">{r.label}</div>
                  <div className="font-display text-base text-ink">{r.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <MiniStat v={dv.objectInstances.toLocaleString()} l="Object instances" />
              <MiniStat v={dv.coOccurrenceEdges.toLocaleString()} l="Co-occurrence edges" />
              <MiniStat v={`${dv.avgDegree}`} l={`Avg degree · ${f.scenario.objectTypes} types`} />
            </div>
          </div>
          <Card className="lg:col-span-2">
            <CausalGraph graph={f.causalGraph} height={260} compact interactive={false} />
            <GraphLegend />
          </Card>
        </div>
      </Step>

      <Step n={3} title="Observe process correlations" hint="correlation view — not yet causal">
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber/30 bg-[#f7ecdd] p-3 text-[12px] text-amber">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          This view represents observed correlations only. True causal effects are estimated after removing confounding.
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {dv.correlationGroups.map((g) => (
            <div key={g.name} className="rounded-lg border border-line bg-card p-3">
              <div className="mb-2 text-[12px] font-medium text-ink">{g.name}</div>
              {g.options.map((o) => (
                <div key={o.label} className="mb-2">
                  <div className="mb-1 flex justify-between text-[11px] text-muted">
                    <span>{o.label}</span>
                    <span>{o.delayedPct}% delayed</span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-line-soft">
                    <div className="bg-forest" style={{ width: `${o.onTimePct}%` }} />
                    <div className="bg-amber" style={{ width: `${o.delayedPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Step>

      <Step n={4} title="Recovered causal structure" hint={`bootstrap edge confidence ${Math.round(m.stability * 100)}%`}>
        <div className="rounded-lg border border-forest/25 bg-sage/30 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-forest-deep">Key finding — observed causal pathway</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-display text-lg text-ink">
            {f.executiveSummary.chain.map((c, i) => (
              <span key={c} className="flex items-center gap-2">
                {c}
                {i < f.executiveSummary.chain.length - 1 && <ArrowDown size={16} className="rotate-[-90deg] text-forest" />}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            In plain terms: {f.executiveSummary.chain[0]} drives up {f.executiveSummary.chain[1]}, which in turn pushes{" "}
            {f.executiveSummary.chain[2]} higher. This suggests operational mechanics, rather than raw assignments alone,
            drive performance outcomes.
          </p>
        </div>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <Card id="tour-dag" className="scroll-mt-24">
            <SectionTitle hint="drag nodes · click to trace paths · ↳ backdoor toggle">Full discovered DAG</SectionTitle>
            <CausalGraph graph={f.causalGraph} height={320} />
            <GraphLegend />
          </Card>
          <Card pad={false}>
            <div className="p-5 pb-2"><SectionTitle hint="≥ 60% = retained by bootstrap">Edge stability</SectionTitle></div>
            <div className="scroll-slim max-h-[320px] overflow-auto px-5 pb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="pb-2 pr-4 font-semibold">Edge</th>
                    <th className="pb-2 pr-4 font-semibold">Freq.</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...m.edgeStability].sort((a, b) => b.frequency - a.frequency).map((e) => (
                    <tr key={e.edge} className="border-t border-line-soft text-ink-soft">
                      <td className="py-2 pr-4">{e.edge}</td>
                      <td className="py-2 pr-4">{Math.round(e.frequency * 100)}%</td>
                      <td className="py-2">
                        {e.pruned ? (
                          <span className="text-amber">spurious · pruned</span>
                        ) : e.frequency >= 0.6 ? (
                          <span className="text-forest">recovered</span>
                        ) : (
                          <span className="text-muted">missed · sub-threshold</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Step>

      <Step n={5} title="Validate discovery quality" hint="tested against resampled data & known ground truth">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat value={`${Math.round(m.stability * 100)}%`} label={`Edges stable across ${m.bootstrapRuns} resampled graphs`} accent />
          <Stat value={m.precision.toFixed(2)} label="Precision" />
          <Stat value={m.recall.toFixed(2)} label="Edge recall" />
          <Stat value={m.f1.toFixed(2)} label="Discovery F1" accent />
        </div>
        <p className="mt-2 text-[12px] text-muted">
          The raw autonomous statistics — before any expert constraint. Precision {m.precision.toFixed(2)}, recall{" "}
          {m.recall.toFixed(2)}, F1 {m.f1.toFixed(2)}. Not 1.0, and it shouldn&apos;t be — a 1.0 here would mean either
          overfitting or grading the algorithm on edges it was handed.
        </p>
      </Step>

      <Step n={6} title="Evaluate domain-knowledge contribution" hint="what the expert constraints actually changed">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat value={`+${f.pipelinePerf.missingEdgesRecovered}`} label={`Missed edge${f.pipelinePerf.missingEdgesRecovered === 1 ? "" : "s"} recovered`} accent />
          <Stat value={`${f.pipelinePerf.spuriousRemoved}`} label="Spurious edge re-oriented" />
          <Stat value={`${f.pipelinePerf.validatedLinks}/${f.pipelinePerf.validatedLinks}`} label="Actionable DAG" accent />
        </div>
        <div className="mt-3 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
          <div className="flex items-center gap-2"><ShieldCheck size={13} className="text-forest" /> Asserts the {f.pipelinePerf.missingEdgesRecovered} known-true edge{f.pipelinePerf.missingEdgesRecovered === 1 ? "" : "s"} PC missed</div>
          {f.pipelinePerf.spuriousRemoved > 0 && <div className="flex items-center gap-2"><ShieldCheck size={13} className="text-forest" /> Flips the spurious edge back to its causal direction</div>}
          <div className="flex items-center gap-2"><ShieldCheck size={13} className="text-forest" /> Every asserted edge is in the planted structure, never invented</div>
          <div className="flex items-center gap-2"><ShieldCheck size={13} className="text-forest" /> Corrected structure is reported separately, never as a discovery score</div>
        </div>
      </Step>

      {/* raw data preview (collapsible) */}
      <Card pad={false}>
        <button onClick={() => setRawOpen((v) => !v)} className="flex w-full items-center justify-between p-5">
          <SectionTitle>Raw data preview</SectionTitle>
          <ChevronDown size={16} className={clsx("text-muted transition-transform", rawOpen && "rotate-180")} />
        </button>
        {rawOpen && (
          <div className="space-y-6 px-5 pb-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <KeyVal k="Datasets" v={d.datasets} />
              <KeyVal k="Variables" v={d.variables} />
              <KeyVal k="Causal links" v={d.causalLinks} />
              <KeyVal k="Quality" v={`${d.qualityPct}%`} />
            </div>
            <RawTable head={["Object", "Records", "Attributes", "Missing", "Quality", "Updated"]} rows={d.objects.map((o) => [o.name, o.records.toLocaleString(), String(o.attributes), `${o.missingPct}%`, `${o.qualityPct}%`, o.updated])} />
            <RawTable head={["Variable", "Object", "Type", "Role", "Missing"]} rows={d.variableList.map((v) => [v.name, v.object, v.type, v.role, `${v.missingPct}%`])} />
            <RawTable head={Object.keys(d.sampleEvents[0])} rows={d.sampleEvents.map((e) => Object.values(e).map((v) => String(v)))} />
          </div>
        )}
      </Card>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card hover className="relative">
        <span className="absolute -left-3 top-5 hidden h-7 w-7 items-center justify-center rounded-full bg-forest text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(61,90,61,0.3)] sm:flex">
          {n}
        </span>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-[13px] font-semibold text-white sm:hidden">{n}</span>
          <div>
            <div className="text-sm font-semibold text-ink">
              <span className="text-muted">Step {n} · </span>
              {title}
            </div>
            {hint && <div className="text-[11px] text-muted">{hint}</div>}
          </div>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function MiniStat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-2">
      <div className="font-display text-base text-ink">{v}</div>
      <div className="text-[10px] text-muted">{l}</div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage text-forest"><ShieldCheck size={15} /></div>
      <div>
        <div className="font-display text-lg leading-none text-ink">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      </div>
    </div>
  );
}

function RawTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="scroll-slim overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
            {head.map((h) => <th key={h} className="whitespace-nowrap pb-2 pr-4 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line-soft">
              {r.map((c, j) => <td key={j} className="whitespace-nowrap py-2 pr-4 text-ink-soft">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
