import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { breadcrumbs, graph, PERSON_ID } from "@/lib/jsonld";
import { abs } from "@/lib/site";
import { CopyButton } from "@/components/sections/CopyButton";
import { RilstudioEmbed, RILSTUDIO_URL } from "@/components/rilstudio/RilstudioEmbed";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/demos/rilstudio" },
  title: "RILstudio: imitation and reinforcement learning studio",
  description: "Teach an agent by playing a task with your keyboard (behaviour cloning) or by reward (Double DQN). Trains live in your browser with TensorFlow.js and exports the policy.",
};

const citation = `@article{quddus2026rilstudio,
  author  = {Quddus, Raheem},
  title   = {RILstudio: A Browser-Based Studio for Teaching Agent Behaviour by Demonstration and by Reward},
  year    = {2026},
  note    = {Manuscript},
  url     = {https://github.com/Quddos/RILstudioVR}
}`;

const steps = [
  ["Pick a task", "Cart Pole, Grid World, Mountain Car or Lunar Lander, each written from scratch in TypeScript with its own observations, actions and reward."],
  ["Demonstrate", "Play with the arrow keys. Every simulation step becomes a (state, action) sample and lands on that action's card."],
  ["Train", "Imitation clones your play in seconds. Reinforcement runs a Double DQN on reward alone, warm-started by your demonstrations if you have any."],
  ["Preview & export", "Watch the policy play by itself with live action confidences, then export a TensorFlow.js model with its normalisation metadata."],
];

export default function RilstudioPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph({ "@type": "SoftwareApplication", name: "RILstudio", description: "Browser-based studio for teaching agents by demonstration (behaviour cloning) or by reward (Double DQN).", url: abs("/demos/rilstudio"), sameAs: RILSTUDIO_URL, applicationCategory: "EducationalApplication", operatingSystem: "Web browser", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: { "@id": PERSON_ID } }, breadcrumbs([["Home", "/"], ["RILstudio", "/demos/rilstudio"]])) }} />
      <Reveal>
        <div className="mono-label mb-5 flex items-center gap-3">
          <span className="text-cyan">Live studio</span>
          <span className="h-px w-10 bg-line-strong" />
          Imitation · Reinforcement
        </div>
        <h1 className="max-w-4xl font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          Teach an agent <span className="text-gradient">by showing it.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Labelling tools teach models about things. RILstudio teaches behaviour: play a task and your keystrokes become the
          labels, or hand the agent a reward and let it practise. Everything trains in your browser and nothing is uploaded.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <RilstudioEmbed />
        <p className="mt-3 text-sm text-dim md:hidden">The studio needs a keyboard to demonstrate. It works best on a laptop or desktop.</p>
      </Reveal>

      <section className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-line bg-bg-2 p-5">
                <div className="font-mono text-xs text-cyan">0{i + 1}</div>
                <div className="mt-2 font-display text-lg font-semibold">{title}</div>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold">Measured, not decorative</h2>
          <div className="mt-5 divide-y divide-line rounded-2xl border border-line text-sm">
            {[
              ["Cart Pole, behaviour cloning", "500.0 ± 0.0"],
              ["Cart Pole, Double DQN", "472.9 ± 47.0"],
              ["Cart Pole, random policy", "21.8"],
              ["Lunar Lander, BC / DQN", "96.9 / 98.8"],
              ["DQN without → with greedy checkpointing", "165.2 → 472.9"],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 p-3">
                <span className="text-muted">{k}</span>
                <span className="font-mono">{val}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-dim">
            Mean episode return from the scripted benchmark (5 seeds for imitation, 3 for reinforcement, 30 evaluation episodes).
            Choosing weights by periodically measured greedy return, rather than the exploration-noisy training return, also cuts
            the DQN&apos;s across-seed spread from 170 to 47.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-2xl font-semibold">Use it</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              ["Open the full studio", RILSTUDIO_URL],
              ["GitHub (web studio)", "https://github.com/Quddos/RILstudioVR"],
              ["RILstudio Immersive (Unity, in development)", "https://github.com/Quddos/RILstudio-Immersive"],
            ].map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:border-cyan/50">
                {label} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-bg-2 p-4 text-sm text-fg/85">
            Your demonstrations and model weights never leave the page. The live instance records anonymous run summaries and an
            optional questionnaire for the accompanying user study, and its footer has an opt-out.
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="mono-label">Cite</span>
              <CopyButton text={citation} label="Copy BibTeX" />
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-line bg-[#05070c] p-4 font-mono text-xs text-fg/80">{citation}</pre>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
