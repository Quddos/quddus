import { findKey, consume, LIMITS } from "@/lib/api-keys";
import { hasDatabase, sql } from "@/lib/db";
import { callQud, GatewayError, parseMessages, QUD_MODEL, renameModelStream } from "@/lib/qud";
import { apiError, CORS } from "../../cors";

export const maxDuration = 120;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// OpenAI-compatible chat completions for Qud-1, authenticated with free API keys.
export async function POST(req: Request) {
  if (!hasDatabase()) return apiError(503, "The API isn't configured yet.", "not_configured");
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!key) return apiError(401, "Missing API key. Send `Authorization: Bearer qud_sk_...`.", "missing_api_key");
  const record = await findKey(key);
  if (!record || record.revoked) return apiError(401, "Invalid or revoked API key.", "invalid_api_key");

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return apiError(400, "Request body must be JSON.", "invalid_json");
  if (body.model !== undefined && body.model !== QUD_MODEL)
    return apiError(404, `Unknown model "${String(body.model)}". Use "${QUD_MODEL}".`, "model_not_found");
  const messages = parseMessages(body.messages, LIMITS.maxInputChars);
  if (typeof messages === "string") return apiError(400, messages, "invalid_messages");

  const limited = await consume(`key:${record.id}`, LIMITS.keyDaily);
  if (limited) return apiError(429, limited, "rate_limit_exceeded");
  await sql()`UPDATE api_keys SET last_used_at = now() WHERE id = ${record.id}`;

  const stream = body.stream === true;
  const requested = Number(body.max_tokens ?? body.max_completion_tokens ?? LIMITS.maxOutputTokens);
  const maxTokens = Math.max(1, Math.min(Number.isFinite(requested) ? requested : LIMITS.maxOutputTokens, LIMITS.maxOutputTokens));
  const temperature = typeof body.temperature === "number" ? Math.min(Math.max(body.temperature, 0), 2) : undefined;

  try {
    const upstream = await callQud(messages, { stream, maxTokens, temperature });
    if (stream && upstream.body) {
      return new Response(renameModelStream(upstream.body), {
        headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }
    const json = (await upstream.json()) as Record<string, unknown>;
    return Response.json({ ...json, model: QUD_MODEL }, { headers: CORS });
  } catch (e) {
    if (e instanceof GatewayError) return apiError(e.status, e.message, "upstream_error");
    throw e;
  }
}
