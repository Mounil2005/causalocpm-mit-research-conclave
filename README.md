# CausalOCPM — A Causal Audit Layer for Agentic AI Decisions

> When AI agents make autonomous decisions, who explains the consequences?

CausalOCPM is a causal-reasoning console for transparent, explainable, and accountable
autonomous business processes. It combines **Object-Centric Process Mining** with
**Structural Causal Models** and **counterfactual reasoning** to reconstruct AI decision
pathways from event logs, discover the true causal drivers of outcomes, estimate their
effects free of confounding, and simulate "what if we had done differently?".

**Live pitch:** Explain · Predict · Simulate.
Shortlisted — AI Innovation Idea Hack, MIT Manipal.

---

## What's in the box

A premium Next.js 15 decision-intelligence console with a 7-view workspace over two
self-contained synthetic scenarios:

| Domain | Tenant | Outcome | Confounder recovered |
| --- | --- | --- | --- |
| **Manufacturing** | Northwind Components Co. | Shipment Delay (days) | Peak-Season Demand inflates supplier correlation ~19% |
| **Healthcare** | Meridian Health System | Discharge Delay (days) | Patient acuity inflates specialist-latency correlation ~15.5% |

_(The old `prihir_synthetic.csv` reference from the original prototype is gone — both
datasets are freshly designed here with planted ground truth.)_

### Views

1. **Overview** — Causal Intelligence Alert band, AI executive summary, discovery-validation badges, top drivers, Traditional-PM-vs-CausalOCPM and competitive-positioning comparisons.
2. **Data & Discovery** — a 6-step guided walkthrough (understand the event data → object interaction network → correlation view → recovered causal structure → validate discovery quality → domain-knowledge contribution), plus a collapsible raw-data preview and OCEL-style sample events.
3. **Model Performance** — AI causal interpretation, naive-vs-Double-ML effect, an interactive **What-If Causal Simulator** with grouped intervention levers → predicted outcome, throughput, risk index, ROI payback, a causal-effect-decomposition waterfall and mediator-variable states; a target-driven recommended action plan; estimated-vs-ground-truth coefficients; CATE treatment-effect heterogeneity by segment.
4. **Case Inspector** — executive interpretation, SHAP attribution waterfall, controllable-vs-structural contribution split, jump-to-highest-risk, percentile, counterfactual, similar cases.
5. **Decision Intelligence** — ranked recommended actions with ROI/capex/timeline, projected-impact trend, a full **Executive Causal Analysis Report** (key findings, primary causal chain, action-plan table, methodology & confidence), action log.
6. **Copilot** — grounded decision-intelligence assistant with capability cards (live Claude when `ANTHROPIC_API_KEY` is set, deterministic grounded fallback otherwise).
7. **Settings** — scenario configuration and pipeline toggles.

---

## The pipeline

```
OCEL 2.0 logs → Object Interaction Graph → Bootstrapped PC (DAG) → Mixed SCM → Double ML → SCM-grounded SHAP
```

The offline builder (`scripts/build-causal-fixtures.ts` + `scripts/lib/domainConfig.ts`)
encodes the **same planted causal structure as the reference CausalOCPM repo**
(`data/generate_data.py`): a confounder (`order_complexity` / `patient_complexity`) driving
both treatment selection and the outcome, plus a mediated true causal path
(`supplier_a → material_lead_time → shipment_delay`, coefficient 7.4 × 0.9 = 6.66 days).
It runs the confounding-vs-recovered-effect logic, CATE by tertile, an E-value / placebo /
random-common-cause sensitivity sweep, and validates the output against a shared Zod
contract (`lib/engine/types.ts`) before writing `lib/data/<domain>.json`. Runs on `prebuild`.

The what-if simulator (`lib/simulator.ts`) is a direct port of the reference's
`patch_simulator.py` causal engine — grouped intervention levers propagate through the
structural equations to a predicted outcome, mediator states, and an effect-decomposition
waterfall.

---

## Run locally

```bash
npm install
npm run gen:data      # regenerate the two validated fixtures (optional; prebuild does this)
npm run dev           # http://localhost:3000
```

Optional — live Copilot:

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY=...
```

---

## Deploy to Vercel

Repo: <https://github.com/Aditya0105singh/CAUSALOCPM-NEW>

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** `Aditya0105singh/CAUSALOCPM-NEW`.
2. Framework is auto-detected as **Next.js** — leave every build setting at its default.
3. (Optional) add `ANTHROPIC_API_KEY` under *Environment Variables* for the live Copilot; without it the Copilot uses grounded scripted answers.
4. **Deploy.** `prebuild` regenerates and Zod-validates the fixtures during the Vercel build.

Or from the CLI (`npm i -g vercel && vercel`).

---

## Tech

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Recharts · Framer Motion · Zod ·
`@anthropic-ai/sdk`. Design language: warm-paper + forest-green editorial, Fraunces display
/ Inter text.
