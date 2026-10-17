import type { SectionKey } from "./types";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "media"
  | "list"
  | "links"
  | "stats"
  | "bool"
  | "number"
  | "color"
  | "select";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  wide?: boolean;
};

export type SectionSchema = {
  key: SectionKey;
  label: string;
  description: string;
  kind: "object" | "list";
  titleKey?: string;
  subtitleKey?: string;
  fields: Field[];
};

export const SECTIONS: SectionSchema[] = [
  {
    key: "profile",
    label: "Profile",
    description: "Name, headline, bio, photo, stats and social links.",
    kind: "object",
    fields: [
      { key: "name", label: "Full name", type: "text" },
      { key: "headline", label: "Headline", type: "text", wide: true },
      { key: "tagline", label: "Tagline (hero)", type: "text", wide: true },
      { key: "roles", label: "Rotating roles (hero)", type: "list" },
      { key: "location", label: "Location", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "photo", label: "Portrait photo", type: "media", help: "Shown in the About section and the network graph." },
      { key: "cvUrl", label: "CV (PDF)", type: "media" },
      { key: "bio", label: "Bio", type: "textarea", wide: true },
      { key: "availability", label: "Availability line", type: "text", wide: true },
      { key: "stats", label: "Stats", type: "stats", wide: true },
      { key: "socials", label: "Social links", type: "links", wide: true },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    description: "The Lab. Each project gets its own page with media, a 3D model and links.",
    kind: "list",
    titleKey: "title",
    subtitleKey: "category",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "slug", label: "URL slug", type: "text", help: "Used in /projects/<slug>. Lowercase, dashes." },
      { key: "tagline", label: "Tagline", type: "text", wide: true },
      { key: "category", label: "Category", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "status", label: "Status", type: "text", help: "e.g. Live, Published, Prototype" },
      { key: "accent", label: "Accent colour", type: "color" },
      { key: "featured", label: "Featured (large card)", type: "bool" },
      { key: "cover", label: "Cover image", type: "media" },
      { key: "video", label: "Video", type: "media", help: "Upload an MP4/WebM or paste a YouTube/Vimeo link." },
      { key: "model3d", label: "3D model (.glb)", type: "media", help: "Shown as a rotatable 3D viewer on the project page." },
      { key: "description", label: "Description", type: "textarea", wide: true },
      { key: "highlights", label: "Highlights", type: "list", wide: true },
      { key: "tech", label: "Tech stack", type: "list", wide: true },
      { key: "links", label: "Links", type: "links", wide: true },
    ],
  },
  {
    key: "publications",
    label: "Research & patents",
    description: "Papers, frameworks and patents. Kinds starting with “Patent” appear in the patents row.",
    kind: "list",
    titleKey: "title",
    subtitleKey: "venue",
    fields: [
      { key: "title", label: "Title", type: "text", wide: true },
      { key: "authors", label: "Authors", type: "text", wide: true },
      { key: "venue", label: "Venue", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "kind", label: "Kind", type: "text", help: "e.g. Journal article, Conference paper, Patent · 2025…" },
      { key: "status", label: "Status", type: "select", options: ["Published", "Under review", "Released", "In preparation"] },
      { key: "doi", label: "DOI", type: "text" },
      { key: "url", label: "Link", type: "url" },
      { key: "summary", label: "Plain-language summary", type: "textarea", wide: true },
      { key: "tags", label: "Tags", type: "list", wide: true },
    ],
  },
  {
    key: "experience",
    label: "Experience",
    description: "Roles on the Journey timeline. Dates as YYYY-MM or “Present”.",
    kind: "list",
    titleKey: "role",
    subtitleKey: "org",
    fields: [
      { key: "role", label: "Role", type: "text" },
      { key: "org", label: "Organisation", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "start", label: "Start (YYYY-MM)", type: "text" },
      { key: "end", label: "End (YYYY-MM or Present)", type: "text" },
      { key: "summary", label: "Summary", type: "textarea", wide: true },
      { key: "highlights", label: "Highlights", type: "list", wide: true },
      { key: "tags", label: "Tags", type: "list", wide: true },
    ],
  },
  {
    key: "people",
    label: "Network & mentees",
    description: "Collaborators, partners and mentees in the connectome. Only people with consent show their name and photo.",
    kind: "list",
    titleKey: "name",
    subtitleKey: "group",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "group", label: "Cluster", type: "select", options: ["Research", "Community", "Mentorship", "Industry"] },
      { key: "relation", label: "Relation", type: "select", options: ["Co-author", "Collaborator", "Mentored", "Mentor", "Leadership", "Colleague"] },
      { key: "role", label: "Role / title", type: "text" },
      { key: "org", label: "Organisation", type: "text" },
      { key: "since", label: "Since (year)", type: "text" },
      { key: "photo", label: "Photo", type: "media" },
      { key: "url", label: "Profile link", type: "url" },
      { key: "consent", label: "Has agreed to be shown by name", type: "bool" },
      { key: "note", label: "Note (what you did together)", type: "textarea", wide: true },
    ],
  },
  {
    key: "talks",
    label: "Talks & workshops",
    description: "Events on the globe. Latitude/longitude place the pin.",
    kind: "list",
    titleKey: "title",
    subtitleKey: "location",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "event", label: "Event / host", type: "text" },
      { key: "role", label: "Your role", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "lat", label: "Latitude", type: "number" },
      { key: "lng", label: "Longitude", type: "number" },
      { key: "url", label: "Link", type: "url" },
    ],
  },
  {
    key: "skills",
    label: "Skills",
    description: "Skill groups shown in the About section and the marquee.",
    kind: "list",
    titleKey: "name",
    fields: [
      { key: "name", label: "Group name", type: "text" },
      { key: "items", label: "Skills", type: "list", wide: true },
    ],
  },
  {
    key: "hub",
    label: "AI Hub tools",
    description: "Models and APIs listed in the AI Hub.",
    kind: "list",
    titleKey: "name",
    subtitleKey: "status",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "kind", label: "Kind", type: "select", options: ["LLM", "VLM", "Motion model", "Signal pipeline", "Learning studio"] },
      { key: "status", label: "Status", type: "select", options: ["Live", "Training", "Coming soon", "Planned"] },
      { key: "endpoint", label: "Endpoint", type: "text" },
      { key: "description", label: "Description", type: "textarea", wide: true },
    ],
  },
  {
    key: "education",
    label: "Education",
    description: "Degrees.",
    kind: "list",
    titleKey: "degree",
    subtitleKey: "school",
    fields: [
      { key: "degree", label: "Degree", type: "text" },
      { key: "school", label: "School", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "start", label: "Start", type: "text" },
      { key: "end", label: "End", type: "text" },
      { key: "details", label: "Details", type: "textarea", wide: true },
    ],
  },
  {
    key: "leadership",
    label: "Leadership",
    description: "Leadership roles.",
    kind: "list",
    titleKey: "role",
    subtitleKey: "org",
    fields: [
      { key: "role", label: "Role", type: "text" },
      { key: "org", label: "Organisation", type: "text" },
      { key: "period", label: "Period", type: "text" },
    ],
  },
];

export function emptyItem(schema: SectionSchema): Record<string, unknown> {
  return { ...fieldDefaults(schema), id: Math.random().toString(36).slice(2, 10) };
}

// A value of the right shape for every field, so partial items still render.
export function fieldDefaults(schema: SectionSchema): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const f of schema.fields) {
    item[f.key] =
      f.type === "list" || f.type === "links" || f.type === "stats"
        ? []
        : f.type === "bool"
          ? f.key === "consent"
          : f.type === "number"
            ? 0
            : f.type === "color"
              ? "#3ee6c1"
              : f.type === "select"
                ? (f.options?.[0] ?? "")
                : "";
  }
  return item;
}
