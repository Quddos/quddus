"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyAction, type ApplyInput } from "@/app/career/actions";
import {
  AVAILABILITY,
  COMMITMENT,
  COUNTRIES,
  CURRENCIES,
  GENDERS,
  PAYOUT_METHODS,
  YEARS_OF_STUDY,
} from "@/lib/countries";
import { CvUpload, type CvValue } from "./CvUpload";

// Every field is a string in the form; the server action validates the values.
type Draft = { [K in keyof Omit<ApplyInput, "cvUrl" | "cvName" | "website">]-?: string };

const EMPTY: Draft = {
  fullName: "",
  preferredName: "",
  whatsapp: "",
  gender: "Female",
  email: "",
  password: "",
  countryOrigin: "",
  countryResidence: "",
  yearOfStudy: "1st year undergraduate",
  payoutCurrency: "USD",
  payoutMethod: "none",
  payoutDetails: "",
  commitment: "yes",
  availability: "immediately",
  job: "",
};

const STEPS = ["About you", "Study & availability", "Payout & CV"];

export function ApplyForm({ jobs, job }: { jobs: { slug: string; title: string }[]; job: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>({ ...EMPTY, job: jobs.some((j) => j.slug === job) ? job : "" });
  const [cv, setCv] = useState<CvValue | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  function validate(current: number) {
    if (current === 0) {
      if (d.fullName.trim().length < 2) return "Tell us your full name.";
      if (!d.preferredName.trim()) return "What should we call you?";
      if (!/^[+]?[0-9][0-9\s().-]{5,}$/.test(d.whatsapp.trim()))
        return "Add your WhatsApp number with its country code, e.g. +91 98765 43210.";
      if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return "That email doesn't look right.";
      if (d.password.length < 8) return "Choose a password of at least 8 characters.";
    }
    if (current === 1) {
      if (!d.countryOrigin) return "Choose your country of origin.";
      if (!d.countryResidence) return "Choose where you live now.";
    }
    if (current === 2) {
      if (!cv) return "Upload your CV to finish.";
    }
    return "";
  }

  function next() {
    const problem = validate(step);
    if (problem) return setError(problem);
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit() {
    const problem = validate(2);
    if (problem) return setError(problem);
    setError("");
    start(async () => {
      const res = await applyAction({ ...d, cvUrl: cv?.url ?? "", cvName: cv?.name ?? "" } as ApplyInput);
      if (res.error) return setError(res.error);
      setDone(true);
      router.refresh();
    });
  }

  if (done)
    return (
      <div className="card p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto h-12 w-12 text-cyan" />
        <h2 className="mt-5 font-display text-2xl font-semibold">
          Thanks, {d.preferredName || d.fullName.split(" ")[0]}.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Your application is in. We review every CV and reach out on WhatsApp — keep an eye on {d.whatsapp}.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/career/dashboard" className="btn-primary">
            Open your dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/career" className="btn-ghost">
            Back to openings
          </Link>
        </div>
      </div>
    );

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full transition ${i <= step ? "bg-cyan" : "bg-line"}`} />
            <div className={`mt-2 text-[11px] uppercase tracking-wider ${i === step ? "text-fg" : "text-dim"}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Full name</span>
                <input className="field" value={d.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" placeholder="Aisha Bello Okonkwo" />
              </label>
              <label className="block">
                <span className="field-label">Preferred name — what should we call you?</span>
                <input className="field" value={d.preferredName} onChange={(e) => set("preferredName", e.target.value)} autoComplete="nickname" placeholder="Aisha" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">WhatsApp contact (with country code)</span>
                <input className="field" value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" />
              </label>
              <label className="block">
                <span className="field-label">Gender</span>
                <select className="field" value={d.gender} onChange={(e) => set("gender", e.target.value)}>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Email</span>
                <input className="field" type="email" value={d.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="you@university.edu" />
              </label>
              <label className="block">
                <span className="field-label">Create a password (8+ characters)</span>
                <input className="field" type="password" value={d.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" placeholder="••••••••" />
              </label>
            </div>
            <p className="text-xs text-dim">
              The password is how you get back into your dashboard to track your application and payouts.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Country of origin</span>
                <select className="field" value={d.countryOrigin} onChange={(e) => set("countryOrigin", e.target.value)}>
                  <option value="">Choose a country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Country of residence</span>
                <select className="field" value={d.countryResidence} onChange={(e) => set("countryResidence", e.target.value)}>
                  <option value="">Choose a country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="field-label">Year of study</span>
              <select className="field" value={d.yearOfStudy} onChange={(e) => set("yearOfStudy", e.target.value)}>
                {YEARS_OF_STUDY.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <span className="field-label">Can you dedicate at least 6 hours a week?</span>
              <div className="grid gap-2">
                {COMMITMENT.map((c) => (
                  <label key={c.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${d.commitment === c.value ? "border-cyan/60 bg-cyan/[0.06]" : "border-line hover:border-line-strong"}`}>
                    <input type="radio" name="commitment" className="accent-current" checked={d.commitment === c.value} onChange={() => set("commitment", c.value)} />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="field-label">How soon can you start?</span>
              <select className="field" value={d.availability} onChange={(e) => set("availability", e.target.value)}>
                {AVAILABILITY.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            {jobs.length > 0 && (
              <label className="block">
                <span className="field-label">Which role are you applying for?</span>
                <select className="field" value={d.job} onChange={(e) => set("job", e.target.value)}>
                  <option value="">General application</option>
                  {jobs.map((j) => (
                    <option key={j.slug} value={j.slug}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Payout currency</span>
                <select className="field" value={d.payoutCurrency} onChange={(e) => set("payoutCurrency", e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Payout option (optional)</span>
                <select className="field" value={d.payoutMethod} onChange={(e) => set("payoutMethod", e.target.value)}>
                  {PAYOUT_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {d.payoutMethod !== "none" && (
              <label className="block">
                <span className="field-label">PayPal email, UPI ID or bank account (optional)</span>
                <input className="field" value={d.payoutDetails} onChange={(e) => set("payoutDetails", e.target.value)} placeholder="you@paypal.com · name@upi · account number" />
              </label>
            )}
            <div>
              <span className="field-label">Upload your CV</span>
              <CvUpload value={cv} onChange={setCv} />
              <p className="mt-2 text-xs text-dim">PDF or Word, up to 8 MB. This is the only required file.</p>
            </div>
          </>
        )}

        {error && <p className="rounded-lg border border-danger/40 bg-danger/[0.07] px-3 py-2 text-sm text-danger">{error}</p>}
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <button type="button" onClick={() => { setError(""); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0 || pending} className="btn-ghost disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="btn-primary">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={pending} className="btn-primary">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Submit application
          </button>
        )}
      </div>
    </div>
  );
}
