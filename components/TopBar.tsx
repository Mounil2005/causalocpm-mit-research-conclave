"use client";
import { Factory, Github, HeartPulse, Link2, MoreVertical, ShieldCheck, Target, TrendingUp } from "lucide-react";
import type { CausalFixture, DomainId } from "@/lib/engine/types";
import { CountUp, motion } from "@/components/motion";

export function TopBar({
  f,
  domain,
  rightSlot,
  compact = false,
}: {
  f: CausalFixture;
  domain: DomainId;
  rightSlot?: React.ReactNode;
  compact?: boolean;
}) {
  const DomainIcon = domain === "manufacturing" ? Factory : HeartPulse;

  return (
    <div className="no-print mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[44px] leading-none tracking-tight text-ink sm:text-[54px]"
          >
            Causal<span className="text-forest">OCPM</span>
          </motion.h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px w-8 bg-forest" />
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted">Explain · Predict · Simulate</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>
              <DomainIcon size={13} /> {f.scenario.domainLabel}
            </Pill>
            <Pill>{f.scenario.org}</Pill>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Connector />
          <div className="flex items-center gap-2 text-[12px] text-ink-soft">
            {rightSlot}
            <a
              href="https://github.com/Aditya0105singh/CAUSALOCPM"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 font-medium hover:border-forest/40 hover:text-forest sm:flex"
            >
              <Github size={14} /> Fork
            </a>
            <button className="hidden rounded-lg border border-line bg-card p-1.5 text-muted hover:text-ink sm:block" aria-label="More">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className={`mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 ${compact ? "hidden" : ""}`}>
        <Kpi Icon={Link2} bg="bg-sage" value={<CountUp value={f.kpis.causalLinks} />} label="Cause-and-Effect Links" sub="Causal intelligence" />
        <Kpi Icon={Target} bg="bg-[#efe6d6]" value={f.kpis.target} label="Target" sub="Business impact" />
        <Kpi Icon={ShieldCheck} bg="bg-sage" value={<CountUp value={f.kpis.expertRules} />} label="Expert Rules Applied" sub="Validated & interpretable" />
        <Kpi Icon={ShieldCheck} bg="bg-[#efe6d6]" value={<><CountUp value={f.kpis.reliabilityPct} />%</>} label="Reliable" sub="Confidence you can trust" />
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-[12px] text-ink-soft">
      {children}
    </span>
  );
}

function Connector() {
  return (
    <div className="relative hidden h-24 w-[280px] md:block">
      <svg viewBox="0 0 280 96" className="h-full w-full">
        <path d="M2 74 C 70 20, 130 88, 200 34 S 270 20, 278 26" fill="none" stroke="#cbb89a" strokeWidth="1.4" className="flow-dash" />
        <path d="M6 40 C 80 68, 150 30, 276 58" fill="none" stroke="#d9cdb4" strokeWidth="1" strokeDasharray="2 5" />
        {[
          [46, 46],
          [120, 58],
          [186, 40],
          [242, 52],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.6" fill="#4f7a4a" opacity={0.5} />
        ))}
      </svg>
      <IconNode className="left-[64px] top-[6px] float-slow" Icon={Target} />
      <IconNode className="left-[128px] top-[40px] float-slow-2" Icon={TrendingUp} />
      <FilledNode className="right-[2px] top-[8px] float-slow-3" />
    </div>
  );
}

function IconNode({ Icon, className }: { Icon: typeof Target; className: string }) {
  return (
    <span
      className={`absolute flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-forest shadow-[0_2px_8px_rgba(44,46,30,0.08)] ${className}`}
    >
      <Icon size={16} />
    </span>
  );
}

function FilledNode({ className }: { className: string }) {
  return (
    <span className={`absolute flex h-11 w-11 items-center justify-center rounded-full bg-forest text-white shadow-[0_4px_14px_rgba(61,90,61,0.35)] ${className}`}>
      <ShieldCheck size={18} />
    </span>
  );
}

function Kpi({
  Icon,
  bg,
  value,
  label,
  sub,
}: {
  Icon: typeof Target;
  bg: string;
  value: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card card-hover flex items-center gap-3 p-3.5"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} text-forest`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink">{value}</div>
        <div className="text-[11px] font-medium text-ink-soft">{label}</div>
        <div className="text-[10px] text-muted">{sub}</div>
      </div>
    </motion.div>
  );
}
