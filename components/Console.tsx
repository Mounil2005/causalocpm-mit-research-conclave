"use client";
import { useCallback, useRef, useState } from "react";
import { clsx } from "clsx";
import { Activity, BarChart3, Bot, Database, LayoutGrid, Lightbulb, Search, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import type { CausalFixture, DomainId } from "@/lib/engine/types";
import { AnimatePresence, motion } from "@/components/motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { GuidedTour, TourButton, buildTour } from "./GuidedTour";
import { Investigation } from "./story/Investigation";
import { OverviewTab } from "./tabs/OverviewTab";
import { DataDiscoveryTab } from "./tabs/DataDiscoveryTab";
import { ModelPerformanceTab } from "./tabs/ModelPerformanceTab";
import { CaseInspectorTab } from "./tabs/CaseInspectorTab";
import { DecisionIntelligenceTab } from "./tabs/DecisionIntelligenceTab";
import { DecisionAuditTab } from "./tabs/DecisionAuditTab";
import { LiveSupplyChainTab } from "./tabs/LiveSupplyChainTab";
import { CopilotTab } from "./tabs/CopilotTab";
import { SettingsTab } from "./tabs/SettingsTab";

const TABS = [
  { id: "overview", label: "Overview", sub: "The incident & the answer", icon: LayoutGrid },
  { id: "audit", label: "Decision Audit", sub: "Audit an AI decision", icon: ShieldCheck },
  { id: "twin", label: "Live Supply Chain", sub: "Digital twin & queue", icon: Activity },
  { id: "data", label: "Data & Discovery", sub: "What happened · how it connects", icon: Database },
  { id: "model", label: "Model Performance", sub: "What caused it · can we trust it", icon: BarChart3 },
  { id: "case", label: "Case Inspector", sub: "Drill into one case", icon: Search },
  { id: "decision", label: "Decision Intelligence", sub: "What should we do", icon: Lightbulb },
  { id: "copilot", label: "Copilot", sub: "AI assistant", icon: Bot },
  { id: "settings", label: "Settings", sub: "Scenario & data", icon: SettingsIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Console({ fixtures }: { fixtures: Record<DomainId, CausalFixture> }) {
  const [domain, setDomain] = useState<DomainId>("manufacturing");
  const [mode, setMode] = useState<"story" | "console">("story");
  const [tab, setTab] = useState<TabId>("overview");
  const [tour, setTour] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const f = fixtures[domain];

  const spotlight = useCallback((anchor: string) => {
    const attempt = (tries: number) => {
      const el = document.getElementById(anchor);
      if (!el) {
        if (tries > 0) setTimeout(() => attempt(tries - 1), 90);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tour-spotlight");
      window.setTimeout(() => el.classList.remove("tour-spotlight"), 2400);
    };
    attempt(12);
  }, []);

  const onTourGo = useCallback(
    (t: string, anchor: string) => {
      setTab(t as TabId);
      // let the tab mount, then scroll
      setTimeout(() => spotlight(anchor), 90);
    },
    [spotlight],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px]">
      <Sidebar fixtures={fixtures} domain={domain} onDomain={setDomain} />

      <main ref={mainRef} className="min-w-0 flex-1 px-5 py-6 sm:px-8">
        <TopBar
          f={f}
          domain={domain}
          compact={mode === "story"}
          rightSlot={
            mode === "story" ? (
              <button
                onClick={() => setMode("console")}
                className="rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:border-forest/40 hover:text-forest"
              >
                Skip to console
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("story")}
                  className="rounded-lg border border-forest/30 bg-sage px-3 py-1.5 text-[12px] font-medium text-forest-deep hover:bg-sage/70"
                >
                  ▶ Guided story
                </button>
                <TourButton onClick={() => setTour(true)} />
              </div>
            )
          }
        />

        {mode === "story" ? (
          <Investigation f={f} onOpenConsole={() => setMode("console")} />
        ) : (
          <ConsoleTabs
            f={f}
            domain={domain}
            tab={tab}
            setTab={setTab}
            fixtures={fixtures}
            onDomain={setDomain}
          />
        )}

        <footer className="mt-10 border-t border-line pt-4 text-[11px] text-muted">
          CausalOCPM · A Causal Audit Layer for Agentic AI Decisions · Object-Centric Process Mining × Structural Causal Models
        </footer>
      </main>

      <AnimatePresence>
        {tour && <GuidedTour steps={buildTour(f)} onGo={onTourGo} onClose={() => setTour(false)} />}
      </AnimatePresence>
    </div>
  );
}

function ConsoleTabs({
  f,
  domain,
  tab,
  setTab,
  fixtures,
  onDomain,
}: {
  f: CausalFixture;
  domain: DomainId;
  tab: TabId;
  setTab: (t: TabId) => void;
  fixtures: Record<DomainId, CausalFixture>;
  onDomain: (d: DomainId) => void;
}) {
  return (
    <>
        {/* mobile domain switch */}
        <div className="mb-4 flex gap-2 lg:hidden">
          {(Object.keys(fixtures) as DomainId[]).map((d) => (
            <button
              key={d}
              onClick={() => onDomain(d)}
              className={clsx(
                "rounded-lg border px-3 py-1.5 text-sm capitalize",
                d === domain ? "border-forest/40 bg-sage text-forest-deep" : "border-line bg-card text-muted",
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="scroll-slim no-print -mx-1 mb-5 flex gap-0.5 overflow-x-auto border-b border-line px-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-left transition-colors"
              >
                <Icon size={15} className={clsx("transition-colors", active ? "text-forest" : "text-muted")} />
                <span>
                  <span className={clsx("block text-[13px] transition-colors", active ? "font-semibold text-ink" : "text-muted")}>
                    {t.label}
                  </span>
                  <span className="block text-[10px] text-muted">{t.sub}</span>
                </span>
                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-forest"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <motion.div
          key={domain + tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "overview" && <OverviewTab f={f} />}
            {tab === "audit" && <DecisionAuditTab f={f} />}
            {tab === "twin" && <LiveSupplyChainTab f={f} onAudit={() => setTab("audit")} />}
            {tab === "data" && <DataDiscoveryTab f={f} />}
            {tab === "model" && <ModelPerformanceTab f={f} />}
            {tab === "case" && <CaseInspectorTab f={f} />}
            {tab === "decision" && <DecisionIntelligenceTab f={f} />}
            {tab === "copilot" && <CopilotTab f={f} domain={domain} />}
            {tab === "settings" && <SettingsTab f={f} />}
        </motion.div>
    </>
  );
}
