// Sessions for career-portal applicants. Separate cookie and separate table
// from the /admin account, but the same database and the same JWT secret.
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { databaseUrl } from "./db";
import { ensureCareerSchema, getApplicant } from "./career-db";

export const CAREER_COOKIE = "qud_career";
const SESSION_DAYS = 30;

function secretKey() {
  const raw =
    process.env.AUTH_SECRET ||
    (databaseUrl ? createHash("sha256").update(`qud-career:${databaseUrl}`).digest("hex") : "qud-dev-only-secret");
  return new TextEncoder().encode(raw);
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function createCareerSession(applicantId: number) {
  const token = await new SignJWT({ sub: String(applicantId), kind: "career" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  (await cookies()).set(CAREER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroyCareerSession() {
  (await cookies()).delete(CAREER_COOKIE);
}

export async function careerSessionId() {
  const token = (await cookies()).get(CAREER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== "career") return null;
    const id = Number(payload.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

// The signed-in applicant, or null. Safe to call from any server component.
export async function currentApplicant() {
  const id = await careerSessionId();
  if (!id) return null;
  await ensureCareerSchema();
  return getApplicant(id);
}
