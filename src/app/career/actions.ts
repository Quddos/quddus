"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AVAILABILITY,
  COMMITMENT,
  COUNTRIES,
  CURRENCY_CODES,
  GENDERS,
  PAYOUT_METHODS,
  YEARS_OF_STUDY,
} from "@/lib/countries";
import {
  careerSessionId,
  checkPassword,
  createCareerSession,
  destroyCareerSession,
  hashPassword,
} from "@/lib/career-auth";
import { ensureCareerSchema, getApplicantByEmail, getJob } from "@/lib/career-db";
import { hasDatabase, sql } from "@/lib/db";

export type CareerState = { error?: string; ok?: string };

const codes = COUNTRIES.map((c) => c.code) as [string, ...string[]];

const profileFields = {
  fullName: z.string().trim().min(2, "Tell us your full name.").max(120),
  preferredName: z.string().trim().min(1, "What should we call you?").max(60),
  whatsapp: z
    .string()
    .trim()
    .min(6, "Add your WhatsApp number with its country code.")
    .max(32)
    .regex(/^[+]?[0-9][0-9\s().-]{5,}$/, "Use digits and a country code, e.g. +91 98765 43210."),
  gender: z.enum(GENDERS),
  countryOrigin: z.enum(codes),
  countryResidence: z.enum(codes),
  yearOfStudy: z.enum(YEARS_OF_STUDY),
  payoutCurrency: z.enum(CURRENCY_CODES as [string, ...string[]]),
  payoutMethod: z.enum(PAYOUT_METHODS.map((p) => p.value) as [string, ...string[]]),
  payoutDetails: z.string().trim().max(160).default(""),
  commitment: z.enum(COMMITMENT.map((c) => c.value) as [string, ...string[]]),
  availability: z.enum(AVAILABILITY.map((a) => a.value) as [string, ...string[]]),
  cvUrl: z.string().trim().url("Upload your CV first.").max(600),
  cvName: z.string().trim().max(200).default(""),
};

const applySchema = z.object({
  ...profileFields,
  email: z.email("That email doesn't look right.").max(200),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  job: z.string().trim().max(120).default(""),
  website: z.string().max(0).optional(),
});

export type ApplyInput = z.input<typeof applySchema>;

function firstIssue(e: z.ZodError) {
  return e.issues[0]?.message ?? "Please check the form and try again.";
}

// Creates the applicant account (or signs an existing one back in with the same
// password), saves the full profile, and files the application.
export async function applyAction(input: ApplyInput): Promise<CareerState & { applied?: boolean }> {
  if (!hasDatabase()) return { error: "Applications aren't configured on this deployment yet." };
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: "Received." };

  await ensureCareerSchema();
  const email = d.email.toLowerCase();
  const existing = await getApplicantByEmail(email);
  let applicantId: number;

  if (existing) {
    if (!(await checkPassword(d.password, existing.password_hash)))
      return { error: "That email already has an account. Use its password, or sign in instead." };
    applicantId = existing.id;
  } else {
    const hash = await hashPassword(d.password);
    const rows = (await sql()`INSERT INTO career_applicants (email, password_hash) VALUES (${email}, ${hash})
      RETURNING id`) as { id: number }[];
    applicantId = rows[0].id;
  }

  await sql()`UPDATE career_applicants SET
      full_name = ${d.fullName},
      preferred_name = ${d.preferredName},
      whatsapp = ${d.whatsapp},
      gender = ${d.gender},
      country_origin = ${d.countryOrigin},
      country_residence = ${d.countryResidence},
      year_of_study = ${d.yearOfStudy},
      payout_currency = ${d.payoutCurrency},
      payout_method = ${d.payoutMethod},
      payout_details = ${d.payoutDetails ?? ""},
      commitment = ${d.commitment},
      availability = ${d.availability},
      cv_url = ${d.cvUrl},
      cv_name = ${d.cvName ?? ""},
      onboarded = true,
      updated_at = now()
    WHERE id = ${applicantId}`;

  const job = d.job ? await getJob(d.job) : null;
  await sql()`INSERT INTO career_applications (applicant_id, job_id, job_title)
    VALUES (${applicantId}, ${job?.id ?? null}, ${job?.title ?? "General application"})
    ON CONFLICT (applicant_id, job_id) DO UPDATE SET updated_at = now()`;

  await createCareerSession(applicantId);
  return { ok: "Application received.", applied: true };
}

export async function careerLoginAction(_: CareerState, form: FormData): Promise<CareerState> {
  if (!hasDatabase()) return { error: "Sign-in isn't configured on this deployment yet." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  await ensureCareerSchema();
  const applicant = await getApplicantByEmail(email);
  if (!applicant || !(await checkPassword(password, applicant.password_hash))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Wrong email or password." };
  }
  await createCareerSession(applicant.id);
  redirect("/career/dashboard");
}

export async function careerLogoutAction() {
  await destroyCareerSession();
  redirect("/career");
}

const updateSchema = z.object(profileFields).partial({ cvUrl: true, cvName: true, payoutDetails: true });

// Dashboard profile edits.
export async function updateProfileAction(input: unknown): Promise<CareerState> {
  const id = await careerSessionId();
  if (!id) return { error: "Please sign in again." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  await ensureCareerSchema();
  await sql()`UPDATE career_applicants SET
      full_name = ${d.fullName},
      preferred_name = ${d.preferredName},
      whatsapp = ${d.whatsapp},
      gender = ${d.gender},
      country_origin = ${d.countryOrigin},
      country_residence = ${d.countryResidence},
      year_of_study = ${d.yearOfStudy},
      payout_currency = ${d.payoutCurrency},
      payout_method = ${d.payoutMethod},
      payout_details = ${d.payoutDetails ?? ""},
      commitment = ${d.commitment},
      availability = ${d.availability},
      cv_url = COALESCE(NULLIF(${d.cvUrl ?? ""}, ''), cv_url),
      cv_name = COALESCE(NULLIF(${d.cvName ?? ""}, ''), cv_name),
      onboarded = true,
      updated_at = now()
    WHERE id = ${id}`;
  return { ok: "Profile saved." };
}

// Apply to another opening while already signed in.
export async function applyToJobAction(slug: string): Promise<CareerState> {
  const id = await careerSessionId();
  if (!id) return { error: "Please sign in first." };
  const job = await getJob(slug);
  if (!job || job.status !== "open") return { error: "That opening is closed." };
  await sql()`INSERT INTO career_applications (applicant_id, job_id, job_title)
    VALUES (${id}, ${job.id}, ${job.title})
    ON CONFLICT (applicant_id, job_id) DO UPDATE SET updated_at = now()`;
  return { ok: `Applied to ${job.title}.` };
}
