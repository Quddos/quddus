"use client";

import { Cpu, KeyRound, Waves, Eye, Activity } from "lucide-react";
import { useState } from "react";
import type { HubTool } from "@/lib/types";
import { Reveal } from "../Reveal";
import { SectionHeader } from "./SectionHeader";

const icons: Record<string, typeof Cpu> = { LLM: Cpu, "Motion model": Activity, "Signal pipeline": Waves, VLM: Eye };

const statusStyle: Record<string, string> = {
  Live: "text-cyan border-cyan/40",
  Training: "text-amber border-amber/40",
  "Coming soon": "text-violet border-violet/40",
  Planned: "text-muted border-line-strong",
};

const API = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://quddus.diaspafra.org").replace(/\/$/, "")}/api/v1`;

const snippets = {
  cURL: `curl ${API}/chat/completions \\
  -H "Authorization: Bearer $QUD_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qud-1",
    "messages": [{"role": "user",
      "content": "Unity C# for Quest hand-tracking grab"}]
  }'`,
  Python: `from openai import OpenAI

client = OpenAI(
    base_url="${API}",
    api_key=os.environ["QUD_API_KEY"],
)
reply = client.chat.completions.create(
    model="qud-1",
    messages=[{"role": "user",
               "content": "Band-pass filter Emotiv EEG in MNE"}],
)
print(reply.choices[0].message.content)`,
  JavaScript: `import OpenAI from "openai";

const qud = new OpenAI({
  baseURL: "${API}",
  apiKey: process.env.QUD_API_KEY,
});
const pose = await fetch("${API}/qudmi/pose", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.QUD_API_KEY}\` },
  body: JSON.stringify({ trackers: [head, leftHand, rightHand] }),
}).then((r) => r.json());`,
};

export function Hub({ tools }: { tools: HubTool[] }) {
  const [tab, setTab] = useState<keyof typeof snippets>("cURL");
  return (
    <section id="hub" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="05"
        label="AI Hub"
        title="My models, as a"
        accent="free public API."
        description="Open models trained for XR and neurotech builders. Sign up, generate a free API key and call them from your own apps, with an OpenAI-compatible interface."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((t, i) => {
            const Icon = icons[t.kind] ?? Cpu;
            return (
              <Reveal key={t.id} delay={i * 0.06}>
                <div className="group h-full rounded-3xl border border-line bg-bg-2 p-6 transition hover:border-line-strong">
                  <div className="flex items-start justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-bg text-cyan">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${statusStyle[t.status] ?? statusStyle.Planned}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="mono-label mt-6">{t.kind}</div>
                  <h3 className="mt-1 font-display text-2xl font-semibold">{t.name}</h3>
                  <p className="mt-2 text-sm text-muted">{t.description}</p>
                  <code className="mt-5 block font-mono text-xs text-dim">POST {t.endpoint}</code>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.1}>
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-[#05070c]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan/70" />
              <span className="mono-label ml-auto hidden sm:block">Preview</span>
              <div className="ml-4 flex gap-1">
                {(Object.keys(snippets) as (keyof typeof snippets)[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition ${tab === k ? "bg-white/10 text-fg" : "text-dim hover:text-fg"}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <pre className="flex-1 overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-fg/85">
              <code>{snippets[tab]}</code>
            </pre>
            <div className="flex flex-col gap-3 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted">
                <KeyRound className="h-4 w-4 text-amber" /> Free API keys open with the Qud-1 launch.
              </div>
              <a
                href="#contact"
                onClick={() => window.dispatchEvent(new CustomEvent("qud:intent", { detail: "api" }))}
                className="inline-flex items-center justify-center rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition hover:bg-cyan"
              >
                Join the early-access list
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
