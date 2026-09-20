"use client";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CausalFixture } from "@/lib/engine/types";

/** Recharts' ResponsiveContainer can measure 0px right after a tab switch. */
function Frame({ height, children }: { height: number; children: React.ReactElement }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div style={{ width: "100%", height }}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

const AXIS = { fontSize: 11, fill: "#8b887b" };
const GRID = "#e2ddcd";
const ANIM = { isAnimationActive: true, animationDuration: 650, animationEasing: "ease-out" as const };

/* ── shared themed tooltip ─────────────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
  fmt,
  unit = "",
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; payload?: Record<string, unknown> }[];
  label?: string | number;
  fmt?: (v: number) => string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(44,46,30,0.12)]">
      {label !== undefined && label !== "" && <div className="mb-1 font-semibold text-ink">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-medium text-ink">
            {fmt ? fmt(p.value) : p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Legend chips that toggle a series on/off. */
function ToggleLegend({
  series,
  hidden,
  onToggle,
}: {
  series: { key: string; label: string; color: string }[];
  hidden: Set<string>;
  onToggle: (k: string) => void;
}) {
  return (
    <div className="mb-1 flex flex-wrap gap-2">
      {series.map((s) => (
        <button
          key={s.key}
          onClick={() => onToggle(s.key)}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
            hidden.has(s.key) ? "border-line bg-paper-2/50 text-muted line-through" : "border-line bg-card text-ink-soft",
          )}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: hidden.has(s.key) ? "#cbc6b6" : s.color }} />
          {s.label}
        </button>
      ))}
    </div>
  );
}

function useToggle() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  return { hidden, toggle };
}

/* ── Effect accuracy — click a bucket to read it ───────────────────────── */
export function EffectAccuracyChart({ data }: { data: CausalFixture["effectAccuracy"] }) {
  const [sel, setSel] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <Frame height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} onClick={(s: any) => setSel(s?.activeTooltipIndex ?? null)}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="bucket" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(79,122,74,0.08)" }} content={<ChartTooltip fmt={(v) => `${v} edge${v === 1 ? "" : "s"}`} />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={46} {...ANIM}>
            {data.map((_, i) => (
              <Cell key={i} fill={sel === i ? "#2c452e" : "#4f7a4a"} cursor="pointer" />
            ))}
          </Bar>
        </BarChart>
      </Frame>
      <p className="mt-1 text-[11px] text-muted">
        {sel === null
          ? `Absolute error of ${total} recovered coefficients vs. their planted values — click a bar.`
          : `${data[sel].count} of ${total} coefficients land in the ${data[sel].bucket} error band.`}
      </p>
    </div>
  );
}

/* ── Estimated vs ground-truth coefficients — hover shows the error ────── */
export function CoefficientChart({ data }: { data: CausalFixture["coefficients"] }) {
  const { hidden, toggle } = useToggle();
  const [sel, setSel] = useState<number | null>(null);
  const rows = data.map((d, i) => ({
    edge: d.edge.replace(/ → .*/, " →"),
    full: d.edge,
    Estimated: d.estimated,
    "Ground truth": d.groundTruth,
    errPct: d.groundTruth ? Math.abs((d.estimated - d.groundTruth) / d.groundTruth) * 100 : 0,
    i,
  }));
  const series = [
    { key: "Estimated", label: "Estimated (Double ML)", color: "#4f7a4a" },
    { key: "Ground truth", label: "Planted ground truth", color: "#c9b79a" },
  ];
  return (
    <div>
      <ToggleLegend series={series} hidden={hidden} onToggle={toggle} />
      <Frame height={Math.max(200, rows.length * 34)}>
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          onMouseMove={(s: any) => setSel(s?.activeTooltipIndex ?? null)}
          onMouseLeave={() => setSel(null)}
        >
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis type="category" dataKey="edge" tick={{ ...AXIS, fontSize: 10 }} width={132} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(79,122,74,0.06)" }}
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(44,46,30,0.12)]">
                  <div className="mb-1 font-semibold text-ink">{payload[0].payload.full}</div>
                  <div className="text-ink-soft">Estimated <b className="text-ink">{payload[0].payload.Estimated}</b></div>
                  <div className="text-ink-soft">Planted <b className="text-ink">{payload[0].payload["Ground truth"]}</b></div>
                  <div className="mt-0.5 text-forest">error {payload[0].payload.errPct.toFixed(1)}%</div>
                </div>
              ) : null
            }
          />
          {!hidden.has("Estimated") && (
            <Bar dataKey="Estimated" radius={[0, 3, 3, 0]} maxBarSize={9} {...ANIM}>
              {rows.map((r) => (
                <Cell key={r.i} fill={sel === r.i ? "#2c452e" : "#4f7a4a"} />
              ))}
            </Bar>
          )}
          {!hidden.has("Ground truth") && <Bar dataKey="Ground truth" fill="#c9b79a" radius={[0, 3, 3, 0]} maxBarSize={9} {...ANIM} />}
        </BarChart>
      </Frame>
      <p className="mt-1 text-[11px] text-muted">
        {sel !== null ? (
          <>Hovering <b className="text-ink-soft">{rows[sel].full}</b> — {rows[sel].errPct.toFixed(1)}% off the planted coefficient.</>
        ) : (
          <>Average absolute error {(rows.reduce((s, r) => s + r.errPct, 0) / rows.length).toFixed(1)}% · hover a row for detail.</>
        )}
      </p>
    </div>
  );
}

