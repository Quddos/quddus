"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { revokeKeyAction } from "@/app/admin/actions";

export type KeyRow = {
  id: number;
  name: string;
  email: string;
  purpose: string;
  prefix: string;
  revoked: boolean;
  created_at: string;
  last_used_at: string | null;
  today: number;
  total: number;
};

export function KeyTable({ keys }: { keys: KeyRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (keys.length === 0) return <p className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No keys issued yet.</p>;
  return (
    <div className={`mt-6 overflow-x-auto rounded-2xl border border-line ${pending ? "opacity-60" : ""}`}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="mono-label border-b border-line">
          <tr>
            {["Key", "Owner", "Purpose", "Today", "Total", "Last used", ""].map((h) => (
              <th key={h} className="px-4 py-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {keys.map((k) => (
            <tr key={k.id} className={k.revoked ? "opacity-50" : ""}>
              <td className="px-4 py-3 font-mono text-xs">{k.prefix}…</td>
              <td className="px-4 py-3">
                <div>{k.name}</div>
                <a href={`mailto:${k.email}`} className="text-xs text-cyan">
                  {k.email}
                </a>
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-muted" title={k.purpose}>
                {k.purpose || "—"}
              </td>
              <td className="px-4 py-3 font-mono">{k.today}</td>
              <td className="px-4 py-3 font-mono">{k.total}</td>
              <td className="px-4 py-3 text-xs text-muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "never"}</td>
              <td className="px-4 py-3 text-right">
                <button
                  className="admin-btn"
                  onClick={() =>
                    start(async () => {
                      await revokeKeyAction(k.id, !k.revoked);
                      router.refresh();
                    })
                  }
                >
                  {k.revoked ? "Restore" : "Revoke"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
