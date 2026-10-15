import { Suspense } from "react";
import { KeyTable, type KeyRow } from "@/components/admin/KeyTable";
import { ProviderTest } from "@/components/admin/ProviderTest";
import { LIMITS } from "@/lib/api-keys";
import { getAdmin } from "@/lib/auth";
import { ensureSchema, hasDatabase, sql } from "@/lib/db";
import { providers } from "@/lib/qud";

async function Keys() {
  if (!(await getAdmin()) || !hasDatabase()) return <p className="py-10 text-muted">Database not configured.</p>;
  await ensureSchema();
  const [keys, today, week] = (await Promise.all([
    sql()`SELECT k.id, k.name, k.email, k.purpose, k.prefix, k.revoked, k.created_at, k.last_used_at,
            coalesce(u.requests, 0)::int AS today,
            coalesce((SELECT sum(requests) FROM api_usage WHERE caller = 'key:' || k.id), 0)::int AS total
          FROM api_keys k
          LEFT JOIN api_usage u ON u.caller = 'key:' || k.id AND u.day = current_date
          ORDER BY k.created_at DESC LIMIT 500`,
    sql()`SELECT
            coalesce(sum(requests) FILTER (WHERE caller LIKE 'key:%'), 0)::int AS api,
            coalesce(sum(requests) FILTER (WHERE caller LIKE 'ip:%'), 0)::int AS playground
          FROM api_usage WHERE day = current_date`,
    sql()`SELECT day::text, sum(requests)::int AS n FROM api_usage WHERE day > current_date - 7 GROUP BY day ORDER BY day`,
  ])) as [KeyRow[], { api: number; playground: number }[], { day: string; n: number }[]];
  const t = today[0] ?? { api: 0, playground: 0 };
  const max = Math.max(1, ...week.map((w) => w.n));

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active keys", keys.filter((k) => !k.revoked).length],
          ["API requests today", t.api],
          ["Playground requests today", t.playground],
          ["Daily site cap", `${t.api + t.playground} / ${LIMITS.globalDaily}`],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-2xl border border-line bg-bg-2 p-5">
            <div className="mono-label">{label}</div>
            <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <ProviderTest configured={providers().map((p) => p.name)} />
      <div className="mt-6 rounded-2xl border border-line bg-bg-2 p-5">
        <div className="mono-label mb-4">Requests, last 7 days</div>
        <div className="flex h-28 items-end gap-2">
          {week.map((w) => (
            <div key={w.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-muted">{w.n}</span>
              <div className="w-full max-w-12 rounded-t bg-cyan/70" style={{ height: `${(w.n / max) * 80}px` }} />
              <span className="font-mono text-[10px] text-dim">{w.day.slice(5)}</span>
            </div>
          ))}
          {week.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
        </div>
      </div>
      <KeyTable keys={keys.map((k) => ({ ...k, created_at: new Date(k.created_at).toISOString(), last_used_at: k.last_used_at ? new Date(k.last_used_at).toISOString() : null }))} />
    </>
  );
}

export default function ApiKeysPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-semibold">API keys</h1>
      <p className="mt-1 text-muted">Free keys issued from /developers. Revoke any key that misbehaves.</p>
      <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
        <Keys />
      </Suspense>
    </div>
  );
}
