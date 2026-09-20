import type { CausalFixture } from "./engine/types";
import { DOMAINS } from "@/scripts/lib/domainConfig";

/** Compact factual context handed to Claude (or used to build scripted replies). */
export function buildContext(f: CausalFixture): string {
  const t = f.effects[0];
  return [
    `Scenario: ${f.scenario.org} — ${f.scenario.name} (${f.scenario.timeRange}).`,
    `Outcome: ${f.scenario.outcomeVariable} in ${f.scenario.outcomeUnit}. Treatment: ${f.scenario.treatmentLabel}. Confounder: ${f.scenario.confounderLabel}.`,
    `${f.scenario.totalEvents.toLocaleString()} events across ${f.scenario.objectTypes} object types (${f.scenario.objectNames.join(", ")}); ${f.scenario.treatedPct}% treated.`,
    `Primary causal chain: ${f.report.primaryChain.join(" -> ")}.`,
    `Discovery: precision ${f.discoveryMetrics.precision}, recall ${f.discoveryMetrics.recall}, F1 ${f.discoveryMetrics.f1}; bootstrapped PC 20 x 2000 rows @ 60% stability; ${f.discoveryMetrics.falseNegatives} nonlinear edge recovered by domain knowledge.`,
    `Naive vs causal: naive group-mean ${f.naiveEffect.naiveDays} ${f.scenario.outcomeUnit}; Double ML ${f.naiveEffect.causalDays} (95% CI ${f.naiveEffect.ciLow}-${f.naiveEffect.ciHigh}); confounding bias removed ${f.naiveEffect.biasDays}. Planted ground truth ${t.groundTruthDays}.`,
    `Structural coefficients: ${f.coefficients.map((c) => `${c.edge} est ${c.estimated} (planted ${c.groundTruth})`).join("; ")}.`,
    `CATE by ${f.cate.segmentVar}: ${f.cate.segments.map((s) => `${s.label} ${s.effect}`).join(", ")} (ATE ${f.cate.ate}).`,
    `Sensitivity: placebo effect ${f.sensitivity.placeboEffect} (expect ~0), E-value ${f.sensitivity.eValue}. ${f.sensitivity.verdict}`,
    `Recommended actions: ${f.recommendedActions
      .map((a) => `${a.title} (-${a.reductionPct}%, ~$${Math.round(a.annualSavings / 1000)}K/yr, ${a.capex ? `$${Math.round(a.capex / 1000)}K capex` : "no capex"}, ${a.confidence} confidence)`)
      .join("; ")}. Blended payback ${f.report.roiPayback}.`,
    `Simulator baseline ${f.simulator.baselineOutcome} ${f.scenario.outcomeUnit}; achievable reduction ${f.report.achievableReductionPct}% to ${f.report.targetDays}.`,
  ].join("\n");
}

export function systemPrompt(f: CausalFixture): string {
  return `You are the CausalOCPM Decision Intelligence Copilot embedded in a causal process-mining console. You ONLY discuss THIS project: its causal graph, structural equations, Double ML effect estimates, sensitivity analysis, and what-if simulation results, all given below.

Rules:
- Answer the SPECIFIC question. A bottleneck question -> the causal graph + coefficients. A what-if/simulation question -> the simulator numbers. An ROI question -> savings/payback. A causal-chain question -> the edge path. Two different questions must produce genuinely different answers.
- Be concise (2-5 sentences), quantitative, and always distinguish causation from correlation.
- If the question is outside this project's scope, say so briefly.

GROUNDED FACTS
${buildContext(f)}`;
}

const CHIP_KEYWORDS: { key: string; re: RegExp }[] = [
  { key: "bottleneck", re: /bottleneck|constraint|binding/ },
  { key: "intervention", re: /best (intervention|action)|what should|recommend|fix|do about/ },
  { key: "roi", re: /roi|payback|savings|worth|cost/ },
  { key: "suppliers", re: /compare (suppliers?|specialist)|supplier [ab]|specialist vs/ },
  { key: "chain", re: /causal chain|pathway|how does .* lead|mediator/ },
  { key: "impact", re: /predict impact|what if|simulat|scenario/ },
  { key: "executive", re: /executive summary|summar/ },
  { key: "delays", re: /why (are|is).*(increas|rising|worse|delay|los|length of stay)/ },
];

export function detectChipKey(q: string): string {
  const s = q.toLowerCase();
  for (const c of CHIP_KEYWORDS) if (c.re.test(s)) return c.key;
  return "custom";
}

/** Offline fallback — keyword-routed answers derived from the fixture + domain seed. */
export function groundedAnswer(f: CausalFixture, question: string): string {
  const seed = DOMAINS[f.domain].copilotSeed;
  const q = question.toLowerCase();
  // exact / near-exact seed match first
  const direct = seed.find((s) => overlap(s.q.toLowerCase(), q) >= 2 || s.q.toLowerCase() === q);
  if (direct) return direct.a;

  const key = detectChipKey(question);
  const byKey: Record<string, string> = {
    bottleneck: seed[1].a,
    intervention: seed[2].a,
    chain: seed[3].a,
    suppliers: seed[4].a,
    impact: seed[5].a,
    roi: seed[6].a,
    executive: seed[7].a,
    delays: seed[0].a,
  };
  if (byKey[key]) return byKey[key];

  if (/(confound|bias|correlat|spurious|adjust|double ml|dml)/.test(q)) {
    const t = f.effects[0];
    return `The raw group-mean difference is ${f.naiveEffect.naiveDays} ${f.scenario.outcomeUnit}, but ${f.naiveEffect.biasDays} of that is confounding from ${f.scenario.confounderLabel}. After Double ML backdoor adjustment (5-fold cross-fitting, GBM nuisance models), the true causal effect is ${f.naiveEffect.causalDays} ${f.scenario.outcomeUnit} — matching the planted ground truth of ${t.groundTruthDays}.`;
  }
  if (/(counterfactual|had we|instead)/.test(q)) {
    const c = [...f.cases].sort((a, b) => b.actualDelayDays - a.actualDelayDays)[0];
    return `Take the highest-risk case ${c.id}: actual ${c.actualDelayDays} ${f.scenario.outcomeUnit}. ${c.counterfactualLabel} → estimated ${c.counterfactualDelayDays} ${f.scenario.outcomeUnit}, a reduction of ${(c.actualDelayDays - c.counterfactualDelayDays).toFixed(1)}.`;
  }
  if (/(precision|recall|f1|reliab|trust|valid|robust|e-?value|sensitiv)/.test(q)) {
    const m = f.discoveryMetrics;
    return `DAG recovery: precision ${m.precision}, recall ${m.recall}, F1 ${m.f1} across ${m.bootstrapRuns} bootstrap reruns. Sensitivity: placebo effect ${f.sensitivity.placeboEffect} (expected ~0), E-value ${f.sensitivity.eValue}. ${f.sensitivity.verdict}`;
  }
  return `${f.executiveSummary.headline} ${f.executiveSummary.bullets[0]}.`;
}

function overlap(a: string, b: string): number {
  const wa = new Set(a.split(/\W+/).filter((w) => w.length > 3));
  return [...wa].filter((w) => b.includes(w)).length;
}
