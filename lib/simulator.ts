import type { CausalFixture } from "./engine/types";

export type LeverValues = Record<string, number>;

export interface SimResult {
  baseline: number;
  predicted: number;
  improvementPct: number;
  throughput: number;
  riskIndex: number;
  implCost: number;
  annualSavings: number;
  roiMonths: number | null;
  ciLow: number;
  ciHigh: number;
  deltas: { label: string; value: number }[];
  mediators: { name: string; baseline: number; predicted: number; unit: string }[];
  activeCount: number;
}

export function defaultLeverValues(f: CausalFixture): LeverValues {
  return Object.fromEntries(f.simulator.levers.map((l) => [l.id, l.baseline]));
}

/** Each lever set to whichever setting reduces the outcome most — the best achievable combination. */
export function maxImpactValues(f: CausalFixture): LeverValues {
  const out = defaultLeverValues(f);
  for (const l of f.simulator.levers) {
    const candidates =
      l.kind === "toggle" ? [0, 1] : l.kind === "mode" ? [l.min, l.max] : [l.min, l.max, l.baseline];
    let best = l.baseline;
    let bestPred = Infinity;
    for (const c of candidates) {
      const pred = simulate(f, { ...out, [l.id]: c }).predicted;
      if (pred < bestPred) {
        bestPred = pred;
        best = c;
      }
    }
    out[l.id] = best;
  }
  return out;
}

export function simulate(f: CausalFixture, v: LeverValues): SimResult {
  return f.domain === "manufacturing" ? computeMfg(f, v) : computeHc(f, v);
}

/* ── Manufacturing — ported from the reference patch_simulator._compute_mfg ── */
function computeMfg(f: CausalFixture, v: LeverValues): SimResult {
  const g = (k: string, d = 0) => (v[k] ?? d);
  const C_sup_mlt = 7.0, C_mlt_del = 0.9, C_mql_apd = 0.7, C_apd_del = 0.3;
  const BL_DEL = f.simulator.baselineOutcome, BL_MLT = 7.2, BL_MQL = 3.1, BL_APD = 2.4;
  const SUP_BASE = 0.6, CAR_BASE = 15;

  const supB = g("supplier_reliability_pct", 40);
  const sup_a = 1 - supB / 100;
  const ltMode = Math.round(g("material_lead_time_mode", 0));
  const mlt_factor = [1.0, 0.8, 0.6][ltMode] ?? 1.0;
  const mlt_pre = BL_MLT + C_sup_mlt * (sup_a - SUP_BASE);
  const mlt_val = mlt_pre * mlt_factor;

  const wf = g("additional_workforce", 0);
  const capExpanded = g("machine_capacity_expanded", 0) >= 1;
  const mql_val = Math.max(0, BL_MQL - 0.3 * wf + (capExpanded ? -1.2 : 0));

  const exportFlag = g("export_flag_reduction", 0) >= 1;
  const approvalAuto = g("approval_automation", 0) >= 1;
  const exp_eff = exportFlag ? -0.35 * BL_APD : 0;
  const auto_eff = approvalAuto ? -0.5 * BL_APD : 0;
  const q_eff = C_mql_apd * (mql_val - BL_MQL);
  const apd_val = Math.max(0, BL_APD + exp_eff + auto_eff + q_eff);

  const batching = g("order_batching", 0) >= 1;
  const carrierPct = g("carrier_express_pct", 15);

  const d_sup = C_mlt_del * C_sup_mlt * (sup_a - SUP_BASE);
  const d_ltmode = C_mlt_del * mlt_pre * (mlt_factor - 1);
  const d_machine = C_apd_del * q_eff;
  const d_appr = C_apd_del * (exp_eff + auto_eff);
  const d_carrier = -0.008 * (carrierPct - CAR_BASE);
  const d_batch = batching ? -0.2 : 0;

  const predicted = Math.max(0.5, BL_DEL + d_sup + d_ltmode + d_machine + d_appr + d_carrier + d_batch);
  const improvementPct = ((BL_DEL - predicted) / BL_DEL) * 100;
  // faster shipments + a shorter machine queue both lift daily throughput
  const throughput = Math.min(160, Math.max(60, 100 * (1 + 0.45 * (improvementPct / 100) + 0.12 * (1 - mql_val / BL_MQL))));
  const riskIndex = 45 * (predicted / BL_DEL);

  const implCost =
    (capExpanded ? 50000 : 0) +
    (approvalAuto ? 30000 : 0) +
    wf * 5000 +
    Math.max(0, carrierPct - CAR_BASE) * 200 +
    (batching ? 20000 : 0) +
    (exportFlag ? 15000 : 0);
  const annualSavings = (improvementPct / 100) * BL_DEL * f.simulator.costPerDelayDay * f.simulator.annualVolume;
  const roiMonths = annualSavings > 0 && implCost > 0 ? implCost / (annualSavings / 12) : implCost === 0 && annualSavings > 0 ? 0 : null;

  return finalize(f, v, {
    baseline: BL_DEL,
    predicted,
    improvementPct,
    throughput,
    riskIndex,
    implCost,
    annualSavings,
    roiMonths,
    ciLow: predicted * 0.88,
    ciHigh: predicted * 1.12,
    deltas: [
      { label: "Supplier Change", value: d_sup },
      { label: "Lead-Time Mode", value: d_ltmode },
      { label: "Machine & Workforce", value: d_machine },
      { label: "Approval Actions", value: d_appr },
      { label: "Express Carrier", value: d_carrier },
      { label: "Order Batching", value: d_batch },
    ],
    mediators: [
      { name: "Material Lead Time", baseline: BL_MLT, predicted: mlt_val, unit: "days" },
      { name: "Machine Queue Length", baseline: BL_MQL, predicted: mql_val, unit: "units" },
      { name: "Approval Duration", baseline: BL_APD, predicted: apd_val, unit: "days" },
    ],
  });
}

