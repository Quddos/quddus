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
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}
