"use client";
import { useState } from "react";
import { clsx } from "clsx";
import type { CausalFixture } from "@/lib/engine/types";
import { Card, SectionTitle, KeyVal } from "@/components/ui";

const TOGGLES = [
  ["Use Causal Discovery (PC algorithm)", true],
  ["Apply Expert / Domain Rules", true],
  ["Double ML Effect Estimation", true],
  ["Bootstrap Validation", true],
  ["Show counterfactual explanations", true],
] as const;

export function SettingsTab({ f }: { f: CausalFixture }) {
  const [toggles, setToggles] = useState<boolean[]>(TOGGLES.map(([, v]) => v));
  const [threshold, setThreshold] = useState(80);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <SectionTitle>Scenario Settings</SectionTitle>
        <KeyVal k="Scenario name" v={f.scenario.name} />
        <KeyVal k="Organisation" v={f.scenario.org} />
        <KeyVal k="Outcome variable" v={f.scenario.outcomeVariable} />
        <KeyVal k="Time window" v={f.scenario.timeRange} />
        <KeyVal k="Data sources" v={`${f.scenario.dataSources} integrated`} />
        <p className="mt-3 text-[12px] text-muted">{f.scenario.description}</p>
      </Card>

      <Card>
        <SectionTitle>Advanced Settings</SectionTitle>
        <div className="space-y-1">
          {TOGGLES.map(([label], i) => (
            <div key={label} className="flex items-center justify-between border-b border-line-soft py-2.5 text-sm last:border-0">
              <span className="text-ink-soft">{label}</span>
              <button
                onClick={() => setToggles((t) => t.map((v, j) => (j === i ? !v : v)))}
                className={clsx(
                  "relative h-5 w-9 rounded-full transition-colors",
                  toggles[i] ? "bg-forest" : "bg-line",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                    toggles[i] ? "left-4" : "left-0.5",
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[12px] text-muted">
            <span>Confidence threshold</span>
            <span className="font-semibold text-ink">{threshold}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={99}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[#3d5a3d]"
          />
        </div>

        <button className="mt-5 w-full rounded-xl bg-forest py-2 text-sm font-medium text-white">
          Save Changes
        </button>
      </Card>

      <Card className="lg:col-span-2 text-[12px] text-muted">
        Set <code className="rounded bg-paper-2 px-1">ANTHROPIC_API_KEY</code> in your environment to enable the live
        Claude-powered Copilot. Without it, the Copilot falls back to grounded scripted answers derived from this
        scenario&apos;s fixture.
      </Card>
    </div>
  );
}
