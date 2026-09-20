import { NextResponse } from "next/server";
import { getFixture } from "@/lib/fixtures";
import { groundedAnswer, systemPrompt } from "@/lib/copilot";
import { DomainId } from "@/lib/engine/types";

export const runtime = "nodejs";

interface Body {
  domain: DomainId;
  messages: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const domainParse = DomainId.safeParse(body.domain);
  if (!domainParse.success) {
    return NextResponse.json({ error: "unknown domain" }, { status: 400 });
  }
  const fixture = getFixture(domainParse.data);
  const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
  const question = lastUser?.content?.slice(0, 500) ?? "";

  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: key });
      const res = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 400,
        system: systemPrompt(fixture),
        messages: (body.messages ?? [])
          .filter((m) => m.content?.trim())
          .map((m) => ({ role: m.role, content: m.content })),
      });
      const reply = res.content
        .map((b: any) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim();
      if (reply) return NextResponse.json({ reply, live: true });
    } catch (err) {
      console.error("copilot live call failed, falling back:", err);
    }
  }

  return NextResponse.json({ reply: groundedAnswer(fixture, question), live: false });
}