/* ── CATE — click a segment ───────────────────────────────────────────── */
export function CateChart({ segments, ate }: { segments: CausalFixture["cate"]["segments"]; ate: number }) {
  const [sel, setSel] = useState<number | null>(null);
  const rows = segments.map((s) => ({
    label: s.label,
    effect: s.effect,
    ciLow: s.ciLow,
    ciHigh: s.ciHigh,
    err: [s.effect - s.ciLow, s.ciHigh - s.effect] as [number, number],
  }));
  return (
    <div>
      <Frame height={220}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} onClick={(s: any) => setSel((p) => (p === s?.activeTooltipIndex ? null : s?.activeTooltipIndex ?? null))}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(79,122,74,0.06)" }}
            content={({ active, payload, label }: any) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(44,46,30,0.12)]">
                  <div className="mb-1 font-semibold text-ink">{label}</div>
                  <div className="text-ink-soft">effect <b className="text-ink">{payload[0].payload.effect}</b></div>
                  <div className="text-muted">95% CI [{payload[0].payload.ciLow}, {payload[0].payload.ciHigh}]</div>
                </div>
              ) : null
            }
          />
          <ReferenceLine y={ate} stroke="#b9762f" strokeDasharray="4 4" label={{ value: `ATE ${ate}`, fontSize: 10, fill: "#b9762f" }} />
          <Bar dataKey="effect" radius={[3, 3, 0, 0]} maxBarSize={54} {...ANIM}>
            {rows.map((r, i) => (
              <Cell key={i} fill={sel === i ? "#2c452e" : r.effect > ate ? "#3d5a3d" : "#9bb08a"} cursor="pointer" />
            ))}
            <ErrorBar dataKey="err" width={4} strokeWidth={1.5} stroke="#55534a" />
          </Bar>
        </BarChart>
      </Frame>
      {sel !== null && (
        <p className="mt-1 text-[11px] text-forest">
          {rows[sel].label}: treatment effect {rows[sel].effect} {rows[sel].effect > ate ? "above" : "below"} the average
          — {((rows[sel].effect / ate - 1) * 100).toFixed(0)}% vs ATE.
        </p>
      )}
    </div>
  );
}

/* ── Sensitivity sweep — legend toggle + active dots ──────────────────── */
export function SensitivitySweepChart({
  strengths,
  estimates,
  reported,
}: {
  strengths: number[];
  estimates: number[];
  reported: number;
}) {
  const rows = strengths.map((s, i) => ({ label: `${Math.round(s * 100)}%`, estimate: estimates[i], reported }));
  const nullifyAt = useMemo(() => {
    const idx = estimates.findIndex((e) => e <= reported * 0.5);
    return idx >= 0 ? `${Math.round(strengths[idx] * 100)}%` : null;
  }, [estimates, strengths, reported]);
  return (
    <div>
      <Frame height={220}>
        <LineChart data={rows} margin={{ top: 8, right: 14, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, "dataMax + 1"]} />
          <Tooltip content={<ChartTooltip fmt={(v) => v.toFixed(2)} unit=" d" />} />
          <ReferenceLine y={reported} stroke="#3d5a3d" strokeDasharray="4 4" label={{ value: `reported ${reported}`, fontSize: 10, fill: "#3d5a3d", position: "insideTopRight" }} />
          <Line type="monotone" dataKey="estimate" stroke="#b9762f" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Estimate under assumed confounding" {...ANIM} />
        </LineChart>
      </Frame>
      <p className="mt-1 text-[11px] text-muted">
        {nullifyAt
          ? `The estimate only drops below half its value once assumed confounding reaches ${nullifyAt}.`
          : "The estimate stays materially positive across the whole sweep."}
      </p>
    </div>
  );
}

/* ── Projected impact trend — legend toggle ───────────────────────────── */
export function ImpactTrendChart({ data }: { data: CausalFixture["projectedImpact"]["trend"] }) {
  const { hidden, toggle } = useToggle();
  const series = [
    { key: "baseline", label: "Baseline trajectory", color: "#b9762f" },
    { key: "withActions", label: "With recommended actions", color: "#3d5a3d" },
  ];
  return (
    <div>
      <ToggleLegend series={series} hidden={hidden} onToggle={toggle} />
      <Frame height={210}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip content={<ChartTooltip fmt={(v) => v.toFixed(2)} unit=" d" />} />
          {!hidden.has("baseline") && <Line type="monotone" dataKey="baseline" stroke="#b9762f" strokeWidth={2} dot={false} activeDot={{ r: 5 }} name="Baseline" {...ANIM} />}
          {!hidden.has("withActions") && <Line type="monotone" dataKey="withActions" stroke="#3d5a3d" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="With actions" {...ANIM} />}
        </LineChart>
      </Frame>
    </div>
  );
}
