"use client";

import { Loader2, Plus, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deletePayoutAction,
  generateWeekAction,
  savePayoutAction,
  setPayoutStatusAction,
} from "@/app/admin/career-actions";
import { CURRENCIES, formatMoney } from "@/lib/countries";

export type PayoutRow = {
  id: number;
  applicant_id: number;
  week_start: string;
  hours: string;
  amount: string;
  currency: string;
  status: "pending" | "processing" | "paid";
  reference: string;
  note: string;
  full_name: string;
  email: string;
  payout_method: string;
};

export type Person = { id: number; full_name: string; email: string; payout_currency: string; hired: boolean };

const STATUSES = ["pending", "processing", "paid"] as const;
const tone: Record<string, string> = {
  pending: "border-amber/40 text-amber",
  processing: "border-violet/40 text-violet",
  paid: "border-cyan/40 text-cyan",
};

export function PayoutManager({ rows, people, thisWeek }: { rows: PayoutRow[]; people: Person[]; thisWeek: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    applicantId: people[0]?.id ?? 0,
    weekStart: thisWeek,
    hours: "6",
    amount: "6.18",
    currency: people[0]?.payout_currency || "USD",
    status: "pending" as (typeof STATUSES)[number],
    reference: "",
  });
  const [gen, setGen] = useState({ weekStart: thisWeek, hours: "6", amount: "6.18", currency: "USD" });

  const act = (fn: () => Promise<{ ok?: string; error?: string }>) =>
    start(async () => {
      const res = await fn();
      setMsg(res.error ?? res.ok ?? "");
      router.refresh();
    });

  const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";
  const totalPending = rows.filter((r) => r.status !== "paid").length;

  return (
    <div className={pending ? "opacity-70" : ""}>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* One payout for one person. */}
        <div className="rounded-2xl border border-line bg-bg-2 p-5">
          <h2 className="font-medium">Record a payout</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={label}>Person</span>
              <select
                className="admin-input"
                value={form.applicantId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const p = people.find((x) => x.id === id);
                  setForm((f) => ({ ...f, applicantId: id, currency: p?.payout_currency || f.currency }));
                }}
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} — {p.email}
                    {p.hired ? " (hired)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Week starting (Monday)</span>
              <input type="date" className="admin-input" value={form.weekStart} onChange={(e) => setForm((f) => ({ ...f, weekStart: e.target.value }))} />
            </label>
            <label className="block">
              <span className={label}>Hours</span>
              <input type="number" step="0.5" className="admin-input" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} />
            </label>
            <label className="block">
              <span className={label}>Amount</span>
              <input type="number" step="0.01" className="admin-input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </label>
            <label className="block">
              <span className={label}>Currency</span>
              <select className="admin-input" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Status</span>
              <select className="admin-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as (typeof STATUSES)[number] }))}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Reference (optional)</span>
              <input className="admin-input" placeholder="PayPal / UPI reference" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
            </label>
          </div>
          <button
            disabled={pending || people.length === 0}
            onClick={() =>
              act(() =>
                savePayoutAction({
                  applicantId: form.applicantId,
                  weekStart: form.weekStart,
                  hours: Number(form.hours),
                  amount: Number(form.amount),
                  currency: form.currency,
                  status: form.status,
                  reference: form.reference,
                }),
              )
            }
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition hover:bg-cyan disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add payout
          </button>
        </div>

        {/* The whole week at once, for everyone marked hired. */}
        <div className="rounded-2xl border border-line bg-bg-2 p-5">
          <h2 className="font-medium">Generate the week</h2>
          <p className="mt-1 text-sm text-muted">
            Creates one pending payout for every applicant marked <span className="text-cyan">hired</span>, skipping
            anyone who already has a row for that week.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Week starting</span>
              <input type="date" className="admin-input" value={gen.weekStart} onChange={(e) => setGen((g) => ({ ...g, weekStart: e.target.value }))} />
            </label>
            <label className="block">
              <span className={label}>Hours each</span>
              <input type="number" step="0.5" className="admin-input" value={gen.hours} onChange={(e) => setGen((g) => ({ ...g, hours: e.target.value }))} />
            </label>
            <label className="block">
              <span className={label}>Amount each</span>
              <input type="number" step="0.01" className="admin-input" value={gen.amount} onChange={(e) => setGen((g) => ({ ...g, amount: e.target.value }))} />
            </label>
            <label className="block">
              <span className={label}>Currency</span>
              <select className="admin-input" value={gen.currency} onChange={(e) => setGen((g) => ({ ...g, currency: e.target.value }))}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            disabled={pending}
            onClick={() => act(() => generateWeekAction({ weekStart: gen.weekStart, hours: Number(gen.hours), amount: Number(gen.amount), currency: gen.currency }))}
            className="admin-btn mt-4"
          >
            <Zap className="h-4 w-4" /> Generate pending payouts
          </button>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm text-cyan">{msg}</p>}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-medium">Payout ledger</h2>
        <span className="font-mono text-xs text-dim">{totalPending} awaiting payment</span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No payouts recorded yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-bg-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-dim">
                <th className="px-4 py-3 font-medium">Week</th>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{String(r.week_start).slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-dim">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{Number(r.hours)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{formatMoney(Number(r.amount), r.currency)}</td>
                  <td className="px-4 py-3">
                    <select
                      className={`admin-input w-auto ${tone[r.status]}`}
                      value={r.status}
                      onChange={(e) => act(() => setPayoutStatusAction(r.id, e.target.value as (typeof STATUSES)[number]))}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-dim">{r.reference || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => confirm("Delete this payout?") && act(() => deletePayoutAction(r.id))} className="admin-btn hover:!text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
