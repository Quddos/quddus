"use server";

import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { ensureCareerSchema, slugify, weekStart } from "@/lib/career-db";
import { sql } from "@/lib/db";

export type AdminState = { error?: string; ok?: string };

async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not signed in");
  await ensureCareerSchema();
  return admin;
}

const jobSchema = z.object({
  id: z.number().int().optional(),
  slug: z.string().trim().max(80).default(""),
  title: z.string().trim().min(3, "Give the role a title.").max(140),
  blurb: z.string().trim().max(600).default(""),
  employment_type: z.string().trim().max(80).default("Part-time"),
  location: z.string().trim().max(80).default("Remote"),
  schedule: z.string().trim().max(120).default(""),
  hours_per_week: z.string().trim().max(60).default(""),
  pay_rate: z.string().trim().max(120).default(""),
  payout_schedule: z.string().trim().max(120).default(""),
  description: z.string().trim().max(8000).default(""),
  responsibilities: z.array(z.string().trim().max(400)).max(30).default([]),
  requirements: z.array(z.string().trim().max(400)).max(30).default([]),
  status: z.enum(["open", "closed", "draft"]).default("open"),
});

export type JobInput = z.input<typeof jobSchema>;

export async function saveJobAction(input: JobInput): Promise<AdminState & { id?: number; slug?: string }> {
  await requireAdmin();
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  const j = parsed.data;
  const base = slugify(j.slug || j.title);

  // Keep slugs unique without surprising the admin: append -2, -3 … if taken.
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const clash = (await sql()`SELECT id FROM career_jobs WHERE slug = ${slug} LIMIT 1`) as { id: number }[];
    if (clash.length === 0 || clash[0].id === j.id) break;
    slug = `${base}-${n}`;
  }

  const resp = JSON.stringify(j.responsibilities.filter(Boolean));
  const req = JSON.stringify(j.requirements.filter(Boolean));

  if (j.id) {
    await sql()`UPDATE career_jobs SET slug = ${slug}, title = ${j.title}, blurb = ${j.blurb},
      employment_type = ${j.employment_type}, location = ${j.location}, schedule = ${j.schedule},
      hours_per_week = ${j.hours_per_week}, pay_rate = ${j.pay_rate}, payout_schedule = ${j.payout_schedule},
      description = ${j.description}, responsibilities = ${resp}::jsonb, requirements = ${req}::jsonb,
      status = ${j.status}, updated_at = now() WHERE id = ${j.id}`;
    return { ok: "Opening updated.", id: j.id, slug };
  }
  const rows = (await sql()`INSERT INTO career_jobs
    (slug, title, blurb, employment_type, location, schedule, hours_per_week, pay_rate, payout_schedule,
     description, responsibilities, requirements, status)
    VALUES (${slug}, ${j.title}, ${j.blurb}, ${j.employment_type}, ${j.location}, ${j.schedule},
      ${j.hours_per_week}, ${j.pay_rate}, ${j.payout_schedule}, ${j.description}, ${resp}::jsonb, ${req}::jsonb, ${j.status})
    RETURNING id`) as { id: number }[];
  return { ok: "Opening published.", id: rows[0].id, slug };
}

export async function deleteJobAction(id: number): Promise<AdminState> {
  await requireAdmin();
  await sql()`DELETE FROM career_jobs WHERE id = ${id}`;
  return { ok: "Opening deleted." };
}

export async function setApplicationAction(
  id: number,
  patch: { status?: string; note?: string },
): Promise<AdminState> {
  await requireAdmin();
  const status = z.enum(["submitted", "reviewing", "interview", "hired", "rejected"]).optional().safeParse(patch.status);
  if (!status.success) return { error: "Unknown status." };
  if (status.data) await sql()`UPDATE career_applications SET status = ${status.data}, updated_at = now() WHERE id = ${id}`;
  if (patch.note !== undefined)
    await sql()`UPDATE career_applications SET note = ${patch.note.slice(0, 2000)}, updated_at = now() WHERE id = ${id}`;
  return { ok: "Saved." };
}

export async function deleteApplicantAction(id: number): Promise<AdminState> {
  await requireAdmin();
  await sql()`DELETE FROM career_applicants WHERE id = ${id}`;
  return { ok: "Applicant removed." };
}

const payoutSchema = z.object({
  applicantId: z.number().int(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a week."),
  hours: z.number().min(0).max(200),
  amount: z.number().min(0).max(100000),
  currency: z.string().trim().min(3).max(5),
  status: z.enum(["pending", "processing", "paid"]).default("pending"),
  reference: z.string().trim().max(120).default(""),
  note: z.string().trim().max(400).default(""),
});

export type PayoutInput = z.input<typeof payoutSchema>;

export async function savePayoutAction(input: PayoutInput): Promise<AdminState> {
  await requireAdmin();
  const parsed = payoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the payout fields." };
  const p = parsed.data;
  const paidAt = p.status === "paid" ? new Date().toISOString() : null;
  await sql()`INSERT INTO career_payouts (applicant_id, week_start, hours, amount, currency, status, reference, note, paid_at)
    VALUES (${p.applicantId}, ${p.weekStart}, ${p.hours}, ${p.amount}, ${p.currency}, ${p.status}, ${p.reference}, ${p.note}, ${paidAt})`;
  return { ok: "Payout recorded." };
}

export async function setPayoutStatusAction(id: number, status: "pending" | "processing" | "paid"): Promise<AdminState> {
  await requireAdmin();
  const paidAt = status === "paid" ? new Date().toISOString() : null;
  await sql()`UPDATE career_payouts SET status = ${status}, paid_at = ${paidAt} WHERE id = ${id}`;
  return { ok: "Payout updated." };
}

export async function deletePayoutAction(id: number): Promise<AdminState> {
  await requireAdmin();
  await sql()`DELETE FROM career_payouts WHERE id = ${id}`;
  return { ok: "Payout deleted." };
}

// One pending payout per hired applicant for the given week, skipping anyone
// who already has a row for it.
export async function generateWeekAction(input: {
  weekStart?: string;
  hours: number;
  amount: number;
  currency: string;
}): Promise<AdminState> {
  await requireAdmin();
  const week = /^\d{4}-\d{2}-\d{2}$/.test(input.weekStart ?? "") ? input.weekStart! : weekStart();
  const hours = Math.max(0, Math.min(200, Number(input.hours) || 0));
  const amount = Math.max(0, Math.min(100000, Number(input.amount) || 0));
  const currency = (input.currency || "USD").slice(0, 5);
  const rows = (await sql()`SELECT DISTINCT applicant_id FROM career_applications WHERE status = 'hired'`) as {
    applicant_id: number;
  }[];
  let made = 0;
  for (const r of rows) {
    const exists = (await sql()`SELECT id FROM career_payouts WHERE applicant_id = ${r.applicant_id}
      AND week_start = ${week} LIMIT 1`) as { id: number }[];
    if (exists.length) continue;
    await sql()`INSERT INTO career_payouts (applicant_id, week_start, hours, amount, currency, status)
      VALUES (${r.applicant_id}, ${week}, ${hours}, ${amount}, ${currency}, 'pending')`;
    made++;
  }
  return made ? { ok: `Created ${made} pending payout${made > 1 ? "s" : ""} for the week of ${week}.` }
              : { ok: "Everyone hired already has a payout for that week." };
}
