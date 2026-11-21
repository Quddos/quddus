"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { careerLoginAction, type CareerState } from "@/app/career/actions";

export function CareerLogin() {
  const [state, action, pending] = useActionState<CareerState, FormData>(careerLoginAction, {});
  return (
    <form action={action} className="card mt-8 space-y-4 p-6">
      <label className="block">
        <span className="field-label">Email</span>
        <input name="email" type="email" required className="field" autoComplete="email" />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input name="password" type="password" required className="field" autoComplete="current-password" />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
    </form>
  );
}
