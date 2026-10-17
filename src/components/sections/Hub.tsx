import { Activity, ArrowUpRight, BookOpen, Cpu, Eye, KeyRound, Waves } from "lucide-react";
import Link from "next/link";
import type { HubTool } from "@/lib/types";
import { Playground } from "../hub/Playground";
import { Reveal } from "../Reveal";
import { SectionHeader } from "./SectionHeader";

const icons: Record<string, typeof Cpu> = { LLM: Cpu, "Motion model": Activity, "Signal pipeline": Waves, VLM: Eye };

const statusStyle: Record<string, string> = {
  Live: "text-cyan border-cyan/40",
  Training: "text-amber border-amber/40",
  "Coming soon": "text-violet border-violet/40",
  Planned: "text-muted border-line-strong",
};

export function Hub({ tools }: { tools: HubTool[] }) {
  return (
    <section id="hub" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="05"
        label="AI Hub"
        title="My models, as a"
        accent="free public API."
        description="Chat with Qud-1 right here, then grab a free API key and call it from your own apps through an OpenAI-compatible endpoint."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {tools.map((t, i) => {
            const Icon = icons[t.kind] ?? Cpu;
            return (
              <Reveal key={t.id} delay={i * 0.06}>
                <div className="h-full rounded-3xl border border-line bg-bg-2 p-5 transition hover:border-line-strong">
                  <div className="flex items-start justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-bg text-cyan">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${statusStyle[t.status] ?? statusStyle.Planned}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="mono-label mt-5">{t.kind}</div>
                  <h3 className="mt-1 font-display text-xl font-semibold">{t.name}</h3>
                  <p className="mt-2 text-sm text-muted">{t.description}</p>
                  {t.endpoint.startsWith("/demos") ? (
                    <Link href={t.endpoint} className="mt-4 inline-flex items-center gap-1 text-sm text-cyan">
                      Open live demo <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <code className="mt-4 block font-mono text-xs text-dim">POST {t.endpoint}</code>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.1} className="flex flex-col gap-4">
          <Playground height={560} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/developers#key" className="group flex items-center justify-between rounded-2xl bg-fg px-5 py-4 font-medium text-bg transition hover:bg-cyan">
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Get a free API key
              </span>
              <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
            </Link>
            <Link href="/developers#docs" className="glass group flex items-center justify-between rounded-2xl px-5 py-4 font-medium transition hover:border-cyan/50">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan" /> API docs
              </span>
              <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
