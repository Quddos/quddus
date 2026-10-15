import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { databaseUrl, ensureSchema, hasDatabase, sql } from "./db";

export const SESSION_COOKIE = "qud_admin";
const SESSION_DAYS = 7;

// Initial credentials, used once to create the admin account on first login.
// The password lives only in the deployment's environment, never in this public repo.
export const DEFAULT_USERNAME = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "";

function secretKey() {
  const raw =
    process.env.AUTH_SECRET ||
    (databaseUrl ? createHash("sha256").update(`qud-session:${databaseUrl}`).digest("hex") : "qud-dev-only-secret");
  return new TextEncoder().encode(raw);
}

export class MissingAdminPassword extends Error {
  constructor() {
    super("Set ADMIN_PASSWORD (8+ characters) in the deployment environment to create the admin account.");
  }
}

let dummyHash: Promise<string> | null = null;

async function ensureDefaultAdmin() {
  await ensureSchema();
  const rows = (await sql()`SELECT 1 FROM admin_users LIMIT 1`) as unknown[];
  if (rows.length === 0) {
    if (DEFAULT_PASSWORD.length < 8) throw new MissingAdminPassword();
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    await sql()`INSERT INTO admin_users (username, password_hash, is_default)
      VALUES (${DEFAULT_USERNAME}, ${hash}, true) ON CONFLICT DO NOTHING`;
  }
}

export async function verifyCredentials(username: string, password: string) {
  if (!hasDatabase()) return false;
  await ensureDefaultAdmin();
  const rows = (await sql()`SELECT password_hash FROM admin_users WHERE username = ${username}`) as {
    password_hash: string;
  }[];
  if (rows.length === 0) {
    // Spend comparable time so usernames can't be probed by timing.
    dummyHash ??= bcrypt.hash("timing-equaliser", 12);
    await bcrypt.compare(password, await dummyHash);
    return false;
  }
  return bcrypt.compare(password, rows[0].password_hash);
}

export async function changePassword(username: string, current: string, next: string) {
  if (!(await verifyCredentials(username, current))) return false;
  const hash = await bcrypt.hash(next, 12);
  await sql()`UPDATE admin_users SET password_hash = ${hash}, is_default = false, updated_at = now()
    WHERE username = ${username}`;
  return true;
}

export async function changeUsername(current: string, next: string) {
  await sql()`UPDATE admin_users SET username = ${next}, updated_at = now() WHERE username = ${current}`;
}

export async function usingDefaultPassword(username: string) {
  if (!hasDatabase()) return false;
  const rows = (await sql()`SELECT is_default FROM admin_users WHERE username = ${username}`) as {
    is_default: boolean;
  }[];
  return rows[0]?.is_default ?? false;
}

export async function createSession(username: string) {
  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getAdmin() {
  return readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
