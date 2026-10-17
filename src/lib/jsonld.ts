import { abs, NAME_VARIANTS, SITE_URL } from "./site";
import type { Project, Publication, SiteContent } from "./types";

export const PERSON_ID = `${SITE_URL}/#person`;

export function personLd(c: SiteContent) {
  const p = c.profile;
  const current = c.experience.find((e) => /present/i.test(e.end));
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: p.name,
    alternateName: NAME_VARIANTS.filter((n) => n !== p.name),
    url: SITE_URL,
    image: abs(p.photo.startsWith("/media/raheem.webp") ? "/media/raheem-og.jpg" : p.photo),
    jobTitle: p.headline,
    description: p.bio,
    email: `mailto:${p.email}`,
    sameAs: p.socials.map((s) => s.url).filter((u) => u.startsWith("http")),
    knowsAbout: c.skills.flatMap((s) => s.items),
    ...(current && { worksFor: { "@type": "Organization", name: current.org } }),
    alumniOf: c.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
    homeLocation: { "@type": "Place", name: p.location },
  };
}

export function websiteLd(c: SiteContent) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: `${c.profile.name}: AI, BCI & XR`,
    author: { "@id": PERSON_ID },
    inLanguage: "en",
  };
}

export const breadcrumbs = (items: [string, string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

export function projectLd(p: Project) {
  const isGame = /game/i.test(p.category);
  const isSoftware = /open.?source|framework|api|model/i.test(`${p.category} ${p.status}`);
  return {
    "@type": isGame ? "VideoGame" : isSoftware ? "SoftwareSourceCode" : "CreativeWork",
    "@id": abs(`/projects/${p.slug}#work`),
    name: p.title,
    headline: p.tagline,
    description: p.description,
    url: abs(`/projects/${p.slug}`),
    image: abs(p.cover || "/media/raheem-og.jpg"),
    author: { "@id": PERSON_ID },
    creator: { "@id": PERSON_ID },
    dateCreated: p.year,
    keywords: p.tech.join(", "),
    sameAs: p.links.map((l) => l.url).filter((u) => u.startsWith("http")),
    ...(isGame && { gamePlatform: "Meta Quest", genre: p.category, playMode: "SinglePlayer" }),
    ...(p.video && { video: { "@type": "VideoObject", name: `${p.title} video`, contentUrl: abs(p.video), thumbnailUrl: p.cover ? abs(p.cover) : undefined, uploadDate: `${p.year}-01-01`, description: p.tagline } }),
  };
}

export const isPatent = (p: Publication) => /^patent/i.test(p.kind);

export function publicationLd(p: Publication) {
  return {
    "@type": isPatent(p) ? "CreativeWork" : "ScholarlyArticle",
    "@id": abs(`/research/${p.id}#work`),
    headline: p.title,
    name: p.title,
    abstract: p.summary,
    url: abs(`/research/${p.id}`),
    datePublished: p.year,
    author: p.authors.split(/,\s*/).map((name) => (/qud/i.test(name) ? { "@id": PERSON_ID } : { "@type": "Person", name: name.trim() })),
    keywords: p.tags.join(", "),
    creativeWorkStatus: p.status,
    ...(p.doi && { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: p.doi }, sameAs: `https://doi.org/${p.doi}` }),
    ...(p.venue && { isPartOf: { "@type": isPatent(p) ? "Organization" : "Periodical", name: p.venue } }),
  };
}

export const graph = (...nodes: object[]) => JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
