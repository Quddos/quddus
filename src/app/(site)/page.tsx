import type { Metadata } from "next";
import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Hub } from "@/components/sections/Hub";
import { Journey } from "@/components/sections/Journey";
import { Lab } from "@/components/sections/Lab";
import { NetworkSection } from "@/components/sections/NetworkSection";
import { Research } from "@/components/sections/Research";
import { getContent } from "@/lib/content";
import { graph, personLd, websiteLd } from "@/lib/jsonld";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const c = await getContent();
  const jsonLd = graph(personLd(c), websiteLd(c));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
