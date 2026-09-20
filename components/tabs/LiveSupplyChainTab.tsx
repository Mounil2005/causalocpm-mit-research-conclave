"use client";
import { ArrowUpRight } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle, Pill } from "@/components/ui";
import { LiveSupplyChain } from "@/components/LiveSupplyChain";

const VERDICT_TONE = {
  "over-confident": "danger",
  "under-supported": "amber",
  aligned: "forest",
} as const;

export function LiveSupplyChainTab({ f, onAudit }: { f: CausalFixture; onAudit?: () => void }) {
  const unit = f.scenario.outcomeUnit;
  const queue = [...f.agentDecisions].sort((a, b) => b.outcomeDays - a.outcomeDays);

  return (
    <div className="space-y-5">
      <LiveSupplyChain f={f} />

      <Card pad={false}>
        <div className="flex items-center justify-between p-4 pb-2">
          <SectionTitle hint={`${queue.length} decisions`}>Decisions awaiting audit</SectionTitle>
          {onAudit && (
            <button
              onClick={onAudit}
              className="no-print inline-flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1 text-[12px] font-medium text-ink-soft hover:border-forest/40 hover:text-forest"
            >
              Open Decision Audit <ArrowUpRight size={12} />
            </button>
          )}
        </div>
        <div className="scroll-slim overflow-x-auto p-4 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                {["Decision", "Type", "Confidence", `Outcome (${unit})`, "Attributable", "Audit flag"].map((h) => (
                  <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((d) => (
                <tr key={d.id} className="border-t border-line-soft text-ink-soft">
                  <td className="py-2 pr-4 font-medium text-ink">{d.id}</td>
                  <td className="py-2 pr-4">{d.entity}</td>
                  <td className="py-2 pr-4 tabular-nums">{Math.round(d.confidence * 100)}%</td>
                  <td className="py-2 pr-4 tabular-nums">{d.outcomeDays.toFixed(1)}</td>
                  <td className="py-2 pr-4 tabular-nums text-danger">
                    +{(d.outcomeDays - d.counterfactualDays).toFixed(1)}
                  </td>
                  <td className="py-2 pr-4">
                    <Pill tone={VERDICT_TONE[d.verdict]}>{d.verdict.replace("-", " ")}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 pb-4 text-[11px] text-muted">
          The audit queue is the six highest-delay decisions from the benchmark log — each is fully replayable in
          Decision Audit. This is a digital twin, not a production data feed.
        </p>
      </Card>
    </div>
  );
}
