import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// The Vercel Neon integration may expose the connection string under either name.
export const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

let client: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function hasDatabase() {
  return databaseUrl.length > 0;
}

export function sql() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is not configured");
  client ??= neon(databaseUrl);
  return client;
}

// Tables are created on first use so a fresh Neon database needs no migration step.
export function ensureSchema() {
  schemaReady ??= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS content (
      key text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS admin_users (
      username text PRIMARY KEY,
      password_hash text NOT NULL,
      is_default boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      intent text NOT NULL DEFAULT 'general',
      body text NOT NULL,
      read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS api_keys (
      id serial PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      purpose text NOT NULL DEFAULT '',
      prefix text NOT NULL,
      key_hash text NOT NULL UNIQUE,
      ip_hash text NOT NULL DEFAULT '',
      revoked boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_used_at timestamptz
    )`;
    // One row per caller per day; caller is "key:<id>" or "ip:<hash>" for the playground.
    await q`CREATE TABLE IF NOT EXISTS api_usage (
      caller text NOT NULL,
      day date NOT NULL DEFAULT current_date,
      requests integer NOT NULL DEFAULT 0,
      PRIMARY KEY (caller, day)
    )`;
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}
