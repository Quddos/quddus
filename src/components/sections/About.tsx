import Image from "next/image";
import type { Profile, SkillGroup } from "@/lib/types";
import { Reveal } from "../Reveal";
import { SectionHeader } from "./SectionHeader";

export function About({ profile, skills }: { profile: Profile; skills: SkillGroup[] }) {
  const allSkills = skills.flatMap((s) => s.items);
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40">
      <SectionHeader index="00" label="Signal" title="One engineer across" accent="neuroscience, AI and XR." />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-panel-solid">
            {profile.photo && (
              <Image
                src={profile.photo}
                alt={profile.name}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-top grayscale-[35%] transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                priority={false}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-cyan/10 to-transparent [animation:scan_5s_linear_infinite]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="mono-label mb-2 text-cyan">Subject · ID 0001</div>
              <div className="font-display text-2xl font-semibold">{profile.name}</div>
              <div className="text-sm text-muted">{profile.location}</div>
            </div>
            {["left-4 top-4 border-l border-t", "right-4 top-4 border-r border-t", "bottom-4 left-4 border-b border-l", "bottom-4 right-4 border-b border-r"].map((c) => (
              <span key={c} className={`absolute h-5 w-5 border-cyan/70 ${c}`} />
            ))}
          </div>
        </Reveal>
        <div className="flex flex-col justify-between gap-10">
          <Reveal delay={0.1}>
            <p className="text-2xl leading-relaxed text-fg/90 md:text-[1.7rem] md:leading-[1.5]">{profile.bio}</p>
            <p className="mt-5 text-muted">{profile.headline}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
              {profile.stats.map((s) => (
                <div key={s.label} className="bg-bg-2 p-5">
                  <div className="font-display text-4xl font-semibold tracking-tight">{s.value}</div>
                  <div className="mt-1 text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="grid gap-3 sm:grid-cols-2">
              {skills.map((g) => (
                <div key={g.id} className="rounded-2xl border border-line bg-bg-2/60 p-4">
                  <div className="mono-label mb-3">{g.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((i) => (
                      <span key={i} className="rounded-full border border-line px-2.5 py-1 text-xs text-fg/80">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
      <div className="relative mt-24 overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-3xl font-medium text-dim md:text-5xl">
          {[...allSkills, ...allSkills].map((s, i) => (
            <span key={i} className="flex items-center gap-10">
              {s} <span className="text-cyan/60">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
