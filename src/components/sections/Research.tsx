import { ArrowUpRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { Reveal } from "../Reveal";
import { CopyButton } from "./CopyButton";
import { SectionHeader } from "./SectionHeader";

const statusColor: Record<string, string> = {
  Published: "text-cyan border-cyan/30 bg-cyan/5",
  Released: "text-amber border-amber/30 bg-amber/5",
  "Under review": "text-violet border-violet/30 bg-violet/5",
};

function bibtex(p: Publication) {
  const key = `qudus${p.year}${p.title.split(/\W+/)[0].toLowerCase()}`;
  return `@article{${key},\n  title={${p.title}},\n  author={${p.authors}},\n  journal={${p.venue}},\n  year={${p.year}}${p.doi ? `,\n  doi={${p.doi}}` : ""}\n}`;
}

function Row({ p, i }: { p: Publication; i: number }) {
  return (
    <Reveal delay={Math.min(i, 4) * 0.05}>
      <article className="group grid gap-4 border-t border-line py-7 md:grid-cols-[120px_minmax(0,1fr)_auto] md:gap-8">
        <div className="font-mono text-sm text-dim">
          <div className="text-fg">{p.year}</div>
          <div className="mt-1 text-xs">{p.kind}</div>
        </div>
        <div>
          <h3 className="font-display text-xl font-medium leading-snug tracking-tight transition group-hover:text-cyan md:text-2xl">
            {p.title}
          </h3>
          <p className="mt-2 text-sm text-muted">{p.authors}</p>
          <p className="mt-1 text-sm text-dim">{p.venue}</p>
          {p.summary && <p className="mt-3 max-w-3xl text-fg/75">{p.summary}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {p.tags.map((t) => (
              <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg/70">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-row items-start gap-2 md:flex-col md:items-end">
          <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${statusColor[p.status] ?? "border-line text-muted"}`}>
            {p.status}
          </span>
          {p.url && (
            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
              {p.doi ? "DOI" : "Open"} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
          {!p.kind.startsWith("Patent") && <CopyButton text={bibtex(p)} label="BibTeX" />}
        </div>
      </article>
    </Reveal>
  );
}

export function Research({ publications }: { publications: Publication[] }) {
  const papers = publications.filter((p) => !p.kind.startsWith("Patent"));
  const patents = publications.filter((p) => p.kind.startsWith("Patent"));
  return (
    <section id="research" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="02"
        label="Research"
        title="Papers, frameworks"
        accent="and patents."
        description="Peer-reviewed work in VR rehabilitation, surgical training and immersive tracking, plus three published patent applications."
      />
      <div>
        {papers.map((p, i) => (
          <Row key={p.id} p={p} i={i} />
        ))}
      </div>
      {patents.length > 0 && (
        <div className="mt-16">
          <div className="mono-label mb-6">Patents filed (published)</div>
          <div className="grid gap-4 md:grid-cols-3">
            {patents.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-line bg-bg-2 p-6">
                  <div className="font-mono text-xs text-amber">{p.kind.replace("Patent · ", "No. ")}</div>
                  <h3 className="mt-3 font-display text-lg font-medium leading-snug">{p.title}</h3>
                  <p className="mt-3 text-sm text-dim">
                    {p.venue} · {p.year}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
