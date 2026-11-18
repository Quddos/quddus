import { CalendarClock, CheckCircle2, Circle, Clock, FileText, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProfileEditor } from "@/components/career/ProfileEditor";
import { careerLogoutAction } from "@/app/career/actions";
import { currentApplicant } from "@/lib/career-auth";
import { applicationsFor, nextPayoutDate, payoutsFor, weekStart, type Payout } from "@/lib/career-db";
import { countryName, formatMoney } from "@/lib/countries";

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  submitted: { label: "Submitted", tone: "text-cyan border-cyan/40 bg-cyan/[0.06]" },
  reviewing: { label: "Under review", tone: "text-violet border-violet/40 bg-violet/[0.06]" },
  interview: { label: "Interview stage", tone: "text-amber border-amber/40 bg-amber/[0.06]" },
  hired: { label: "Hired", tone: "text-cyan border-cyan/50 bg-cyan/10" },
  rejected: { label: "Not moving forward", tone: "text-muted border-line" },
};

const PAYOUT_TONE: Record<string, string> = {
  pending: "text-amber border-amber/40 bg-amber/[0.06]",
  processing: "text-violet border-violet/40 bg-violet/[0.06]",
  paid: "text-cyan border-cyan/40 bg-cyan/[0.06]",
};

const money = (p: Payout) => formatMoney(Number(p.amount), p.currency || "USD");
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

async function Dashboard() {
  const me = await currentApplicant();
  if (!me) redirect("/career/login");

  const [applications, payouts] = await Promise.all([applicationsFor(me.id), payoutsFor(me.id)]);
  const thisWeek = weekStart();
  const current = payouts.find((p) => String(p.week_start).slice(0, 10) === thisWeek);
  const paid = payouts.filter((p) => p.status === "paid");
  const totalPaid = paid.reduce((n, p) => n + Number(p.amount), 0);
  const totalHours = payouts.reduce((n, p) => n + Number(p.hours), 0);
  const nextPayout = nextPayoutDate();

  const steps = [
    { done: Boolean(me.full_name && me.whatsapp), label: "Profile details", hint: "Name, WhatsApp and country" },
    { done: Boolean(me.cv_url), label: "CV uploaded", hint: "PDF or Word document" },
    { done: me.payout_method !== "none" && me.payout_method !== "", label: "Payout method", hint: "PayPal, UPI or bank" },
    { done: Boolean(me.commitment && me.availability), label: "Availability", hint: "Hours a week and start date" },
  ];
  const left = steps.filter((s) => !s.done).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mono-label">Your dashboard</div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Hi {me.preferred_name || me.full_name.split(" ")[0] || "there"}.
          </h1>
          <p className="mt-1 text-muted">
            {countryName(me.country_residence)} · {me.year_of_study || "Student"}
          </p>
        </div>
        <form action={careerLogoutAction}>
          <button className="btn-ghost !py-2 !text-sm">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>

      {/* Onboarding — four quick checks, all of them filled by the application itself. */}
      <section className="card mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">
            {left === 0 ? "Onboarding complete" : `Finish onboarding — ${left} step${left > 1 ? "s" : ""} left`}
          </h2>
          <span className="pill">{steps.length - left}/{steps.length} done</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.done ? "border-cyan/35 bg-cyan/[0.05]" : "border-line"}`}>
              {s.done ? <CheckCircle2 className="h-4 w-4 text-cyan" /> : <Circle className="h-4 w-4 text-dim" />}
              <div className="mt-2 text-sm font-medium">{s.label}</div>
              <div className="mt-0.5 text-xs text-dim">{s.hint}</div>
            </div>
          ))}
        </div>
        {left > 0 && <p className="mt-4 text-sm text-muted">Update the details below to finish — it takes a few seconds.</p>}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="mono-label">This week</div>
          <div className="mt-2 font-display text-2xl font-semibold">
            {current ? money(current) : formatMoney(0, me.payout_currency || "USD")}
          </div>
          <span className={`pill mt-3 ${PAYOUT_TONE[current?.status ?? "pending"]}`}>
            {current ? current.status : "nothing logged yet"}
          </span>
        </div>
        <div className="card p-5">
          <div className="mono-label">Next payout</div>
          <div className="mt-2 font-display text-2xl font-semibold">{day(nextPayout.toISOString())}</div>
          <span className="pill mt-3">
            <CalendarClock className="h-3.5 w-3.5" /> every Tuesday
          </span>
        </div>
        <div className="card p-5">
          <div className="mono-label">Paid to date</div>
          <div className="mt-2 font-display text-2xl font-semibold text-cyan">
            {formatMoney(totalPaid, paid[0]?.currency || me.payout_currency || "USD")}
          </div>
          <span className="pill mt-3">
            <Wallet className="h-3.5 w-3.5" /> {paid.length} payout{paid.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="card p-5">
          <div className="mono-label">Hours logged</div>
          <div className="mt-2 font-display text-2xl font-semibold">{totalHours}</div>
          <span className="pill mt-3">
            <Clock className="h-3.5 w-3.5" /> across all weeks
          </span>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your applications</h2>
        {applications.length === 0 ? (
          <p className="card mt-4 p-6 text-muted">
            No application on file yet.{" "}
            <Link href="/career" className="text-cyan">
              Browse the open roles
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {applications.map((a) => {
              const s = STATUS_COPY[a.status] ?? STATUS_COPY.submitted;
              return (
                <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <div className="font-medium">{a.job_title || "General application"}</div>
                    <div className="mt-0.5 text-sm text-dim">Applied {day(a.created_at)}</div>
                    {a.note && <p className="mt-2 text-sm text-muted">{a.note}</p>}
                  </div>
                  <span className={`pill ${s.tone}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Payout history</h2>
        {payouts.length === 0 ? (
          <p className="card mt-4 p-6 text-muted">
            Nothing yet. Once you start, every Tuesday&apos;s payout shows up here with its status and reference.
          </p>
        ) : (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-dim">
                  <th className="px-5 py-3 font-medium">Week of</th>
                  <th className="px-5 py-3 font-medium">Hours</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3">{day(String(p.week_start))}</td>
                    <td className="px-5 py-3 text-muted">{Number(p.hours)}</td>
                    <td className="px-5 py-3 font-medium">{money(p)}</td>
                    <td className="px-5 py-3">
                      <span className={`pill ${PAYOUT_TONE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3 text-dim">{p.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10 mb-16">
        <h2 className="font-display text-xl font-semibold">Your details</h2>
        <p className="mt-1 text-sm text-muted">Keep these current so payouts reach you without delay.</p>
        {me.cv_url && (
          <a href={me.cv_url} target="_blank" rel="noreferrer" className="btn-ghost mt-4 !py-2 !text-sm">
            <FileText className="h-4 w-4" /> View the CV on file{me.cv_name ? ` · ${me.cv_name}` : ""}
          </a>
        )}
        <ProfileEditor
          initial={{
            fullName: me.full_name,
            preferredName: me.preferred_name,
            whatsapp: me.whatsapp,
            gender: me.gender,
            countryOrigin: me.country_origin,
            countryResidence: me.country_residence,
            yearOfStudy: me.year_of_study,
            payoutCurrency: me.payout_currency,
            payoutMethod: me.payout_method,
            payoutDetails: me.payout_details,
            commitment: me.commitment,
            availability: me.availability,
          }}
          hasCv={Boolean(me.cv_url)}
        />
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mono-label mx-auto max-w-5xl px-5 py-20">Loading your dashboard…</div>}>
      <Dashboard />
    </Suspense>
  );
}
