import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/Reveal";
import { CopyButton } from "@/components/sections/CopyButton";
import { getContent } from "@/lib/content";
import { breadcrumbs, graph, isPatent, publicationLd } from "@/lib/jsonld";
import { seed } from "@/lib/seed";
import type { Publication } from "@/lib/types";

export async function generateStaticParams() {
  const c = await getContent();
  return (c.publications.length ? c.publications : seed.publications).map((p) => ({ id: p.id }));
}

const authorsOf = (p: Publication) => p.authors.split(/,\s*/).map((a) => a.trim()).filter(Boolean);

function bibtex(p: Publication) {
  const key = `qudus${p.year}${p.title.split(/\W+/)[0].toLowerCase()}`;
  return `@${isPatent(p) ? "misc" : "article"}{${key},\n  title={${p.title}},\n  author={${authorsOf(p).join(" and ")}},\n  ${isPatent(p) ? "howpublished" : "journal"}={${p.venue}},\n  year={${p.year}}${p.doi ? `,\n  doi={${p.doi}}` : ""}\n}`;
}

export async function generateMetadata({ params }: PageProps<"/research/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = (await getContent()).publications.find((x) => x.id === id);
  if (!p) return { title: "Research" };
  // Google Scholar reads these Highwire-style tags.
  const citation: Record<string, string | string[]> = {
    citation_title: p.title,
    citation_author: authorsOf(p),
    citation_publication_date: p.year,
    ...(p.doi && { citation_doi: p.doi }),
    ...(!isPatent(p) && p.venue && { [/symposium|conference|proceedings/i.test(p.venue + p.kind) ? "citation_conference_title" : "citation_journal_title"]: p.venue }),
  };
  return {
    title: p.title,
    description: p.summary || `${p.kind}, ${p.venue}, ${p.year}`,
    alternates: { canonical: `/research/${p.id}` },
    openGraph: { type: "article", title: p.title, description: p.summary },
    other: citation,
  };
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getContent();
  const p = c.publications.find((x) => x.id === id);
  if (!p)
    return (
      <div className="mx-auto max-w-3xl px-5 py-40 text-center">
        <h1 className="font-display text-4xl font-semibold">Publication not found</h1>
        <Link href="/#research" className="mt-6 inline-block text-cyan">
          Back to research
        </Link>
      </div>
    );
  const related = c.projects.find((pr) => p.title.toLowerCase().includes(pr.title.toLowerCase().split(" ")[0]) && pr.title.length > 3);
  const ld = graph(publicationLd(p), breadcrumbs([["Home", "/"], ["Research", "/#research"], [p.title, `/research/${p.id}`]]));
  return (
    <article className="mx-auto max-w-4xl px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      <Link href="/#research" className="mono-label inline-flex items-center gap-2 hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Research
      </Link>
      <Reveal>
        <div className="mono-label mt-10 flex flex-wrap gap-x-5 gap-y-2">
          <span className="text-cyan">{p.kind}</span>
          <span>{p.year}</span>
          <span>{p.status}</span>
        </div>
        <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[1.05] tracking-tight">{p.title}</h1>
        <p className="mt-5 text-lg text-fg/85">{authorsOf(p).join(", ")}</p>
        <p className="mt-1 text-muted">{p.venue}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {p.url && (
            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition hover:bg-cyan">
              {p.doi ? `DOI ${p.doi}` : "Read it"} <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          {related && (
            <Link href={`/projects/${related.slug}`} className="glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm">
              Project: {related.title} <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </Reveal>
      {p.summary && (
        <Reveal className="mt-14">
          <h2 className="mono-label mb-3">In plain language</h2>
          <p className="text-xl leading-relaxed text-fg/90">{p.summary}</p>
        </Reveal>
      )}
      {p.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="rounded-full border border-line px-3 py-1 text-sm text-fg/75">
              {t}
            </span>
          ))}
        </div>
      )}
      <Reveal className="mt-14">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="mono-label">Cite</h2>
          <CopyButton text={bibtex(p)} label="Copy BibTeX" />
        </div>
        <pre className="overflow-x-auto rounded-2xl border border-line bg-[#05070c] p-4 font-mono text-xs text-fg/80">{bibtex(p)}</pre>
      </Reveal>
    </article>
  );
}

export default function ResearchPage(props: PageProps<"/research/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Detail params={props.params} />
    </Suspense>
  );
}
