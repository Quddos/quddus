import { getVercelOidcToken } from "@vercel/oidc";

export const QUD_MODEL = "qud-1";

type Provider = {
  name: string;
  baseUrl: string;
  models: string[];
  token: () => Promise<string>;
  // Seconds to wait for the response to start before trying the next provider.
  startTimeout?: number;
  // Told to the model so it describes itself truthfully.
  identity?: string;
  // The small self-hosted model: used for Qud-1 chat, not for long custom prompts.
  own?: boolean;
};

const STAND_IN = "Right now you are running on a larger open-weight model standing in for Qud-1's own fine-tuned weights.";

const list = (value: string | undefined, fallback: string) =>
  (value || fallback)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

const staticToken = (value: string) => async () => value;

// Free-tier providers with OpenAI-compatible APIs, tried in order. Each is used only
// when its key is set; model lists can be overridden with <NAME>_MODELS.
export function providers(): Provider[] {
  const out: Provider[] = [];
  const env = process.env;
  // Qud-1's own fine-tuned weights, self-hosted (see training/qud-1). A sleeping
  // free Space can take minutes to wake, so give up quickly and fall through.
  if (env.QUD1_BASE_URL)
    out.push({
      name: "Qud-1 (fine-tuned)",
      baseUrl: env.QUD1_BASE_URL.replace(/\/+$/, ""),
      models: list(env.QUD1_MODELS, "qud-1"),
      token: staticToken(env.QUD1_API_KEY || ""),
      startTimeout: Number(env.QUD1_START_TIMEOUT) || 12,
      identity: "You are running on Qud-1's own fine-tuned open weights (huggingface.co/quddusr/qud-1).",
      own: true,
    });
  if (env.GROQ_API_KEY)
    out.push({
      name: "Groq",
      identity: STAND_IN,
      baseUrl: "https://api.groq.com/openai/v1",
      models: list(env.GROQ_MODELS, "openai/gpt-oss-120b,llama-3.3-70b-versatile,qwen/qwen3-32b"),
      token: staticToken(env.GROQ_API_KEY),
    });
  if (env.CEREBRAS_API_KEY)
    out.push({
      name: "Cerebras",
      identity: STAND_IN,
      baseUrl: "https://api.cerebras.ai/v1",
      models: list(env.CEREBRAS_MODELS, "gpt-oss-120b,llama-3.3-70b"),
      token: staticToken(env.CEREBRAS_API_KEY),
    });
  if (env.OPENROUTER_API_KEY)
    out.push({
      name: "OpenRouter",
      identity: STAND_IN,
      baseUrl: "https://openrouter.ai/api/v1",
      models: list(env.OPENROUTER_MODELS, "openai/gpt-oss-120b:free,meta-llama/llama-3.3-70b-instruct:free"),
      token: staticToken(env.OPENROUTER_API_KEY),
    });
  if (env.HF_TOKEN)
    out.push({
      name: "Hugging Face",
      identity: STAND_IN,
      baseUrl: "https://router.huggingface.co/v1",
      models: list(env.HF_MODELS, "openai/gpt-oss-120b,meta-llama/Llama-3.3-70B-Instruct"),
      token: staticToken(env.HF_TOKEN),
    });
  // Vercel AI Gateway last: uses the deployment's OIDC token or AI_GATEWAY_API_KEY.
  out.push({
    name: "Vercel AI Gateway",
    identity: STAND_IN,
    baseUrl: env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh/v1",
    models: list(env.QUD_BASE_MODELS, "openai/gpt-oss-120b,meta/llama-3.3-70b,alibaba/qwen-3-32b"),
    token: async () => env.AI_GATEWAY_API_KEY || (await getVercelOidcToken()),
  });
  return out;
}

export const QUD_SYSTEM_PROMPT = `You are Qud-1, an open AI assistant created by Raheem Qudus (PhD researcher, SRM University-AP) for builders working on XR and neurotechnology.
Your strengths:
- XR development: Unity, C#, Meta XR SDK, OpenXR, hand and body tracking, mixed reality, WebXR, performance on standalone headsets.
- Neurotech and BCI: EEG acquisition (including Emotiv), preprocessing with MNE-Python, artifact handling, band powers, biomarkers, real-time neurofeedback.
- Healthcare AI and rehabilitation research: study design, clinical validation, explainable ML.
- General programming and ML engineering.
Be accurate and practical. Prefer working code with brief explanations. Say when you are unsure.
For medical topics, give research and educational information only, never diagnosis or treatment advice.
If asked who made you, say Qud-1 was created by Raheem Qudus.`;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type Attempt = { provider: string; model: string; status: number; detail: string };

function withIdentity(messages: ChatMessage[], identity?: string): ChatMessage[] {
  if (!identity) return messages;
  const [system, ...rest] = messages;
  return [{ ...system, content: `${system.content}\n${identity}` }, ...rest];
}

async function attempt(provider: Provider, model: string, body: Record<string, unknown>, identity?: string) {
  let token: string;
  try {
    token = await provider.token();
  } catch (e) {
    return { res: null, status: 0, detail: `No credentials: ${(e as Error).message}` };
  }
  // The timeout covers the wait for the response to start, not the stream itself,
  // so a slow CPU-hosted model can finish a long answer.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("Timed out waiting for the model")), (provider.startTimeout ?? 45) * 1000);
  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, messages: withIdentity(body.messages as ChatMessage[], identity), model }),
      signal: controller.signal,
    });
    if (res.ok) return { res, status: res.status, detail: "ok" };
    return { res: null, status: res.status, detail: (await res.text().catch(() => "")).slice(0, 300) };
  } catch (e) {
    return { res: null, status: 0, detail: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

// Calls the first provider/model that answers, with Qud-1's system prompt.
// Returns the raw upstream response (SSE when streaming).
export async function callQud(
  messages: ChatMessage[],
  opts: { stream: boolean; maxTokens: number; temperature?: number; system?: string },
  log?: Attempt[],
): Promise<Response> {
  const userSystem = messages.filter((m) => m.role === "system").map((m) => m.content);
  const system = [opts.system ?? QUD_SYSTEM_PROMPT, ...userSystem].join("\n\n");
  const body = {
    messages: [{ role: "system", content: system }, ...messages.filter((m) => m.role !== "system")],
    stream: opts.stream,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.6,
  };
  let rateLimited = false;
  // Custom system prompts (the site guide) carry long context, so they go to the larger models.
  for (const provider of providers().filter((p) => !(opts.system && p.own))) {
    for (const model of provider.models) {
      const r = await attempt(provider, model, body, opts.system ? undefined : provider.identity);
      log?.push({ provider: provider.name, model, status: r.status, detail: r.detail });
      if (r.res) return r.res;
      if (r.status === 429) rateLimited = true;
      console.error(`Qud-1 ${provider.name} ${model} failed`, r.status, r.detail);
      // Bad credentials won't work for other models of the same provider.
      if (r.status === 401 || r.status === 403 || r.status === 0) break;
    }
  }
  throw new GatewayError(
    rateLimited ? "The model is busy. Please retry in a moment." : "The model is temporarily unavailable.",
    rateLimited ? 429 : 502,
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
