// Career portal storage. These tables live in the same Neon database as the
// portfolio, so career.diaspafra.org and quddus.diaspafra.org share one
// dataset: set the same DATABASE_URL on both deployments.
import { ensureSchema, hasDatabase, sql } from "./db";

export type JobStatus = "open" | "closed" | "draft";

export type Job = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  employment_type: string;
  location: string;
  schedule: string;
  hours_per_week: string;
  pay_rate: string;
  payout_schedule: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  status: JobStatus;
  created_at: string;
  updated_at: string;
};

export type Applicant = {
  id: number;
  email: string;
  full_name: string;
  preferred_name: string;
  whatsapp: string;
  gender: string;
  country_origin: string;
  country_residence: string;
  year_of_study: string;
  payout_currency: string;
  payout_method: string;
  payout_details: string;
  commitment: string;
  availability: string;
  cv_url: string;
  cv_name: string;
  onboarded: boolean;
  created_at: string;
};

export type ApplicationStatus = "submitted" | "reviewing" | "interview" | "hired" | "rejected";

export type Application = {
  id: number;
  applicant_id: number;
  job_id: number | null;
  job_title: string;
  status: ApplicationStatus;
  note: string;
  created_at: string;
};

export type PayoutStatus = "pending" | "processing" | "paid";

export type Payout = {
  id: number;
  applicant_id: number;
  week_start: string;
  hours: string;
  amount: string;
  currency: string;
  status: PayoutStatus;
  reference: string;
  note: string;
  paid_at: string | null;
  created_at: string;
};

let ready: Promise<void> | null = null;

