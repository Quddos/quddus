import { Suspense } from "react";
import { ApplicationList, type Row } from "@/components/admin/ApplicationList";
import { getAdmin } from "@/lib/auth";
import { ensureCareerSchema } from "@/lib/career-db";
import { hasDatabase, sql } from "@/lib/db";

async function Applications() {
  if (!(await getAdmin())) return null;
  if (!hasDatabase()) return <p className="py-10 text-muted">Database not configured.</p>;
  await ensureCareerSchema();
  const rows = (await sql()`SELECT a.id, a.status, a.note, a.created_at, a.job_title,
      p.id AS applicant_id, p.email, p.full_name, p.preferred_name, p.whatsapp, p.gender,
      p.country_origin, p.country_residence, p.year_of_study, p.payout_currency, p.payout_method,
      p.payout_details, p.commitment, p.availability, p.cv_url, p.cv_name
    FROM career_applications a
    JOIN career_applicants p ON p.id = a.applicant_id
    ORDER BY a.created_at DESC LIMIT 400`) as Row[];
  return <ApplicationList rows={rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }))} />;
}

export default function ApplicationsPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-semibold">Applications</h1>
      <p className="mt-1 text-muted">Everyone who submitted a CV through the career site, with their details.</p>
      <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
        <Applications />
      </Suspense>
    </div>
  );
}
