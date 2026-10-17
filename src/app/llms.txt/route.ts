import { getContent } from "@/lib/content";
import { abs } from "@/lib/site";

// A plain-text profile for AI assistants and answer engines (llmstxt.org convention).
export async function GET() {
  const c = await getContent();
  const p = c.profile;
  const lines = [
    `# ${p.name}`,
    "",
    `> ${p.headline}. ${p.bio}`,
    "",
    `Also known as: Raheem Quddus, Quddos. Location: ${p.location}. Contact: ${p.email}.`,
    "",
    "## Profiles",
    ...p.socials.filter((s) => s.url.startsWith("http")).map((s) => `- [${s.label}](${s.url})`),
    "",
    "## Projects",
    ...c.projects.map((x) => `- [${x.title}](${abs(`/projects/${x.slug}`)}): ${x.tagline} (${x.category}, ${x.year}, ${x.status})`),
    "",
    "## Research, publications and patents",
    ...c.publications.map((x) => `- [${x.title}](${abs(`/research/${x.id}`)}): ${x.kind}, ${x.venue}, ${x.year}, ${x.status}${x.doi ? `, DOI ${x.doi}` : ""}`),
    "",
    "## Experience",
    ...c.experience.map((x) => `- ${x.role}, ${x.org} (${x.start} to ${x.end}): ${x.summary}`),
    ...c.education.map((x) => `- ${x.degree}, ${x.school} (${x.start}–${x.end})`),
    "",
    "## Tools and APIs",
    `- [QUDMI live demo](${abs("/demos/qudmi")}): full-body pose from head and hand tracking, in the browser`,
    `- [EEG Biomarker tool](${abs("/demos/eeg")}): in-browser EEG band power and artifact analysis`,
    `- [Qud-1 API and developer docs](${abs("/developers")}): free OpenAI-compatible API for XR and neurotech builders`,
    "",
    "## Skills",
    ...c.skills.map((g) => `- ${g.name}: ${g.items.join(", ")}`),
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
