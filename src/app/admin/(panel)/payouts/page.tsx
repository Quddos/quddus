import { Suspense } from "react";
import { PayoutManager, type PayoutRow, type Person } from "@/components/admin/PayoutManager";
import { getAdmin } from "@/lib/auth";
import { ensureCareerSchema, weekStart } from "@/lib/career-db";
import { hasDatabase, sql } from "@/lib/db";

async function Payouts() {
  if (!(await getAdmin())) return null;
  if (!hasDatabase()) return <p className="py-10 text-muted">Database not configured.</p>;
  await ensureCareerSchema();
  const [rows, people] = await Promise.all([
    sql()`SELECT y.*, p.full_name, p.email, p.payout_method
      FROM career_payouts y JOIN career_applicants p ON p.id = y.applicant_id
      ORDER BY y.week_start DESC, p.full_name LIMIT 300` as unknown as Promise<PayoutRow[]>,
    sql()`SELECT p.id, p.full_name, p.email, p.payout_currency,
        EXISTS (SELECT 1 FROM career_applications a WHERE a.applicant_id = p.id AND a.status = 'hired') AS hired
      FROM career_applicants p ORDER BY hired DESC, p.full_name LIMIT 500` as unknown as Promise<Person[]>,
  ]);
  if (people.length === 0) return <p className="py-10 text-muted">No applicants yet — payouts start once someone applies.</p>;
  return (
    <PayoutManager
      rows={rows.map((r) => ({ ...r, week_start: String(r.week_start).slice(0, 10) }))}
      people={people}
      thisWeek={weekStart()}
    />
  );
}

export default function PayoutsPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-semibold">Payouts</h1>
      <p className="mt-1 text-muted">
        Weekly payouts, every Tuesday. What you set here is what each person sees on their dashboard.
      </p>
      <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
        <Payouts />
      </Suspense>
    </div>
  );
}
