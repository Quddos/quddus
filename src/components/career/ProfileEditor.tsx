"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/career/actions";
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

export type ProfileDraft = {
  fullName: string;
  preferredName: string;
  whatsapp: string;
  gender: string;
  countryOrigin: string;
  countryResidence: string;
  yearOfStudy: string;
  payoutCurrency: string;
  payoutMethod: string;
  payoutDetails: string;
  commitment: string;
  availability: string;
};

export function ProfileEditor({ initial, hasCv }: { initial: ProfileDraft; hasCv: boolean }) {
  const [d, setD] = useState<ProfileDraft>(initial);
  const [cv, setCv] = useState<CvValue | null>(null);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [pending, start] = useTransition();
  const set = (k: keyof ProfileDraft, v: string) => setD((p) => ({ ...p, [k]: v }));

  const save = () =>
    start(async () => {
      const res = await updateProfileAction({ ...d, cvUrl: cv?.url ?? "", cvName: cv?.name ?? "" });
      setMsg(res);
    });

  return (
    <div className="card mt-4 space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Full name</span>
          <input className="field" value={d.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </label>
        <label className="block">
          <span className="field-label">Preferred name</span>
          <input className="field" value={d.preferredName} onChange={(e) => set("preferredName", e.target.value)} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">WhatsApp contact</span>
          <input className="field" value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="tel" />
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <label className="block">
        <span className="field-label">Weekly commitment</span>
        <select className="field" value={d.commitment} onChange={(e) => set("commitment", e.target.value)}>
          {COMMITMENT.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
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
          <span className="field-label">Payout option</span>
          <select className="field" value={d.payoutMethod} onChange={(e) => set("payoutMethod", e.target.value)}>
            {PAYOUT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="field-label">PayPal email, UPI ID or bank account</span>
        <input className="field" value={d.payoutDetails} onChange={(e) => set("payoutDetails", e.target.value)} />
      </label>
      <div>
        <span className="field-label">{hasCv ? "Replace your CV (optional)" : "Upload your CV"}</span>
        <CvUpload value={cv} onChange={setCv} />
      </div>
      {msg.error && <p className="text-sm text-danger">{msg.error}</p>}
      {msg.ok && <p className="text-sm text-cyan">{msg.ok}</p>}
      <button onClick={save} disabled={pending} className="btn-primary">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save details
      </button>
    </div>
  );
}
