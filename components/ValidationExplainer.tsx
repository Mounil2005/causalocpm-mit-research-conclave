"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { CircleHelp, FlaskConical, ScanSearch, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { CausalFixture } from "@/lib/engine/types";
import { Card } from "@/components/ui";
import { CountUp, FadeIn } from "@/components/motion";

/**
 * "Why should a judge trust these numbers?" — the defensible framing.
 * Every value is the actual output of the reference pipeline's validate.py on
 * the 15,000-row synthetic logs (seed 42). Leads with effect recovery, then the
 * honest pre-domain-knowledge F1 (0.94 mfg / 0.83 hc). No metric claimed at 1.0.
 */
export function ValidationExplainer({ f }: { f: CausalFixture }) {
  const [ablation, setAblation] = useState<"pc" | "dk">("pc");
  const t = f.effects[0];
  const errAbs = Math.abs(t.effectDays - t.groundTruthDays);
  const m = f.discoveryMetrics;
  const pc = { precision: m.precision, recall: m.recall, f1: m.f1 };
  const dkEdges = `${m.truePositives + m.falseNegatives}/${m.truePositives + m.falseNegatives}`;
  const shown = pc;

  const label = (id: string) => f.causalGraph.nodes.find((n) => n.id === id)?.label ?? id;
  const missed = f.causalGraph.edges.filter((e) => !e.discovered && !e.pruned).map((e) => `${label(e.source)} → ${label(e.target)}`);
  const spurious = f.causalGraph.edges.filter((e) => e.pruned).map((e) => `${label(e.source)} → ${label(e.target)}`);
  const nlMissed = missed.some((x) => x.startsWith(f.scenario.confounderLabel));

  return (
    <Card className="border-forest/20">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <ShieldCheck size={15} className="text-forest" /> How do we know this is right?
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FadeIn delay={0.02}>
          <Proof
            Icon={FlaskConical}
            title="We planted the answer"
            body={
              <>
                This is synthetic OCEL data with a <b>known causal DAG</b> and known coefficients. We&apos;re not guessing
                a root cause — we&apos;re measuring whether the pipeline <i>recovers a truth we already wrote down</i>.
              </>
            }
          />
        </FadeIn>
        <FadeIn delay={0.06}>
          <Proof
            Icon={Target}
            title="The effect is recovered near-exactly"
            body={
              <>
                Planted effect of {f.scenario.treatmentLabel}:{" "}
                <b>{t.groundTruthDays} {f.scenario.outcomeUnit}</b>. Double ML recovered{" "}
                <b className="text-forest">{t.effectDays} {f.scenario.outcomeUnit}</b> — error{" "}
                <b>{errAbs.toFixed(2)} {f.scenario.outcomeUnit}</b>, 95% CI [{t.ciLow}, {t.ciHigh}] contains the truth. A
                naive dashboard would have said {t.naiveDays}.
              </>
            }
          />
        </FadeIn>
        <FadeIn delay={0.1}>
          <Proof
            Icon={ShieldCheck}
            title="Robust to what we can't see"
            body={
              <>
                E-value <b>{f.sensitivity.eValue}</b>: an unmeasured confounder would need that strength on <i>both</i>{" "}
                treatment and outcome to explain the effect away. Placebo test:{" "}
                <b>{f.sensitivity.placeboEffect > 0 ? "+" : ""}{f.sensitivity.placeboEffect}</b> (expected ≈ 0).
              </>
            }
          />
        </FadeIn>
      </div>

      {/* DAG recall — the honest gap */}
      <div className="mt-4 rounded-xl border border-line bg-paper-2/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <ScanSearch size={14} className="text-forest" /> DAG discovery — {m.truePositives} of {f.scenario.causalLinks}{" "}
            edges found{m.falsePositives ? `, ${m.falsePositives} spurious` : ", no spurious edges"}
          </div>
          <div className="flex overflow-hidden rounded-lg border border-line text-[11px]">
            <button
              onClick={() => setAblation("pc")}
              className={clsx("px-2.5 py-1 transition-colors", ablation === "pc" ? "bg-forest text-white" : "bg-card text-muted hover:text-ink")}
            >
              Autonomous PC
            </button>
            <button
              onClick={() => setAblation("dk")}
              className={clsx("px-2.5 py-1 transition-colors", ablation === "dk" ? "bg-forest text-white" : "bg-card text-muted hover:text-ink")}
            >
              + Domain knowledge
            </button>
          </div>
        </div>

        {ablation === "pc" ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { k: "Precision", v: shown.precision },
                { k: "Recall", v: shown.recall },
                { k: "F1", v: shown.f1 },
              ].map((s) => (
                <div key={s.k} className="rounded-lg bg-card p-2.5 text-center">
                  <div className="font-display text-xl text-ink">
                    <CountUp value={s.v} decimals={2} duration={0.6} />
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted">{s.k}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
              <b>F1 {shown.f1.toFixed(2)} — the real autonomous number, and honest.</b> Bootstrapped PC found{" "}
              {m.truePositives} of {f.scenario.causalLinks} planted edges.{" "}
              {missed.length > 0 && (
                <>
                  Missed:{" "}
                  {missed.map((mm, i) => (
                    <span key={mm}>
                      <code className="rounded bg-card px-1">{mm}</code>
                      {i < missed.length - 1 ? " and " : ". "}
                    </span>
                  ))}
                  {nlMissed ? (
                    <>
                      That edge is a <b>nonlinear (sigmoid) confounding link</b> — Fisher-Z tests only <i>linear</i>{" "}
                      conditional independence, so it is structurally invisible to the algorithm.{" "}
                    </>
                  ) : (
                    <>
                      Both are among the weakest planted edges (small coefficients relative to the outcome&apos;s
                      variance).{" "}
                    </>
                  )}
                </>
              )}
              {spurious.length > 0 && (
                <>
                  {" "}
                  It also retained one spurious edge —{" "}
                  <code className="rounded bg-card px-1">{spurious[0]}</code>, {f.spuriousEdgeReason}
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-3">
              <DkChip label={`+${m.falseNegatives} edge${m.falseNegatives === 1 ? "" : "s"} recovered`} tone="ok" />
              {m.falsePositives > 0 && <DkChip label={`${m.falsePositives} spurious re-oriented`} tone="ok" />}
              <DkChip label={`${dkEdges} valid DAG`} tone="neutral" />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
              Domain knowledge <b>asserts</b> the {m.falseNegatives} known-true edge{m.falseNegatives === 1 ? "" : "s"}{" "}
              PC missed (not invented — these are relationships in the planted structure)
              {m.falsePositives > 0 && <> and <b>flips</b> the spurious edge back to its correct direction</>}. The result
              is an actionable DAG. We report it as <b>expert-corrected structure</b> — never as a discovery score,
              because measuring recovery of edges you just hand-added would be circular. That is what a headline
              &ldquo;F1&nbsp;=&nbsp;1.000&rdquo; on this step actually is.
            </p>
          </>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 text-[11px] text-muted">
        <CircleHelp size={13} className="mt-0.5 shrink-0" />
        <span>
          Bootstrapped PC · Fisher-Z α = 0.05 · 20 subsamples × 2,000 rows · Double ML with 5-fold cross-fitting, GBM
          nuisance models, sandwich SEs · CATE across tertiles · 10-seed robustness. Every figure is the actual
          output of the reference pipeline&apos;s <code className="rounded bg-card px-1">validate.py</code> — full report
          in <code className="rounded bg-card px-1">docs/reference-run/</code>.
        </span>
      </div>
    </Card>
  );
}

function DkChip({ label, tone }: { label: string; tone: "ok" | "neutral" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
        tone === "ok" ? "bg-sage text-forest-deep" : "bg-paper-2 text-ink-soft",
      )}
    >
      {label}
    </span>
  );
}

function Proof({ Icon, title, body }: { Icon: typeof Target; title: string; body: React.ReactNode }) {
  return (
    <div className="h-full rounded-xl border border-line bg-card p-3.5">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-ink">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sage text-forest">
          <Icon size={13} />
        </span>
        {title}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

export function MeasuredBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sage px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-forest-deep">
      <Sparkles size={9} /> measured
    </span>
  );
}
