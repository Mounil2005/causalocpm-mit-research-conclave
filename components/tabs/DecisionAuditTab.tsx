"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { Bot, Eye, EyeOff, Scale } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle, Pill } from "@/components/ui";
import { CausalGraph } from "@/components/CausalGraph";
import { CausalAuditScore } from "@/components/CausalAuditScore";
import { CounterfactualReplay } from "@/components/CounterfactualReplay";
import { FadeIn } from "@/components/motion";

const VERDICT = {
  "over-confident": { tone: "danger" as const, text: "The agent's stated confidence exceeds the causal support for this decision." },
  "under-supported": { tone: "amber" as const, text: "The decision is weakly supported — the agent should have flagged uncertainty." },
  aligned: { tone: "forest" as const, text: "The agent's confidence is consistent with the causal evidence." },
};

export function DecisionAuditTab({ f }: { f: CausalFixture }) {
  const decisions = f.agentDecisions;
  const [id, setId] = useState(decisions[0].id);
  const d = decisions.find((x) => x.id === id) ?? decisions[0];
  const n = f.narrative;
  const unit = f.scenario.outcomeUnit;
  const eff = f.effects[0];
  const v = VERDICT[d.verdict];

  return (
    <div className="space-y-5">
      <Card id="tour-decision-picker" pad={false}>
        <div className="scroll-slim flex gap-2 overflow-x-auto p-3">
          {decisions.map((x) => (
            <button
              key={x.id}
              onClick={() => setId(x.id)}
              className={clsx(
                "shrink-0 rounded-lg border px-3 py-2 text-left transition-colors",
                x.id === d.id ? "border-forest/50 bg-sage" : "border-line bg-card hover:border-forest/30",
              )}
            >
              <div className="text-[11px] font-semibold text-muted">{x.id}</div>
              <div className="text-[12px] text-ink">{x.entity} · complexity {x.complexityScore}</div>
              <div className="mt-0.5 text-[10px] text-muted">
                outcome {x.outcomeDays.toFixed(1)} {unit}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* the agent's own account */}
        <Card>
          <SectionTitle hint={d.id}>What the agent did</SectionTitle>
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-forest" />
            <span className="font-display text-lg text-ink">{n.agentName}</span>
            <Pill tone="neutral">{Math.round(d.confidence * 100)}% confident</Pill>
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">
            {n.agentRole}. On {d.caseId}: <b className="text-ink-soft">{n.decisionLabel}</b> — chosen over {n.altLabel}.
          </p>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-forest-deep">
            <Eye size={12} className="mr-1 inline" /> What the agent weighed
          </div>
          <div className="mt-1.5 space-y-1.5">
            {n.agentSignals.map((sig) => (
              <div key={sig.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="text-[12px] text-ink-soft">{sig.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full bg-forest/70" style={{ width: `${sig.weight * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] tabular-nums text-muted">{Math.round(sig.weight * 100)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amber">
            <EyeOff size={12} className="mr-1 inline" /> What the agent could not see
          </div>
          <ul className="mt-1.5 space-y-1 text-[12px] text-ink-soft">
            {n.agentBlindSpots.map((b, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-amber">•</span> {b}
              </li>
            ))}
          </ul>
        </Card>

        {/* what actually caused the outcome */}
        <Card>
          <SectionTitle hint="confounding removed">What actually caused the outcome</SectionTitle>
          <CausalGraph graph={f.causalGraph} height={230} compact interactive={false} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <Mini v={eff.naiveDays.toFixed(2)} l="Naive" tone="muted" />
            <Mini v={eff.effectDays.toFixed(2)} l="Causal (DML)" tone="forest" />
            <Mini v={eff.groundTruthDays.toFixed(2)} l="Planted truth" tone="ink" />
          </div>
          <p className="mt-2 text-[12px] text-ink-soft">
            The agent leaned on {n.agentSignals[0].label.toLowerCase()}, but the real driver runs through{" "}
            <b>{d.dominantDriver}</b> (~{Math.abs(d.dominantContribution).toFixed(1)} {unit}), confounded by{" "}
            {f.scenario.confounderLabel.toLowerCase()}. A dashboard would have reported {eff.naiveDays.toFixed(1)} {unit};
            the true effect is {eff.effectDays.toFixed(1)}.
          </p>
        </Card>
      </div>

      <FadeIn>
        <CounterfactualReplay f={f} decision={d} />
      </FadeIn>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <CausalAuditScore f={f} />
        <Card id="tour-verdict">
          <SectionTitle>Verdict</SectionTitle>
          <div className="flex items-center gap-2">
            <Scale size={16} className={clsx(v.tone === "forest" ? "text-forest" : v.tone === "amber" ? "text-amber" : "text-danger")} />
            <Pill tone={v.tone}>{d.verdict.replace("-", " ")}</Pill>
          </div>
          <p className="mt-2 text-[13px] text-ink-soft">{v.text}</p>
          <div className="mt-3 border-t border-line-soft pt-2 text-[12px] text-muted">
            Stated confidence <b className="text-ink-soft">{Math.round(d.confidence * 100)}%</b> · audit score{" "}
            <b className="text-ink-soft">{f.causalAuditScore.score}/100</b> · attributable delay{" "}
            <b className="text-ink-soft">{(d.outcomeDays - d.counterfactualDays).toFixed(1)} {unit}</b>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Mini({ v, l, tone }: { v: string; l: string; tone: "muted" | "forest" | "ink" }) {
  return (
    <div className="rounded-lg border border-line bg-paper-2/50 p-2">
      <div
        className={clsx(
          "font-display text-lg tabular-nums",
          tone === "forest" ? "text-forest" : tone === "muted" ? "text-muted" : "text-ink",
        )}
      >
        {v}
      </div>
      <div className="text-[10px] text-muted">{l}</div>
    </div>
  );
}
