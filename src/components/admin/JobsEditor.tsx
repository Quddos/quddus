"use client";

import { ChevronDown, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteJobAction, saveJobAction, type JobInput } from "@/app/admin/career-actions";
import type { Job } from "@/lib/career-db";

type Draft = JobInput & { key: string };

const BLANK = (): Draft => ({
  key: `new-${Math.random().toString(36).slice(2, 8)}`,
  slug: "",
  title: "",
  blurb: "",
  employment_type: "Part-time · Student role",
  location: "Remote",
  schedule: "3 days a week, 2 hours a day",
  hours_per_week: "6 hours",
  pay_rate: "",
  payout_schedule: "Paid weekly, every Tuesday",
  description: "",
  responsibilities: [],
  requirements: [],
  status: "open",
});

const lines = (v: string[] | undefined) => (v ?? []).join("\n");
const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

export function JobsEditor({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>(() => jobs.map((j) => ({ ...j, key: `job-${j.id}` })));
  const [open, setOpen] = useState<string | null>(jobs.length ? null : null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const patch = (key: string, p: Partial<Draft>) =>
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...p } : d)));

  const add = () => {
    const d = BLANK();
    setDrafts((l) => [d, ...l]);
    setOpen(d.key);
  };

  const save = (d: Draft) =>
    start(async () => {
      const { key, ...payload } = d;
      const res = await saveJobAction(payload);
      setMsg((m) => ({ ...m, [key]: res.error ?? res.ok ?? "" }));
      if (res.id) {
        patch(key, { id: res.id, slug: res.slug });
        router.refresh();
      }
    });

  const remove = (d: Draft) =>
    start(async () => {
      if (d.id) await deleteJobAction(d.id);
      setDrafts((l) => l.filter((x) => x.key !== d.key));
      router.refresh();
    });

  const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

  return (
    <div className={`mt-8 space-y-3 ${pending ? "opacity-70" : ""}`}>
      <button onClick={add} className="admin-btn">
        <Plus className="h-4 w-4" /> New opening
      </button>

      {drafts.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No openings yet. Post the first one.
        </p>
      )}

      {drafts.map((d) => {
        const isOpen = open === d.key;
        return (
          <div key={d.key} className="rounded-2xl border border-line bg-bg-2">
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => setOpen(isOpen ? null : d.key)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <ChevronDown className={`h-4 w-4 shrink-0 text-dim transition ${isOpen ? "rotate-180" : ""}`} />
                <span className="truncate font-medium">{d.title || "Untitled opening"}</span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${d.status === "open" ? "border-cyan/40 text-cyan" : "border-line text-muted"}`}>
                  {d.status}
                </span>
              </button>
              {d.slug && (
                <a href={`/career/jobs/${d.slug}`} target="_blank" rel="noreferrer" className="admin-btn shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button onClick={() => confirm("Delete this opening?") && remove(d)} className="admin-btn shrink-0 hover:!text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {isOpen && (
              <div className="space-y-4 border-t border-line p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>Title</span>
                    <input className="admin-input" value={d.title} onChange={(e) => patch(d.key, { title: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Status</span>
                    <select className="admin-input" value={d.status} onChange={(e) => patch(d.key, { status: e.target.value as Draft["status"] })}>
                      <option value="open">Open — visible and accepting applications</option>
                      <option value="closed">Closed — visible, no longer accepting</option>
                      <option value="draft">Draft — hidden from the site</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className={label}>Short summary (shown on the card)</span>
                  <textarea className="admin-input" rows={2} value={d.blurb} onChange={(e) => patch(d.key, { blurb: e.target.value })} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>Employment type</span>
                    <input className="admin-input" value={d.employment_type} onChange={(e) => patch(d.key, { employment_type: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Location</span>
                    <input className="admin-input" value={d.location} onChange={(e) => patch(d.key, { location: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Schedule</span>
                    <input className="admin-input" value={d.schedule} onChange={(e) => patch(d.key, { schedule: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Hours a week</span>
                    <input className="admin-input" value={d.hours_per_week} onChange={(e) => patch(d.key, { hours_per_week: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Pay rate</span>
                    <input className="admin-input" placeholder="$1.03 USD (₹96 INR) per hour" value={d.pay_rate} onChange={(e) => patch(d.key, { pay_rate: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className={label}>Payout schedule</span>
                    <input className="admin-input" value={d.payout_schedule} onChange={(e) => patch(d.key, { payout_schedule: e.target.value })} />
                  </label>
                </div>
                <label className="block">
                  <span className={label}>About the role</span>
                  <textarea className="admin-input" rows={4} value={d.description} onChange={(e) => patch(d.key, { description: e.target.value })} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={label}>What you will do — one per line</span>
                    <textarea className="admin-input" rows={4} value={lines(d.responsibilities)} onChange={(e) => patch(d.key, { responsibilities: toLines(e.target.value) })} />
                  </label>
                  <label className="block">
                    <span className={label}>Who can apply — one per line</span>
                    <textarea className="admin-input" rows={4} value={lines(d.requirements)} onChange={(e) => patch(d.key, { requirements: toLines(e.target.value) })} />
                  </label>
                </div>
                <label className="block">
                  <span className={label}>URL slug (optional — made from the title)</span>
                  <input className="admin-input" value={d.slug} onChange={(e) => patch(d.key, { slug: e.target.value })} />
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => save(d)} disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition hover:bg-cyan disabled:opacity-60">
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save and publish
                  </button>
                  {msg[d.key] && <span className="text-sm text-cyan">{msg[d.key]}</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
