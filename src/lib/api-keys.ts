import { createHash, randomBytes } from "node:crypto";
import { ensureSchema, sql } from "./db";

// Free-tier limits. Override in the deployment environment to tune spend.
export const LIMITS = {
  keyDaily: Number(process.env.QUD_KEY_DAILY_LIMIT || 200),
  playgroundDaily: Number(process.env.QUD_PLAYGROUND_DAILY_LIMIT || 30),
  askDaily: Number(process.env.QUD_ASK_DAILY_LIMIT || 40),
  globalDaily: Number(process.env.QUD_GLOBAL_DAILY_LIMIT || 3000),
  keysPerEmail: 3,
  keysPerIpPerDay: 5,
  maxOutputTokens: 1024,
  maxInputChars: 24000,
};

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function newKey() {
  const bytes = randomBytes(32);
  let body = "";
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  return `qud_sk_${body}`;
}

export type KeyRecord = { id: number; name: string; revoked: boolean };

export async function findKey(key: string): Promise<KeyRecord | null> {
  if (!key.startsWith("qud_sk_")) return null;
  await ensureSchema();
  const rows = (await sql()`SELECT id, name, revoked FROM api_keys WHERE key_hash = ${hash(key)}`) as KeyRecord[];
  return rows[0] ?? null;
}

export async function createKey(input: { name: string; email: string; purpose: string; ip: string }) {
  await ensureSchema();
  const email = input.email.toLowerCase();
  const ipHash = hash(`ip:${input.ip}`);
  const [byEmail, byIp] = (await Promise.all([
    sql()`SELECT count(*)::int AS n FROM api_keys WHERE email = ${email} AND revoked = false`,
    sql()`SELECT count(*)::int AS n FROM api_keys WHERE ip_hash = ${ipHash} AND created_at > now() - interval '1 day'`,
  ])) as { n: number }[][];
  if (byEmail[0].n >= LIMITS.keysPerEmail) return { error: `This email already has ${LIMITS.keysPerEmail} active keys.` };
  if (byIp[0].n >= LIMITS.keysPerIpPerDay) return { error: "Too many keys created from this network today. Try again tomorrow." };
  const key = newKey();
  await sql()`INSERT INTO api_keys (name, email, purpose, prefix, key_hash, ip_hash)
    VALUES (${input.name}, ${email}, ${input.purpose}, ${key.slice(0, 14)}, ${hash(key)}, ${ipHash})`;
  return { key };
}

// Counts a request against the caller's and the site's daily budget.
// Returns the reason when a limit is hit.
export async function consume(caller: string, limit: number): Promise<string | null> {
  await ensureSchema();
  const total = (await sql()`SELECT coalesce(sum(requests), 0)::int AS n FROM api_usage WHERE day = current_date`) as { n: number }[];
  if (total[0].n >= LIMITS.globalDaily) return "The free tier has reached today's capacity. Please try again tomorrow.";
  // Only counts the request while under the limit, so rejected calls don't use up the site budget.
  const rows = (await sql()`INSERT INTO api_usage (caller, day, requests) VALUES (${caller}, current_date, 1)
    ON CONFLICT (caller, day) DO UPDATE SET requests = api_usage.requests + 1
    WHERE api_usage.requests < ${limit}
    RETURNING requests`) as { requests: number }[];
  if (rows.length === 0) return `Daily limit of ${limit} requests reached. It resets at midnight UTC.`;
  return null;
}
