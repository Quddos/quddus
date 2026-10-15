import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectVisual } from "@/components/ProjectVisual";
import { Reveal } from "@/components/Reveal";
import { getContent } from "@/lib/content";
import { seed } from "@/lib/seed";

export async function generateStaticParams() {
  const c = await getContent();
  const slugs = c.projects.length ? c.projects : seed.projects;
  return slugs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getContent()).projects.find((x) => x.slug === slug);
  if (!p) return { title: "Project" };
  return { title: p.title, description: p.tagline, openGraph: { images: p.cover ? [p.cover] : undefined } };
}

function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getContent();
  const index = c.projects.findIndex((x) => x.slug === slug);
  const p = c.projects[index];
  if (!p) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-40 text-center">
        <h1 className="font-display text-4xl font-semibold">Project not found</h1>
        <Link href="/#lab" className="mt-6 inline-block text-cyan">
          Back to the Lab
        </Link>
      </div>
    );
  }
  const next = c.projects[(index + 1) % c.projects.length];
  const embed = p.video ? embedUrl(p.video) : null;
  const team = c.people.filter((person) => person.consent && c.publications.some((pub) => pub.authors.includes(person.name) && pub.title.toLowerCase().includes(p.title.toLowerCase().split(" ")[0])));

  return (
    <article style={{ "--accent": p.accent } as React.CSSProperties}>
      <header className="relative mx-auto max-w-7xl px-5 pb-12 pt-32 md:px-10 md:pt-40">
        <Link href="/#lab" className="mono-label inline-flex items-center gap-2 hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" /> The Lab
        </Link>
        <Reveal>
          <div className="mono-label mt-10 flex flex-wrap gap-x-6 gap-y-2">
            <span style={{ color: p.accent }}>{p.category}</span>
            <span>{p.year}</span>
            <span>{p.status}</span>
          </div>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.04em]">{p.title}</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted md:text-2xl">{p.tagline}</p>
          {p.links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {p.links.map((l, i) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className={i === 0 ? "inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg transition hover:bg-cyan" : "glass inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm"}
                >
                  {l.label} <ArrowUpRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </Reveal>
      </header>

      <Reveal className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="group relative aspect-video overflow-hidden rounded-3xl border border-line">
          {embed ? (
            <iframe src={embed} title={p.title} className="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          ) : (
            <ProjectVisual project={p} priority />
          )}
        </div>
      </Reveal>

      {p.model3d && (
        <Reveal className="mx-auto mt-6 max-w-7xl px-5 md:px-10">
          <ModelViewer src={p.model3d} title={p.title} />
        </Reveal>
      )}

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Reveal>
          <div className="mono-label mb-4">Overview</div>
          <p className="whitespace-pre-line text-xl leading-relaxed text-fg/90">{p.description}</p>
          {p.highlights.length > 0 && (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {p.highlights.map((h) => (
                <li key={h} className="rounded-2xl border border-line bg-bg-2 p-5">
                  <span className="mb-2 block h-1 w-8 rounded-full" style={{ background: p.accent }} />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
        <Reveal delay={0.1} className="space-y-6">
          <div className="rounded-3xl border border-line bg-bg-2 p-6">
            <div className="mono-label mb-4">Stack</div>
            <div className="flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span key={t} className="rounded-full border border-line px-3 py-1 text-sm text-fg/80">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {team.length > 0 && (
            <div className="rounded-3xl border border-line bg-bg-2 p-6">
              <div className="mono-label mb-4">Collaborators</div>
              <div className="space-y-3">
                {team.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-line font-mono text-xs">
                      {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted">{t.org || t.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Reveal>
      </div>

      {next && next.slug !== p.slug && (
        <Link href={`/projects/${next.slug}`} className="group block border-t border-line">
          <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5 py-16 md:px-10">
            <div>
              <div className="mono-label">Next project</div>
              <div className="mt-3 font-display text-4xl font-semibold tracking-tight transition group-hover:text-cyan md:text-6xl">{next.title}</div>
            </div>
            <ArrowUpRight className="h-10 w-10 shrink-0 transition group-hover:rotate-45" />
          </div>
        </Link>
      )}
    </article>
  );
}

function ModelViewer({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-2">
      <iframe
        title={`${title} 3D model`}
        className="h-[60vh] w-full"
        srcDoc={`<!doctype html><html><head><script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script><style>html,body{margin:0;height:100%;background:#080a12}model-viewer{width:100%;height:100%;--poster-color:transparent}</style></head><body><model-viewer src="${src.replace(/"/g, "")}" camera-controls auto-rotate shadow-intensity="1" exposure="1.1" environment-image="neutral"></model-viewer></body></html>`}
      />
      <div className="mono-label pointer-events-none absolute left-4 top-4">3D model · drag to rotate</div>
    </div>
  );
}

export default function ProjectPage(props: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <ProjectDetail params={props.params} />
    </Suspense>
  );
}
