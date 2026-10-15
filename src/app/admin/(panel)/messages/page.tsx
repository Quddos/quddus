import { Suspense } from "react";
import { MessageList, type Message } from "@/components/admin/MessageList";
import { getAdmin } from "@/lib/auth";
import { ensureSchema, hasDatabase, sql } from "@/lib/db";

async function Messages() {
  if (!(await getAdmin()) || !hasDatabase()) return <p className="py-10 text-muted">Database not configured.</p>;
  await ensureSchema();
  const rows = (await sql()`SELECT id, name, email, intent, body, read, created_at FROM messages ORDER BY created_at DESC LIMIT 200`) as Message[];
  return <MessageList messages={rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }))} />;
}

export default function MessagesPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-semibold">Messages</h1>
      <p className="mt-1 text-muted">From the contact form, including API early-access requests.</p>
      <Suspense fallback={<div className="mono-label py-10">Loading…</div>}>
        <Messages />
      </Suspense>
    </div>
  );
}
