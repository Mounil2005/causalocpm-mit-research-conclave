"use client";
import { clsx } from "clsx";
import { ShieldCheck, AlertTriangle, Eye } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card } from "@/components/ui";
import { CountUp } from "@/components/motion";

const STATUS = {
  PROCEED: { tone: "forest", icon: ShieldCheck, blurb: "The causal evidence supports acting on this decision." },
  MONITOR: { tone: "amber", icon: Eye, blurb: "Act, but track the outcome — some dimensions are weaker." },
  "REVIEW RECOMMENDED": { tone: "danger", icon: AlertTriangle, blurb: "Evidence is thin on at least one dimension — a human should review before this decision stands." },
} as const;

export function CausalAuditScore({ f, compact = false }: { f: CausalFixture; compact?: boolean }) {
  const a = f.causalAuditScore;
  const s = STATUS[a.status];
  const Icon = s.icon;

  return (
    <Card id="tour-audit-score">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-2">
          <span
            className={clsx(
              "font-display text-5xl leading-none",
              s.tone === "forest" && "text-forest",
              s.tone === "amber" && "text-amber",
              s.tone === "danger" && "text-danger",
            )}
          >
            <CountUp value={a.score} />
          </span>
          <span className="text-lg text-muted">/ 100</span>
        </div>
        <div className="min-w-0">
          <div
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              s.tone === "forest" && "bg-sage text-forest-deep",
              s.tone === "amber" && "bg-[#f2e4d2] text-amber",
              s.tone === "danger" && "bg-[#f1ddd6] text-danger",
            )}
          >
            <Icon size={13} /> {a.status}
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">{s.blurb}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 space-y-2 border-t border-line-soft pt-3">
          {a.dimensions.map((d) => (
            <div key={d.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink">{d.key}</span>
                <span className="text-[11px] tabular-nums text-muted">{d.score}</span>
              </div>
              <div className="row-span-2 h-1.5 w-28 overflow-hidden rounded-full bg-line-soft">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    d.score >= 85 ? "bg-forest" : d.score >= 70 ? "bg-amber" : "bg-danger",
                  )}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <p className="text-[11px] leading-snug text-muted">{d.why}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted">
        Composite of eight measured pipeline metrics, each mapped to 0–100 by a fixed formula — not a subjective rating.
      </p>
    </Card>
  );
}
