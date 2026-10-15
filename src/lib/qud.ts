import { getVercelOidcToken } from "@vercel/oidc";

export const QUD_MODEL = "qud-1";

const GATEWAY_URL = `${process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh/v1"}/chat/completions`;

// Open-weight base models tried in order. Override with QUD_BASE_MODELS
// (comma-separated AI Gateway model IDs), e.g. once Qud-1's own weights are hosted.
const BASE_MODELS = (process.env.QUD_BASE_MODELS || "openai/gpt-oss-120b,meta/llama-3.3-70b,alibaba/qwen-3-32b")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export const QUD_SYSTEM_PROMPT = `You are Qud-1, an open AI assistant created by Raheem Qudus (PhD researcher, SRM University-AP) for builders working on XR and neurotechnology.
Your strengths:
- XR development: Unity, C#, Meta XR SDK, OpenXR, hand and body tracking, mixed reality, WebXR, performance on standalone headsets.
- Neurotech and BCI: EEG acquisition (including Emotiv), preprocessing with MNE-Python, artifact handling, band powers, biomarkers, real-time neurofeedback.
- Healthcare AI and rehabilitation research: study design, clinical validation, explainable ML.
- General programming and ML engineering.
Be accurate and practical. Prefer working code with brief explanations. Say when you are unsure.
For medical topics, give research and educational information only, never diagnosis or treatment advice.
If asked who made you, say Qud-1 was created by Raheem Qudus; it currently runs on an open-weight base model while its fine-tuned weights are being trained.`;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function gatewayToken() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  return getVercelOidcToken();
}

export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// Calls AI Gateway with Qud-1's system prompt, falling back through base models
// when one is unavailable. Returns the raw upstream response.
export async function callQud(
  messages: ChatMessage[],
  opts: { stream: boolean; maxTokens: number; temperature?: number },
): Promise<Response> {
  let token: string;
  try {
    token = await gatewayToken();
  } catch {
    throw new GatewayError("The AI backend isn't configured on this deployment.", 503);
  }
  const userSystem = messages.filter((m) => m.role === "system").map((m) => m.content);
  const system = [QUD_SYSTEM_PROMPT, ...userSystem].join("\n\n");
  const convo = messages.filter((m) => m.role !== "system");

  let last: Response | null = null;
  for (const model of BASE_MODELS) {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...convo],
        stream: opts.stream,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature ?? 0.6,
      }),
    });
    if (res.ok) return res;
    last = res;
    // Only fall through to the next model when this one is missing or unavailable.
    if (![400, 404, 422, 503].includes(res.status)) break;
  }
  const detail = last ? await last.text().catch(() => "") : "";
  console.error("AI Gateway error", last?.status, detail.slice(0, 500));
  throw new GatewayError(
    last?.status === 429 ? "The model is busy. Please retry in a moment." : "The model is temporarily unavailable.",
    last?.status === 429 ? 429 : 502,
  );
}

// Validates an OpenAI-style message list and enforces the input budget.
export function parseMessages(raw: unknown, maxChars: number): ChatMessage[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return "`messages` must be a non-empty array.";
  const out: ChatMessage[] = [];
  let chars = 0;
  for (const m of raw.slice(-40)) {
    if (!m || typeof m !== "object") return "Each message must be an object.";
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "system" && role !== "user" && role !== "assistant") return "Message roles must be system, user or assistant.";
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map((p) => (p && typeof p === "object" && (p as { type?: string }).type === "text" ? String((p as { text?: unknown }).text ?? "") : ""))
              .join("")
          : null;
    if (text === null) return "Message content must be a string.";
    chars += text.length;
    out.push({ role, content: text });
  }
  if (chars > maxChars) return `Input too long (${chars} characters, limit ${maxChars}).`;
  return out;
}

// Rewrites the upstream model name to qud-1 in each streamed SSE chunk.
export function renameModelStream(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) controller.enqueue(encoder.encode(rename(line) + "\n"));
      },
      flush(controller) {
        if (buffer) controller.enqueue(encoder.encode(rename(buffer)));
      },
    }),
  );
}

function rename(line: string) {
  return line.startsWith("data:") ? line.replace(/"model":"[^"]*"/, `"model":"${QUD_MODEL}"`) : line;
}