/* ── Healthcare — adapted from _compute_hc, baseline = LOS ── */
function computeHc(f: CausalFixture, v: LeverValues): SimResult {
  const g = (k: string, d = 0) => (v[k] ?? d);
  const BL = f.simulator.baselineOutcome, BL_BED = 78, BL_SPEC = 0.45, BL_TD = 7.6, FAST_BASE = 20;

  const specPct = g("specialist_allocation_pct", 45);
  const spec_prob = specPct / 100;
  const diagMode = Math.round(g("diagnostic_speed_mode", 0));
  const diag_factor = [1.0, 0.8, 0.65][diagMode] ?? 1.0;

  const bedExpanded = g("bed_capacity_expanded", 0) >= 1;
  const nurses = g("additional_nursing_staff", 0);
  const triageAuto = g("triage_automation", 0) >= 1;
  const fastPct = g("fast_track_eligibility_pct", 20);

  const bed_eff = bedExpanded ? -0.4 : 0;
  const nurse_eff = -0.15 * nurses;
  const triage_eff = triageAuto ? -0.3 : 0;
  const fast_eff = -0.025 * (fastPct - FAST_BASE);

  const d_spec = 1.8 * (spec_prob - BL_SPEC);
  const d_diag = BL * 0.5 * (diag_factor - 1);
  const d_bed = 0.4 * bed_eff;
  const d_nursing = 0.4 * nurse_eff;
  const d_triage = triage_eff;
  const d_fast = fast_eff;

  const predicted = Math.max(0.5, BL + d_spec + d_diag + d_bed + d_nursing + d_triage + d_fast);
  const improvementPct = ((BL - predicted) / BL) * 100;
  const bedOcc = BL_BED * (1 + bed_eff / 100);
  const tdPred = BL_TD * diag_factor + 6.2 * (spec_prob - BL_SPEC);

  const implCost = (bedExpanded ? 40000 : 0) + (triageAuto ? 25000 : 0) + nurses * 4500;
  const annualSavings = (improvementPct / 100) * BL * f.simulator.costPerDelayDay * f.simulator.annualVolume;
  const roiMonths = annualSavings > 0 && implCost > 0 ? implCost / (annualSavings / 12) : implCost === 0 && annualSavings > 0 ? 0 : null;

  return finalize(f, v, {
    baseline: BL,
    predicted,
    improvementPct,
    // shorter stays free up beds → higher daily patient throughput
    throughput: Math.min(160, Math.max(60, 100 * (1 + 0.5 * (improvementPct / 100) - d_bed * 0.3))),
    riskIndex: 45 * (predicted / BL),
    implCost,
    annualSavings,
    roiMonths,
    ciLow: predicted * 0.88,
    ciHigh: predicted * 1.12,
    deltas: [
      { label: "Specialist Allocation", value: d_spec },
      { label: "Diagnostic Speed", value: d_diag },
      { label: "Bed Capacity", value: d_bed },
      { label: "Nursing Staff", value: d_nursing },
      { label: "Triage Automation", value: d_triage },
      { label: "Fast Track", value: d_fast },
    ],
    mediators: [
      { name: "Treatment Duration", baseline: BL_TD, predicted: tdPred, unit: "days" },
      { name: "Bed Occupancy", baseline: BL_BED, predicted: bedOcc, unit: "%" },
      { name: "Specialist Assigned", baseline: BL_SPEC * 100, predicted: spec_prob * 100, unit: "%" },
    ],
  });
}

