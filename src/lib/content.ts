import { cacheLife, cacheTag } from "next/cache";
import { fieldDefaults, SECTIONS } from "./admin-schema";
import { ensureSchema, hasDatabase, sql } from "./db";
import { seed } from "./seed";
import type { SectionKey, SiteContent } from "./types";

export const CONTENT_TAG = "content";

// Seed items added after the admin went live. Sections already saved in the
// database get them too, unless the admin has since removed them.
const ADDED_SEED_IDS = new Set(["rilstudio", "rilstudio-immersive", "rilstudio-pub", "rilstudio-hub"]);
const removedKey = (key: string) => `removed:${key}`;

// Reads every section, preferring what was saved in /admin over the seed.
export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAG);
  return readContent();
}

export async function readContent(): Promise<SiteContent> {
  const content: SiteContent = structuredClone(seed);
  if (!hasDatabase()) return content;
  try {
    await ensureSchema();
    const rows = (await sql()`SELECT key, data FROM content`) as { key: string; data: unknown }[];
    const removed = new Map(rows.filter((r) => r.key.startsWith("removed:")).map((r) => [r.key, r.data]));
    for (const row of rows) {
      const schema = SECTIONS.find((sc) => sc.key === row.key);
      if (!schema) continue;
      const data = normalise(schema.key, row.data);
      (content as Record<string, unknown>)[row.key] = schema.kind === "list" ? withAddedSeed(schema.key, data as Item[], removed.get(removedKey(row.key))) : data;
    }
  } catch (err) {
    console.error("Falling back to seed content:", err);
  }
  return content;
}

type Item = { id: string };

// Insert new seed items after their seed predecessor, skipping any the admin removed.
function withAddedSeed(key: SectionKey, items: Item[], removed: unknown): Item[] {
  const gone = new Set(Array.isArray(removed) ? removed : []);
  const out = [...items];
  const seedItems = seed[key] as unknown as Item[];
  seedItems.forEach((item, i) => {
    if (!ADDED_SEED_IDS.has(item.id) || gone.has(item.id) || out.some((o) => o.id === item.id)) return;
    const prev = seedItems.slice(0, i).reverse().find((p) => out.some((o) => o.id === p.id));
    out.splice(prev ? out.findIndex((o) => o.id === prev.id) + 1 : 0, 0, structuredClone(item));
  });
  return out;
}

// Fill in any missing or mistyped fields so a bad edit can't break a page.
function normalise(key: SectionKey, data: unknown): unknown {
  const schema = SECTIONS.find((sc) => sc.key === key)!;
  const defaults = fieldDefaults(schema);
  const fix = (raw: unknown, base: Record<string, unknown>, i: number) => {
    const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const out: Record<string, unknown> = { ...base, ...obj };
    for (const [k, v] of Object.entries(base)) {
      if (Array.isArray(v) !== Array.isArray(out[k]) || (out[k] !== null && typeof out[k] !== typeof v)) out[k] = v;
      if (out[k] === null || out[k] === undefined) out[k] = v;
    }
    if (schema.kind === "list" && typeof out.id !== "string") out.id = `${key}-${i}`;
    return out;
  };
  if (schema.kind === "object") return fix(data, { ...defaults, ...(seed[key] as object) }, 0);
  return Array.isArray(data) ? data.map((item, i) => fix(item, defaults, i)) : seed[key];
}

export async function saveSection(key: SectionKey, data: unknown) {
  await ensureSchema();
  await sql()`INSERT INTO content (key, data, updated_at)
    VALUES (${key}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  if (Array.isArray(data)) {
    const kept = new Set(data.map((item) => (item as Partial<Item>)?.id));
    const removed = (seed[key] as unknown as Item[]).filter((item) => ADDED_SEED_IDS.has(item.id) && !kept.has(item.id)).map((item) => item.id);
    await sql()`INSERT INTO content (key, data, updated_at)
      VALUES (${removedKey(key)}, ${JSON.stringify(removed)}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  }
}

export async function resetSection(key: SectionKey) {
  await ensureSchema();
  await sql()`DELETE FROM content WHERE key = ${key} OR key = ${removedKey(key)}`;
}
