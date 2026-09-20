"use client";
import { clsx } from "clsx";
import { Activity, Boxes, CheckCircle2, Factory, GitBranch, Globe, HeartPulse, Link2 } from "lucide-react";
import type { CausalFixture, DomainId } from "@/lib/engine/types";
import { motion } from "@/components/motion";

const META: Record<DomainId, { title: string; Icon: typeof Factory; badgeBg: string; iconColor: string }> = {
  manufacturing: { title: "Manufacturing", Icon: Factory, badgeBg: "bg-sage", iconColor: "text-forest" },
  healthcare: { title: "Healthcare", Icon: HeartPulse, badgeBg: "bg-[#efe6d6]", iconColor: "text-amber" },
};

export function Sidebar({
  fixtures,
  domain,
  onDomain,
}: {
  fixtures: Record<DomainId, CausalFixture>;
  domain: DomainId;
  onDomain: (d: DomainId) => void;
}) {
  const f = fixtures[domain];
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 overflow-y-auto border-r border-line bg-gradient-to-b from-paper-2/70 to-paper-2/40 p-5 lg:block scroll-slim">
      {/* logo */}
      <div className="mb-6 flex items-center gap-2.5">
        <LogoGlyph />
        <div>
          <div className="font-display text-[17px] leading-none text-ink">
            Causal<span className="text-forest">OCPM</span>
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted">Decision Intelligence · v1.0</div>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        <Globe size={11} /> Analysis Domain
      </div>
      <div className="space-y-2">
        {(Object.keys(META) as DomainId[]).map((d) => {
          const m = META[d];
          const selected = d === domain;
          return (
            <button
              key={d}
              onClick={() => onDomain(d)}
              className={clsx(
                "relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                selected ? "border-forest/40 bg-sage/70 shadow-[0_1px_3px_rgba(44,46,30,0.05)]" : "border-line bg-card hover:border-line-soft hover:bg-paper-2",
              )}
            >
              <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", m.badgeBg)}>
                <m.Icon size={16} className={m.iconColor} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">{m.title}</span>
                <span className="block truncate text-[11px] text-muted">{fixtures[d].scenario.org}</span>
              </span>
              {selected && (
                <motion.span layoutId="domain-dot" className="absolute right-3 h-2 w-2 rounded-full bg-forest" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat Icon={Activity} value={`${Math.round(f.scenario.totalEvents / 1000)}K`} label="Events" />
        <MiniStat Icon={Boxes} value={String(f.scenario.objectTypes)} label="Object Types" />
      </div>

      <div className="mt-6 mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Scenario Overview
      </div>
      <dl className="space-y-2.5 text-[12px]">
        <Row k="Outcome" v={f.scenario.outcomeVariable} />
        <Row k="Treatment" v={f.scenario.treatmentLabel} />
        <Row k="Confounder" v={f.scenario.confounderLabel} />
        <Row k="Goal" v={`Reduce ${f.scenario.outcomeVariable.toLowerCase()} via validated causal interventions`} />
      </dl>

      <div className="mt-6 rounded-xl border border-line bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
            <span className="h-2 w-2 rounded-full bg-forest pulse-ring" /> Pipeline ready
          </span>
          <span className="text-[10px] text-forest">Healthy</span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <PipeStat Icon={Activity} value={`${Math.round(f.scenario.totalEvents / 1000)}K`} label="Events" />
          <PipeStat Icon={Link2} value={String(f.scenario.causalLinks)} label="Links" />
          <PipeStat Icon={CheckCircle2} value="SCM" label="Fitted" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted">
          <GitBranch size={10} className="text-forest" /> 5-phase pipeline · OCEL → SCM → DML
        </div>
      </div>
    </aside>
  );
}

function LogoGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="shrink-0">
      <rect width="34" height="34" rx="9" fill="#e8efe0" />
      <g stroke="#3d5a3d" strokeWidth="1.4" fill="none">
        <line x1="9" y1="10" x2="17" y2="17" />
        <line x1="9" y1="24" x2="17" y2="17" />
        <line x1="17" y1="17" x2="25" y2="12" />
        <line x1="17" y1="17" x2="25" y2="23" />
      </g>
      {[
        [9, 10],
        [9, 24],
        [17, 17],
        [25, 12],
        [25, 23],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 2 ? 3 : 2.2} fill={i === 2 ? "#2c452e" : "#4f7a4a"} />
      ))}
    </svg>
  );
}

function MiniStat({ Icon, value, label }: { Icon: typeof Activity; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-2.5 py-2">
      <Icon size={12} className="text-forest" />
      <div className="mt-1 font-display text-lg leading-none text-ink">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  );
}

function PipeStat({ Icon, value, label }: { Icon: typeof Activity; value: string; label: string }) {
  return (
    <div className="rounded-md bg-paper-2/60 px-1.5 py-1.5 text-center">
      <Icon size={11} className="mx-auto text-forest" />
      <div className="mt-0.5 text-[12px] font-semibold text-ink">{value}</div>
      <div className="text-[9px] text-muted">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted">{k}</dt>
      <dd className="font-medium text-ink">{v}</dd>
    </div>
  );
}
