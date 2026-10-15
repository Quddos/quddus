"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { changePasswordAction, type FormState } from "@/app/admin/actions";

export function SettingsForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";
  return (
    <form action={action} className="mt-8 space-y-4 rounded-2xl border border-line bg-bg-2 p-6">
      <label className="block">
        <span className={label}>Username</span>
        <input name="username" defaultValue={username} className="admin-input" autoComplete="username" />
      </label>
      <label className="block">
        <span className={label}>Current password</span>
        <input name="current" type="password" required className="admin-input" autoComplete="current-password" />
      </label>
      <label className="block">
        <span className={label}>New password (10+ characters)</span>
        <input name="next" type="password" required minLength={10} className="admin-input" autoComplete="new-password" />
      </label>
      <label className="block">
        <span className={label}>Confirm new password</span>
        <input name="confirm" type="password" required minLength={10} className="admin-input" autoComplete="new-password" />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-cyan">{state.ok}</p>}
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition hover:bg-cyan disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Update credentials
      </button>
    </form>
  );
}
