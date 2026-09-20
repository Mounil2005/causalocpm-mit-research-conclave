"use client";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function Card({
  children,
  className,
  pad = true,
  hover = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
  hover?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={clsx("card", hover && "card-hover", pad && "p-5", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="text-sm font-semibold tracking-wide text-ink">{children}</h3>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function Stat({
  value,
  label,
  sub,
  accent,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <div
        className={clsx(
          "font-display text-3xl leading-none",
          accent ? "text-forest" : "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-xs font-medium text-ink-soft">{label}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-muted">{sub}</div> : null}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "forest" | "amber" | "danger";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        tone === "neutral" && "bg-paper-2 text-ink-soft",
        tone === "forest" && "bg-sage text-forest-deep",
        tone === "amber" && "bg-[#f2e4d2] text-amber",
        tone === "danger" && "bg-[#f1ddd6] text-danger",
      )}
    >
      {children}
    </span>
  );
}

export function Bar({
  value,
  max,
  tone = "forest",
}: {
  value: number;
  max: number;
  tone?: "forest" | "muted";
}) {
  const pct = Math.max(2, Math.min(100, (Math.abs(value) / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line-soft">
      <motion.div
        className={clsx("h-full rounded-full", tone === "forest" ? "bg-forest" : "bg-muted")}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/**
 * Provenance tag — every headline number should say where it comes from.
 *   measured = a raw output of the reference pipeline
 *   derived  = computed from measured values (e.g. reduction % from an effect)
 *   assumed  = a configurable business parameter, not a measurement
 */
export type Provenance = "measured" | "derived" | "assumed";

export function ProvTag({ kind, note }: { kind: Provenance; note?: string }) {
  const label = { measured: "MEASURED", derived: "DERIVED", assumed: "ASSUMED" }[kind];
  return (
    <span
      title={note}
      className={clsx(
        "inline-flex select-none items-center gap-1 rounded-[4px] px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-[0.08em]",
        kind === "measured" && "bg-sage text-forest-deep",
        kind === "derived" && "border border-line bg-paper-2 text-ink-soft",
        kind === "assumed" && "bg-[#f4ead9] text-amber",
        note && "cursor-help",
      )}
    >
      {label}
      {note ? <span className="opacity-60">ⓘ</span> : null}
    </span>
  );
}

/** A number + its provenance tag, laid out together. */
export function Figure({
  value,
  unit,
  prov,
  note,
  size = "lg",
}: {
  value: ReactNode;
  unit?: string;
  prov: Provenance;
  note?: string;
  size?: "sm" | "lg";
}) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className={clsx("font-display leading-none text-ink", size === "lg" ? "text-2xl" : "text-base")}>
        {value}
        {unit ? <span className="ml-1 text-[0.6em] text-muted">{unit}</span> : null}
      </span>
      <ProvTag kind={prov} note={note} />
    </span>
  );
}

export function KeyVal({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft py-2 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className="font-medium text-ink">{v}</span>
    </div>
  );
}
