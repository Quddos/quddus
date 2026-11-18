import { Suspense } from "react";
import { JobsEditor } from "@/components/admin/JobsEditor";
import { getAdmin } from "@/lib/auth";
import { listJobs } from "@/lib/career-db";
import { hasDatabase } from "@/lib/db";

async function Jobs() {
  if (!(await getAdmin())) return null;
  if (!hasDatabase()) return <p className="py-10 text-muted">Database not configured.</p>;
  const jobs = await listJobs({ includeHidden: true });
  return <JobsEditor jobs={jobs} />;
}

export default function JobsPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-semibold">Openings</h1>
      <p className="mt-1 text-muted">
        Everything you publish here appears on career.diaspafra.org straight away.
      </p>
      <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
        <Jobs />
      </Suspense>
    </div>
  );
}
