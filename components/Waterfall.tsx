"use client";
import { useState } from "react";
import { clsx } from "clsx";

/** Interactive HTML waterfall — SHAP attribution & causal-effect decomposition. */
export function Waterfall({
  start,
  steps,
  end,
  unit,
  height = 220,
}: {
  start: { label: string; value: number };
  steps: { label: string; value: number }[];
  end: { label: string; value: number };
  unit: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  let cursor = start.value;
  const cols = [
    { label: start.label, from: 0, to: start.value, delta: start.value, kind: "total" as const, running: start.value },
    ...steps.map((s) => {
      const from = cursor;
      const to = cursor + s.value;
      cursor = to;
      return { label: s.label, from, to, delta: s.value, kind: "delta" as const, running: to };
    }),
    { label: end.label, from: 0, to: end.value, delta: end.value, kind: "total" as const, running: end.value },
  ];
  const max = Math.max(...cols.flatMap((c) => [c.from, c.to])) * 1.12 || 1;
  const pxFor = (v: number) => (v / max) * (height - 34);

  return (
    <div>
      <div className="relative flex items-end gap-1.5" style={{ height }}>
        {cols.map((c, i) => {
          const bottom = pxFor(Math.min(c.from, c.to));
          const barH = Math.max(3, pxFor(Math.abs(c.to - c.from)));
          const color =
            c.kind === "total"
              ? i === 0
                ? "bg-muted"
                : "bg-forest-deep"
              : c.delta > 0
                ? "bg-amber"
                : "bg-forest-bright";
          return (
            <div
              key={i}
              className="group relative flex min-w-0 flex-1 cursor-pointer flex-col items-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="relative w-full flex-1">
                <div
                  className={clsx(
                    "absolute left-1/2 w-[70%] -translate-x-1/2 rounded-sm transition-all duration-200",
                    color,
                    hover === i ? "brightness-90 ring-2 ring-forest/25" : hover !== null ? "opacity-55" : "",
                  )}
                  style={{ bottom, height: barH }}
                />
                {i > 0 && (
                  <div
                    className="absolute h-px bg-line"
                    style={{ bottom: pxFor(cols[i - 1].to), left: "-6px", right: "70%" }}
                  />
                )}
                <div
                  className="absolute left-0 w-full text-center text-[10px] font-semibold text-ink-soft"
                  style={{ bottom: bottom + barH + 2 }}
                >
                  {c.kind === "delta" ? (c.delta > 0 ? "+" : "") : ""}
                  {(c.kind === "delta" ? c.delta : c.to).toFixed(1)}
                </div>
              </div>
              <div className="mt-1 h-8 w-full text-center text-[9px] leading-tight text-muted">{c.label}</div>

              {hover === i && (
                <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11px] shadow-[0_6px_20px_rgba(44,46,30,0.12)]">
                  <div className="font-semibold text-ink">{c.label}</div>
                  {c.kind === "delta" ? (
                    <>
                      <div className={c.delta > 0 ? "text-amber" : "text-forest"}>
                        {c.delta > 0 ? "+" : ""}
                        {c.delta.toFixed(2)} {unit}
                      </div>
                      <div className="text-muted">running total {c.running.toFixed(2)} {unit}</div>
                    </>
                  ) : (
                    <div className="text-ink-soft">{c.to.toFixed(2)} {unit}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-right text-[10px] text-muted">{unit} · hover a bar for detail</div>
    </div>
  );
}
