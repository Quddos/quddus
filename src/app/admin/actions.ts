"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { SECTIONS } from "@/lib/admin-schema";
import {
  changePassword,
  changeUsername,
  createSession,
  destroySession,
  getAdmin,
  MissingAdminPassword,
  verifyCredentials,
} from "@/lib/auth";
import { CONTENT_TAG, resetSection, saveSection } from "@/lib/content";
import { ensureSchema, hasDatabase, sql } from "@/lib/db";
import type { SectionKey } from "@/lib/types";

export type FormState = { error?: string; ok?: string; username?: string };

async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not signed in");
  return admin;
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  if (!hasDatabase()) return { error: "DATABASE_URL is not set on this deployment. Connect Neon in Vercel first." };
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  let ok = false;
  try {
    ok = await verifyCredentials(username, password);
  } catch (e) {
    if (e instanceof MissingAdminPassword) return { error: e.message, username };
    console.error(e);
  }
  if (!ok) {
    await new Promise((r) => setTimeout(r, 700));
    return { error: "Wrong username or password.", username };
  }
  await createSession(username);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function saveSectionAction(key: SectionKey, data: unknown): Promise<FormState> {
  await requireAdmin();
  const schema = SECTIONS.find((s) => s.key === key);
  if (!schema) return { error: "Unknown section" };
  if (schema.kind === "list" && !Array.isArray(data)) return { error: "Expected a list" };
  if (schema.kind === "object" && (typeof data !== "object" || data === null || Array.isArray(data)))
    return { error: "Expected an object" };

  if (key === "projects" && Array.isArray(data)) {
    const seen = new Set<string>();
    for (const p of data as { slug?: string; title?: string }[]) {
      let slug = slugify(p.slug || p.title || "project") || "project";
      while (seen.has(slug)) slug = `${slug}-2`;
      seen.add(slug);
      p.slug = slug;
    }
  }
  try {
    await saveSection(key, data);
  } catch (e) {
    console.error(e);
    return { error: "Could not save. Check the database connection." };
  }
  updateTag(CONTENT_TAG);
  return { ok: "Saved and published." };
}

export async function resetSectionAction(key: SectionKey): Promise<FormState> {
  await requireAdmin();
  await resetSection(key);
  updateTag(CONTENT_TAG);
  return { ok: "Restored the default content." };
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const username = String(form.get("username") ?? "").trim();
  if (next.length < 10) return { error: "Use at least 10 characters." };
  if (next !== confirm) return { error: "The new passwords don't match." };
  if (!(await changePassword(admin, current, next))) return { error: "Current password is wrong." };
  if (username && username !== admin) {
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) return { error: "Username: 3–40 letters, numbers, . _ -" };
    await changeUsername(admin, username);
    await createSession(username);
  }
  return { ok: "Credentials updated." };
}

export async function messageAction(id: number, op: "read" | "unread" | "delete") {
  await requireAdmin();
  await ensureSchema();
  if (op === "delete") await sql()`DELETE FROM messages WHERE id = ${id}`;
  else await sql()`UPDATE messages SET read = ${op === "read"} WHERE id = ${id}`;
}

export async function revokeKeyAction(id: number, revoked: boolean) {
  await requireAdmin();
  await ensureSchema();
  await sql()`UPDATE api_keys SET revoked = ${revoked} WHERE id = ${id}`;
}
