import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getAdmin } from "@/lib/auth";

async function Settings() {
  const admin = await getAdmin();
  if (!admin) return null;
  return <SettingsForm username={admin} />;
}

export default function SettingsPage() {
  return (
    <div className="max-w-lg py-8">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
      <p className="mt-1 text-muted">Change your admin username and password.</p>
      <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
        <Settings />
      </Suspense>
    </div>
  );
}
