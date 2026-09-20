# Reference-run evidence

Every number in the console and the executive report is the actual output of the
reference pipeline (`Aditya0105singh/CAUSALOCPM`, `src/phase1–5` + `validate.py`)
run on the two planted-ground-truth synthetic logs. Captured **2026-09-01**.

## Files
| File | What it is |
|---|---|
| `validate-report.txt` | Full `python validate.py` output — 25/26 checks pass (the 1 "fail" is the CATE-all-positive sanity check: the low-complexity tertile effect is a hair negative, which is realistic) |
| `discovery-ablation.txt` | Autonomous-PC-only vs +domain-knowledge discovery metrics for both domains |
| `prihir_synthetic.csv.gz` | The generated 15,000-row manufacturing log (seed 42) |
| `hospital_synthetic.csv.gz` | The generated 15,000-row healthcare log (seed 42) |

## Headline numbers baked into the fixtures

### Manufacturing — Supplier A → shipment delay (planted effect 7.4 × 0.9 = 6.66)
| | Value |
|---|---|
| Naive group-mean difference | **8.782** days |
| Double ML estimate | **6.649** days · 95% CI [6.591, 6.708] · error **0.2%** |
| Confounding removed | 2.133 days (24.3% of naive, 31.9% above true) |
| Autonomous discovery | precision 1.00 · recall 0.889 · **F1 0.941** · 0 spurious |
| + domain knowledge | 9/9 valid DAG |
| Bootstrap edge stability | 86% (20 subsamples × 2,000 rows) |
| Outcome model CV-R² | 0.962 · linear coefficients within 0.3–0.8% of planted |
| 10-seed robustness | causal 6.61 ± 0.089, range [6.43, 6.78]; naive [8.71, 8.90] |
| Placebo (permuted treatment) | +0.02 ≈ 0 |
| CATE by order complexity | Low −0.03 · Mid +0.01 · High +0.15 (binary effect within tertile) |

### Healthcare — specialist assignment → length of stay (planted 6.2 × 0.85 = 5.27)
| | Value |
|---|---|
| Naive | **6.010** days |
| Double ML | **5.251** days · CI [5.165, 5.337] · error **0.4%** |
| Confounding removed | 0.759 days (12.6% of naive) |
| Autonomous discovery | precision 0.875 · recall 0.778 · **F1 0.824** · 1 spurious (reversed edge) |
| + domain knowledge | 9/9 valid DAG |

## Reproduce
```bash
git clone https://github.com/Aditya0105singh/CAUSALOCPM
cd CAUSALOCPM && pip install -r causal_ocpm/requirements.txt
python causal_ocpm/data/generate_data.py        # writes prihir_synthetic.csv
python causal_ocpm/data/generate_healthcare.py  # writes hospital_synthetic.csv
python causal_ocpm/validate.py                  # prints the report above
```
