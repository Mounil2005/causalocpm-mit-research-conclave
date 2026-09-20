"use client";
import { useRef, useState } from "react";
import { AlertTriangle, BarChart3, FileText, FlaskConical, Send, Sparkles, User } from "lucide-react";
import type { CausalFixture, DomainId } from "@/lib/engine/types";
import { detectChipKey } from "@/lib/copilot";
import { Card } from "@/components/ui";

const CAP_ICON: Record<string, typeof Sparkles> = {
  alert: AlertTriangle,
  chart: BarChart3,
  flask: FlaskConical,
  doc: FileText,
};

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function CopilotTab({ f, domain }: { f: CausalFixture; domain: DomainId }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `I'm your Decision Intelligence Copilot for the ${f.scenario.org} ${f.scenario.name}. Ask me about causal drivers, effect estimates, sensitivity, counterfactuals, or what-if simulations.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setFollowUps([]);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain, messages: next.slice(-8) }),
      });
      const data = await res.json();
      setLive(data.live ?? false);
      setMessages([...next, { role: "assistant", content: data.reply }]);
      const key = detectChipKey(text);
      setFollowUps(f.copilot.followUps[key] ?? f.copilot.followUps["custom"] ?? []);
    } catch {
      setMessages([...next, { role: "assistant", content: "Copilot is unavailable right now — please retry." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight));
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-4">
      <Card className="lg:col-span-3" pad={false}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles size={15} className="text-forest" /> Decision Intelligence Copilot
          </div>
          <span className="text-[11px] text-muted">
            {live === null ? "grounded on live pipeline data" : live ? "live · Claude" : "grounded · offline fallback"}
          </span>
        </div>

        <div ref={scrollRef} className="scroll-slim h-[440px] space-y-4 overflow-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-paper-2 text-ink-soft" : "bg-sage text-forest-deep"
                }`}
              >
                {m.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-forest text-white" : "bg-paper-2 text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              {f.copilot.capabilities.map((cap) => {
                const Icon = CAP_ICON[cap.icon] ?? Sparkles;
                return (
                  <button
                    key={cap.title}
                    onClick={() => send(cap.prompt)}
                    className="rounded-xl border border-line bg-card p-3 text-left hover:border-forest/40 hover:bg-paper-2"
                  >
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                      <Icon size={14} className="text-forest" /> {cap.title}
                    </div>
                    <div className="mt-1 text-[11px] text-muted">{cap.detail}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cap.tags.map((t) => (
                        <span key={t} className="rounded-full bg-sage px-2 py-0.5 text-[10px] text-forest-deep">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {loading && <div className="pl-10 text-sm text-muted">Copilot is thinking…</div>}

          {!loading && followUps.length > 0 && messages.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pl-10">
              {followUps.map((fu) => (
                <button
                  key={fu}
                  onClick={() => send(fu)}
                  className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] text-ink-soft hover:border-forest/40 hover:text-forest"
                >
                  ↳ {fu}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-line p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your causal analysis…"
            className="flex-1 rounded-xl border border-line bg-paper-2 px-3 py-2 text-sm outline-none focus:border-forest/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
      </Card>

      <Card>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Quick questions</div>
        <div className="space-y-2">
          {f.copilot.chips.map((c) => (
            <button
              key={c.key}
              onClick={() => send(c.label)}
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-left text-[12px] text-ink-soft hover:bg-paper-2"
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Set <code className="rounded bg-paper-2 px-1">ANTHROPIC_API_KEY</code> to switch from the grounded fallback to
          live Claude answers.
        </p>
      </Card>
    </div>
  );
}
