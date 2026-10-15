"use client";

import { Loader2, Lock } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type FormState } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-50" />
      <form action={action} className="glass relative w-full max-w-sm rounded-3xl p-8">
        <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-violet text-bg">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="font-display text-2xl font-semibold">Control room</h1>
        <p className="mt-1 text-sm text-muted">Sign in to edit your portfolio.</p>
        <div className="mt-6 space-y-3">
          <input name="username" defaultValue={state.username} autoComplete="username" required placeholder="Username" className="admin-input" />
          <input name="password" type="password" autoComplete="current-password" required placeholder="Password" className="admin-input" />
        </div>
        {state.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
        <button disabled={pending} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fg py-3 font-medium text-bg transition hover:bg-cyan disabled:opacity-60">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </button>
      </form>
    </div>
  );
}
