"use client";

import { Download, FileText, MessageCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteApplicantAction, setApplicationAction } from "@/app/admin/career-actions";
import { AVAILABILITY, COMMITMENT, countryName, PAYOUT_METHODS } from "@/lib/countries";

export type Row = {
  id: number;
  status: string;
  note: string;
  created_at: string;
  job_title: string;
  applicant_id: number;
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
};

const STATUSES = ["submitted", "reviewing", "interview", "hired", "rejected"] as const;
const label = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v ?? "—";

const waLink = (n: string) => `https://wa.me/${n.replace(/[^0-9]/g, "")}`;

export function ApplicationList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [pending, start] = useTransition();

  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter === "all" || r.status === filter) &&
          (q === "" ||
            `${r.full_name} ${r.preferred_name} ${r.email} ${r.job_title} ${r.whatsapp}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [rows, filter, q],
  );

  const act = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function exportCsv() {
    const head = [
      "Applied", "Role", "Status", "Full name", "Preferred name", "Email", "WhatsApp", "Gender",
      "Country of origin", "Country of residence", "Year of study", "Commitment", "Availability",
      "Payout currency", "Payout method", "Payout details", "CV",
    ];
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = shown.map((r) =>
      [
        new Date(r.created_at).toISOString().slice(0, 10), r.job_title, r.status, r.full_name, r.preferred_name,
        r.email, r.whatsapp, r.gender, countryName(r.country_origin), countryName(r.country_residence),
        r.year_of_study, label(COMMITMENT, r.commitment), label(AVAILABILITY, r.availability),
        r.payout_currency, label(PAYOUT_METHODS, r.payout_method), r.payout_details, r.cv_url,
      ].map(esc).join(","),
    );
    const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rows.length === 0)
    return <p className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No applications yet.</p>;

  return (
    <div className={pending ? "opacity-70" : ""}>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <input className="admin-input max-w-xs" placeholder="Search name, email, role…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="admin-input max-w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={exportCsv} className="admin-btn">
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <span className="ml-auto font-mono text-xs text-dim">{shown.length} of {rows.length}</span>
      </div>

      <div className="mt-5 space-y-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-bg-2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">
                  {r.full_name}
                  {r.preferred_name && r.preferred_name !== r.full_name && (
                    <span className="ml-2 text-muted">goes by {r.preferred_name}</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-muted">
                  <a href={`mailto:${r.email}`} className="text-cyan">{r.email}</a>
                  {" · "}
                  {r.job_title || "General application"}
                  {" · "}
                  applied {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.whatsapp && (
                  <a href={waLink(r.whatsapp)} target="_blank" rel="noreferrer" className="admin-btn">
                    <MessageCircle className="h-4 w-4" /> {r.whatsapp}
                  </a>
                )}
                {r.cv_url && (
                  <a href={r.cv_url} target="_blank" rel="noreferrer" className="admin-btn">
                    <FileText className="h-4 w-4" /> CV
                  </a>
                )}
                <select
                  className="admin-input w-auto"
                  value={r.status}
                  onChange={(e) => act(() => setApplicationAction(r.id, { status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => confirm(`Delete ${r.full_name} and all their data?`) && act(() => deleteApplicantAction(r.applicant_id))}
                  className="admin-btn hover:!text-danger"
                  aria-label="Delete applicant"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Gender", r.gender],
                ["Year of study", r.year_of_study],
                ["Country of origin", countryName(r.country_origin)],
                ["Lives in", countryName(r.country_residence)],
                ["6 hours a week", label(COMMITMENT, r.commitment)],
                ["Can start", label(AVAILABILITY, r.availability)],
                ["Payout currency", r.payout_currency],
                ["Payout method", label(PAYOUT_METHODS, r.payout_method)],
                ["Payout details", r.payout_details || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 text-dim">{k}:</dt>
                  <dd className="truncate text-fg/85">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                className="admin-input max-w-md"
                placeholder="Private note (only you see this)…"
                defaultValue={r.note}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              />
              <button
                className="admin-btn"
                onClick={() => act(() => setApplicationAction(r.id, { status: r.status, note: notes[r.id] ?? r.note }))}
              >
                Save note
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
