import { Glasses } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { ProjectVisual } from "../ProjectVisual";
import { Reveal } from "../Reveal";
import { ProjectCard } from "./ProjectCard";
import { SectionHeader } from "./SectionHeader";

export function Lab({ projects }: { projects: Project[] }) {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);
  return (
    <section id="lab" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader
        index="01"
        label="The Lab"
        title="Things I've built that"
        accent="move, heal and think."
        description="Shipped VR on the Meta Quest Store, mixed-reality surgical training, EEG-driven rehabilitation and open models. Open any project for the full story, media and links."
      />
      <Reveal className="-mt-6 mb-10">
        <Link href="/vr" className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition hover:border-cyan/50">
          <Glasses className="h-4 w-4 text-cyan" /> Walk through the Lab in VR
        </Link>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-6">
        {featured.map((p, i) => (
          <Reveal key={p.id} delay={(i % 2) * 0.08} className={i % 4 === 0 || i % 4 === 3 ? "md:col-span-4" : "md:col-span-2"}>
            <ProjectCard project={p} large={i % 4 === 0 || i % 4 === 3}>
              <ProjectVisual project={p} priority={i === 0} />
            </ProjectCard>
          </Reveal>
        ))}
        {rest.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.06} className="md:col-span-2">
            <ProjectCard project={p}>
              <ProjectVisual project={p} />
            </ProjectCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
