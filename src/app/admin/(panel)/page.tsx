import { AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SECTIONS } from "@/lib/admin-schema";
import { getAdmin, usingDefaultPassword } from "@/lib/auth";
import { readContent } from "@/lib/content";
import { ensureSchema, hasDatabase, sql } from "@/lib/db";

async function Overview() {
  const admin = (await getAdmin()) ?? "";
  const [content, defaultPw] = await Promise.all([readContent(), usingDefaultPassword(admin)]);
  let unread = 0;
  if (hasDatabase()) {
    await ensureSchema();
    const rows = (await sql()`SELECT count(*)::int AS n FROM messages WHERE read = false`) as { n: number }[];
    unread = rows[0]?.n ?? 0;
  }
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-semibold">Welcome back, {content.profile.name.split(" ")[0]}.</h1>
      <p className="mt-1 text-muted">Everything you save here is published to the live site immediately.</p>

      {defaultPw && (
        <Link href="/admin/settings" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
          <span>
            You&apos;re still using the default password. <span className="text-amber underline">Change it now</span> before sharing your site.
          </span>
        </Link>
      )}
      {!blob && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line p-4 text-sm text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          File uploads need BLOB_READ_WRITE_TOKEN. Connect a Blob store to this project in Vercel → Storage. You can still paste media URLs.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/messages" className="rounded-2xl border border-line bg-bg-2 p-5 transition hover:border-line-strong">
          <div className="mono-label">Unread messages</div>
          <div className="mt-2 font-display text-4xl font-semibold text-cyan">{unread}</div>
        </Link>
        {(["projects", "publications", "people"] as const).map((k) => (
          <Link key={k} href={`/admin/${k}`} className="rounded-2xl border border-line bg-bg-2 p-5 transition hover:border-line-strong">
            <div className="mono-label">{SECTIONS.find((s) => s.key === k)?.label}</div>
            <div className="mt-2 font-display text-4xl font-semibold">{content[k].length}</div>
          </Link>
        ))}
      </div>

      <h2 className="mono-label mb-3 mt-12">Edit content</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.key} href={`/admin/${s.key}`} className="group rounded-2xl border border-line p-5 transition hover:border-cyan/40">
            <div className="flex items-center justify-between font-medium">
              {s.label} <ArrowUpRight className="h-4 w-4 text-dim transition group-hover:text-cyan" />
            </div>
            <p className="mt-1 text-sm text-muted">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
      <Overview />
    </Suspense>
  );
}
