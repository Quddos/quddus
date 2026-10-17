import { clientIp, consume, hash, LIMITS } from "@/lib/api-keys";
import { getContent } from "@/lib/content";
import { hasDatabase } from "@/lib/db";
import { callQud, GatewayError, parseMessages, renameModelStream } from "@/lib/qud";
import { askSystemPrompt } from "@/lib/raheem";

export const maxDuration = 60;

// "Ask Raheem": answers questions about the portfolio from the live site content.
export async function POST(req: Request) {
  if (!hasDatabase()) return Response.json({ error: "The assistant isn't configured yet." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
  const messages = parseMessages(body?.messages, 6000);
  if (typeof messages === "string") return Response.json({ error: messages }, { status: 400 });
  if (messages.some((m) => m.role === "system")) return Response.json({ error: "System messages aren't allowed." }, { status: 400 });
  const limited = await consume(`ask:${hash(`ip:${clientIp(req)}`)}`, LIMITS.askDaily);
  if (limited) return Response.json({ error: limited }, { status: 429 });
  try {
    const upstream = await callQud(messages, { stream: true, maxTokens: 600, temperature: 0.3, system: askSystemPrompt(await getContent()) });
    return new Response(renameModelStream(upstream.body!), {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    if (e instanceof GatewayError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
