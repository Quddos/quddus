import type { Person, Profile, Project, Publication, Talk } from "@/lib/types";
import { Connectome } from "../network/Connectome";
import { Reveal } from "../Reveal";
import { GlobeView } from "./GlobeView";
import { SectionHeader } from "./SectionHeader";

export function NetworkSection({
  profile,
  people,
  projects,
  publications,
  talks,
}: {
  profile: Profile;
  people: Person[];
  projects: Project[];
  publications: Publication[];
  talks: Talk[];
}) {
  const mentees = people.filter((p) => p.group === "Mentorship");
  return (
    <section id="network" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="04"
        label="Connectome"
        title="The people, communities and work"
        accent="wired into everything."
        description="Co-authors, partners and the students I mentor, drawn as a living neural network. Signals travel along every connection."
      />
      <Reveal>
        <Connectome profile={profile} people={people} projects={projects} publications={publications} />
      </Reveal>

      <div className="mt-24 grid gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <div className="mono-label mb-4 text-violet">Mentorship</div>
          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Paying the signal forward.</h3>
          <p className="mt-4 max-w-lg text-muted">
            Lab cohorts, ideathon teams and workshop students I&apos;ve taught or mentored in brain-signal processing,
            XR development and clinical validation.
          </p>
          <div className="mt-8 space-y-3">
            {mentees.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-bg-2 p-4">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-muted">{[m.role, m.org].filter(Boolean).join(" · ")}</div>
                </div>
                <span className="font-mono text-xs text-dim">{m.since}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mono-label mb-4 text-amber">Talks & workshops</div>
          <div className="relative aspect-square w-full">
            <GlobeView pins={talks.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng, label: t.title }))} />
          </div>
          <div className="mt-4 grid gap-2">
            {talks.map((t) => (
              <div key={t.id} className="flex items-baseline justify-between gap-4 border-t border-line pt-2 text-sm">
                <span>
                  {t.title} <span className="text-dim">· {t.role}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-dim">
                  {t.location} · {t.year}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
