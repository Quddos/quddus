import { clientIp, consume, hash, LIMITS } from "@/lib/api-keys";
import { hasDatabase } from "@/lib/db";
import { callQud, GatewayError, parseMessages, renameModelStream } from "@/lib/qud";

export const maxDuration = 60;

// Keyless, IP-limited endpoint behind the on-site chat playground.
export async function POST(req: Request) {
  if (!hasDatabase()) return Response.json({ error: "The playground isn't configured yet." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
  const messages = parseMessages(body?.messages, 8000);
  if (typeof messages === "string") return Response.json({ error: messages }, { status: 400 });
  if (messages.some((m) => m.role === "system")) return Response.json({ error: "System messages aren't allowed here." }, { status: 400 });
  const limited = await consume(`ip:${hash(`ip:${clientIp(req)}`)}`, LIMITS.playgroundDaily);
  if (limited) return Response.json({ error: `${limited} Get a free API key for more.` }, { status: 429 });
  try {
    const upstream = await callQud(messages, { stream: true, maxTokens: 900 });
    return new Response(renameModelStream(upstream.body!), {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    if (e instanceof GatewayError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
