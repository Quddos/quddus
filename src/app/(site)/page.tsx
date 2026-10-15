import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hub } from "@/components/sections/Hub";
import { Journey } from "@/components/sections/Journey";
import { Lab } from "@/components/sections/Lab";
import { NetworkSection } from "@/components/sections/NetworkSection";
import { Research } from "@/components/sections/Research";
import { getContent } from "@/lib/content";

export default async function Home() {
  const c = await getContent();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.profile.name,
    jobTitle: c.profile.headline,
    email: `mailto:${c.profile.email}`,
    sameAs: c.profile.socials.filter((s) => s.url.startsWith("http")).map((s) => s.url),
    affiliation: { "@type": "Organization", name: "SRM University-AP" },
    knowsAbout: c.skills.flatMap((s) => s.items),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero profile={c.profile} peopleCount={c.people.length} projectCount={c.projects.length} />
      <About profile={c.profile} skills={c.skills} />
      <Lab projects={c.projects} />
      <Research publications={c.publications} />
      <Journey experience={c.experience} education={c.education} leadership={c.leadership} />
      <NetworkSection profile={c.profile} people={c.people} projects={c.projects} publications={c.publications} talks={c.talks} />
      <Hub tools={c.hub} />
      <Contact profile={c.profile} />
    </>
  );
}
