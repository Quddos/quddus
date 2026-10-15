import type { Metadata } from "next";
import { CodeTabs } from "@/components/hub/CodeTabs";
import { KeyForm } from "@/components/hub/KeyForm";
import { Playground } from "@/components/hub/Playground";
import { Reveal } from "@/components/Reveal";
import { LIMITS } from "@/lib/api-keys";

export const metadata: Metadata = {
  title: "Developers · Qud-1 API",
  description: "Free, OpenAI-compatible API for Qud-1, an assistant for XR and neurotech builders. Generate a key and start building.",
};

const endpoints = [
  ["POST", "/api/v1/chat/completions", "Chat with qud-1. OpenAI-compatible: messages, stream, max_tokens, temperature."],
  ["GET", "/api/v1/models", "Lists available models."],
];

const errors = [
  ["401", "Missing, invalid or revoked API key"],
  ["400", "Malformed JSON or messages, or input over the size limit"],
  ["404", "Unknown model (use qud-1)"],
  ["429", "Daily limit reached, or the model is busy"],
  ["502 / 503", "The model backend is temporarily unavailable"],
];

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <Reveal>
        <div className="mono-label mb-5 flex items-center gap-3">
          <span className="text-cyan">API</span>
          <span className="h-px w-10 bg-line-strong" />
          Developers
        </div>
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          Build with <span className="text-gradient">Qud-1</span>, free.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          An assistant tuned for XR and neurotech: Unity and Meta XR, OpenXR, EEG and MNE pipelines, BCI and rehab research. It speaks
          the OpenAI chat format, so existing SDKs work by changing the base URL.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="mono-label mb-3">1 · Try it</div>
          <Playground height={600} />
        </Reveal>
        <Reveal delay={0.1}>
          <div id="key" className="scroll-mt-28">
            <div className="mono-label mb-3">2 · Get a key</div>
            <KeyForm />
            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center">
              {[
                [`${LIMITS.keyDaily}`, "requests / day / key"],
                [`${LIMITS.maxOutputTokens}`, "max output tokens"],
                ["$0", "forever free tier"],
              ].map(([v, l]) => (
                <div key={l} className="bg-bg-2 p-4">
                  <div className="font-display text-2xl font-semibold">{v}</div>
                  <div className="mt-1 text-xs text-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <section id="docs" className="mt-24 scroll-mt-28">
        <Reveal>
          <div className="mono-label mb-3">3 · Call the API</div>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Quickstart</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Send your key as a Bearer token. Use <code className="font-mono text-cyan">qud-1</code> as the model. Add{" "}
            <code className="font-mono text-cyan">&quot;stream&quot;: true</code> for server-sent events.
          </p>
        </Reveal>
        <Reveal delay={0.05} className="mt-6">
          <CodeTabs />
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h3 className="mono-label mb-4">Endpoints</h3>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {endpoints.map(([m, path, d]) => (
                <div key={path} className="p-4">
                  <div className="font-mono text-sm">
                    <span className={m === "POST" ? "text-amber" : "text-cyan"}>{m}</span> {path}
                  </div>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </div>
              ))}
            </div>
            <h3 className="mono-label mb-4 mt-10">Errors</h3>
            <div className="divide-y divide-line rounded-2xl border border-line text-sm">
              {errors.map(([c, d]) => (
                <div key={c} className="flex gap-4 p-3">
                  <span className="w-20 shrink-0 font-mono text-rose">{c}</span>
                  <span className="text-muted">{d}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="mono-label mb-4">Good to know</h3>
            <ul className="space-y-4 text-fg/85">
              {[
                "Limits reset daily at midnight UTC. Input is capped at about 24,000 characters per request.",
                "Keep your key on a server. Never ship it inside a public web page or app build.",
                "Qud-1 currently runs on an open-weight base model with Qud's instructions. When its fine-tuned weights are ready they replace it behind the same endpoint, with no change on your side.",
                "Outputs can be wrong. Health-related answers are for research and education only, not medical advice.",
                "Requests aren't stored by this site beyond daily request counts. The model provider processes them to generate replies.",
                "Lost your key? Generate a new one. Need higher limits? Get in touch via the contact form.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