// Created on first use, exactly like the portfolio tables, so a fresh database
// needs no migration step.
export function ensureCareerSchema() {
  ready ??= (async () => {
    await ensureSchema();
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS career_jobs (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      blurb text NOT NULL DEFAULT '',
      employment_type text NOT NULL DEFAULT 'Part-time',
      location text NOT NULL DEFAULT 'Remote',
      schedule text NOT NULL DEFAULT '',
      hours_per_week text NOT NULL DEFAULT '',
      pay_rate text NOT NULL DEFAULT '',
      payout_schedule text NOT NULL DEFAULT '',
      description text NOT NULL DEFAULT '',
      responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
      requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
      status text NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS career_applicants (
      id serial PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      full_name text NOT NULL DEFAULT '',
      preferred_name text NOT NULL DEFAULT '',
      whatsapp text NOT NULL DEFAULT '',
      gender text NOT NULL DEFAULT '',
      country_origin text NOT NULL DEFAULT '',
      country_residence text NOT NULL DEFAULT '',
      year_of_study text NOT NULL DEFAULT '',
      payout_currency text NOT NULL DEFAULT 'USD',
      payout_method text NOT NULL DEFAULT 'none',
      payout_details text NOT NULL DEFAULT '',
      commitment text NOT NULL DEFAULT '',
      availability text NOT NULL DEFAULT '',
      cv_url text NOT NULL DEFAULT '',
      cv_name text NOT NULL DEFAULT '',
      onboarded boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS career_applications (
      id serial PRIMARY KEY,
      applicant_id integer NOT NULL REFERENCES career_applicants(id) ON DELETE CASCADE,
      job_id integer REFERENCES career_jobs(id) ON DELETE SET NULL,
      job_title text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'submitted',
      note text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    // NULLS NOT DISTINCT keeps a second general application (job_id IS NULL)
    // from creating a duplicate row; the plain index is the pre-15 fallback.
    try {
      await q`CREATE UNIQUE INDEX IF NOT EXISTS career_applications_once
        ON career_applications (applicant_id, job_id) NULLS NOT DISTINCT`;
    } catch {
      await q`CREATE UNIQUE INDEX IF NOT EXISTS career_applications_once
        ON career_applications (applicant_id, job_id)`;
    }
    await q`CREATE TABLE IF NOT EXISTS career_payouts (
      id serial PRIMARY KEY,
      applicant_id integer NOT NULL REFERENCES career_applicants(id) ON DELETE CASCADE,
      week_start date NOT NULL,
      hours numeric NOT NULL DEFAULT 0,
      amount numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'USD',
      status text NOT NULL DEFAULT 'pending',
      reference text NOT NULL DEFAULT '',
      note text NOT NULL DEFAULT '',
      paid_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await seedFirstJob(q);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

// The live opening, so a brand new deployment has something to show.
async function seedFirstJob(q: ReturnType<typeof sql>) {
  const rows = (await q`SELECT 1 FROM career_jobs LIMIT 1`) as unknown[];
  if (rows.length > 0) return;
  await q`INSERT INTO career_jobs
    (slug, title, blurb, employment_type, location, schedule, hours_per_week, pay_rate, payout_schedule, description, responsibilities, requirements, status)
    VALUES (
      'content-social-handle-manager',
      'Part-Time Content & Social Handle Manager',
      'An enthusiastic student to manage our social handles and content. No prior work experience needed — just a willingness to learn and stay consistent.',
      'Part-time · Student role',
      'Remote',
      '3 days a week, 2 hours a day',
      '6 hours',
      '$1.03 USD (₹96 INR) per hour',
      'Paid weekly, every Tuesday',
      'We are looking for an enthusiastic student to join our team as a Content & Social Handle Manager. Training is provided, so no prior skills are required — we care about consistency and curiosity.',
      ${JSON.stringify([
        "Manage and schedule social media handles.",
        "Assist with basic video recording and content management.",
        "Handle video captioning and simple AI automation tasks.",
      ])}::jsonb,
      ${JSON.stringify([
        "Currently in your 1st year of undergraduate studies.",
        "No prior skills required — training will be provided.",
        "Good internet connection and access to a laptop is an added advantage.",
      ])}::jsonb,
      'open'
    ) ON CONFLICT (slug) DO NOTHING`;
}

const parseList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const toJob = (r: Record<string, unknown>): Job => ({
  ...(r as unknown as Job),
  responsibilities: parseList(r.responsibilities),
  requirements: parseList(r.requirements),
  created_at: new Date(r.created_at as string).toISOString(),
  updated_at: new Date(r.updated_at as string).toISOString(),
});

export async function listJobs(opts: { includeHidden?: boolean } = {}) {
  if (!hasDatabase()) return [];
  await ensureCareerSchema();
  const rows = opts.includeHidden
    ? ((await sql()`SELECT * FROM career_jobs ORDER BY (status = 'open') DESC, created_at DESC`) as Record<string, unknown>[])
    : ((await sql()`SELECT * FROM career_jobs WHERE status = 'open' ORDER BY created_at DESC`) as Record<string, unknown>[]);
  return rows.map(toJob);
}

export async function getJob(slug: string) {
  if (!hasDatabase()) return null;
  await ensureCareerSchema();
  const rows = (await sql()`SELECT * FROM career_jobs WHERE slug = ${slug} LIMIT 1`) as Record<string, unknown>[];
  return rows[0] ? toJob(rows[0]) : null;
}

export async function getApplicant(id: number) {
  await ensureCareerSchema();
  const rows = (await sql()`SELECT * FROM career_applicants WHERE id = ${id} LIMIT 1`) as Record<string, unknown>[];
  return (rows[0] as unknown as Applicant) ?? null;
}

export async function getApplicantByEmail(email: string) {
  await ensureCareerSchema();
  const rows = (await sql()`SELECT * FROM career_applicants WHERE email = ${email.toLowerCase()} LIMIT 1`) as
    (Applicant & { password_hash: string })[];
  return rows[0] ?? null;
}

export async function applicationsFor(applicantId: number) {
  await ensureCareerSchema();
  return (await sql()`SELECT * FROM career_applications WHERE applicant_id = ${applicantId}
    ORDER BY created_at DESC`) as unknown as Application[];
}

export async function payoutsFor(applicantId: number) {
  await ensureCareerSchema();
  return (await sql()`SELECT * FROM career_payouts WHERE applicant_id = ${applicantId}
    ORDER BY week_start DESC LIMIT 60`) as unknown as Payout[];
}

// Monday of the week a date falls in, as YYYY-MM-DD (UTC).
export function weekStart(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  return x.toISOString().slice(0, 10);
}

// Payouts land every Tuesday; this is the next one from a given date.
export function nextPayoutDate(from = new Date()) {
  const x = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const ahead = (2 - x.getUTCDay() + 7) % 7 || 7;
  x.setUTCDate(x.getUTCDate() + ahead);
  return x;
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "role";