function finalize(f: CausalFixture, v: LeverValues, r: Omit<SimResult, "activeCount">): SimResult {
  const activeCount = f.simulator.levers.filter((l) => (v[l.id] ?? l.baseline) !== l.baseline).length;
  const clean = (x: number) => Math.round(x * 100) / 100;
  return {
    ...r,
    predicted: clean(r.predicted),
    improvementPct: clean(r.improvementPct),
    throughput: Math.round(r.throughput),
    riskIndex: clean(r.riskIndex),
    implCost: Math.round(r.implCost),
    annualSavings: Math.round(r.annualSavings),
    roiMonths: r.roiMonths === null ? null : clean(r.roiMonths),
    ciLow: clean(r.ciLow),
    ciHigh: clean(r.ciHigh),
    deltas: r.deltas.map((d) => ({ label: d.label, value: clean(d.value) })).filter((d) => Math.abs(d.value) > 0.001),
    mediators: r.mediators.map((m) => ({ ...m, baseline: clean(m.baseline), predicted: clean(m.predicted) })),
    activeCount,
  };
}

/* ── Cheapest lever combination that reaches a target % reduction ── */
export function recommendPlan(f: CausalFixture, targetPct: number) {
  const baseline = f.simulator.baselineOutcome;
  // greedy over single-lever max effects
  const options = f.simulator.levers.map((l) => {
    const test = defaultLeverValues(f);
    if (l.kind === "toggle") test[l.id] = 1;
    else if (l.kind === "mode") test[l.id] = l.max;
    else test[l.id] = l.baseline > (l.max + l.min) / 2 ? l.min : l.max;
    const res = simulate(f, test);
    const cost = res.implCost || (l.kind === "toggle" ? 25000 : 15000);
    return { lever: l, value: test[l.id], gain: baseline - res.predicted, cost };
  });
  options.sort((a, b) => b.gain / b.cost - a.gain / a.cost);

  const chosen: { id: string; label: string; setting: string; value: number }[] = [];
  const applied = defaultLeverValues(f);
  const targetDays = (baseline * targetPct) / 100;
  for (const o of options) {
    const cur = simulate(f, applied);
    if (baseline - cur.predicted >= targetDays) break;
    applied[o.lever.id] = o.value;
    chosen.push({
      id: o.lever.id,
      label: o.lever.label,
      setting:
        o.lever.kind === "toggle"
          ? "Enabled"
          : o.lever.kind === "mode"
            ? o.lever.modes?.[o.value] ?? String(o.value)
            : `${o.value}${o.lever.unit}`,
      value: o.value,
    });
  }
  const res = simulate(f, applied);
  return {
    reachable: baseline - res.predicted >= targetDays - 0.05,
    predicted: res.predicted,
    reductionPct: Math.round(res.improvementPct),
    implCost: res.implCost,
    annualSavings: res.annualSavings,
    paybackMonths: res.roiMonths, // number | null (0 = no capex)
    levers: chosen,
    values: applied,
  };
}
