"use client";

import { Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { messageAction } from "@/app/admin/actions";

export type Message = { id: number; name: string; email: string; intent: string; body: string; read: boolean; created_at: string };

export function MessageList({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (id: number, op: "read" | "unread" | "delete") =>
    start(async () => {
      await messageAction(id, op);
      router.refresh();
    });

  if (messages.length === 0) return <p className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No messages yet.</p>;
  return (
    <div className={`mt-8 space-y-3 ${pending ? "opacity-60" : ""}`}>
      {messages.map((m) => (
        <div key={m.id} className={`rounded-2xl border p-5 ${m.read ? "border-line" : "border-cyan/40 bg-cyan/[0.03]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                {m.name} <span className="ml-2 rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase text-muted">{m.intent}</span>
              </div>
              <a href={`mailto:${m.email}`} className="text-sm text-cyan">
                {m.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-dim">{new Date(m.created_at).toLocaleString()}</span>
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`} className="admin-btn" onClick={() => !m.read && act(m.id, "read")}>
                <Mail className="h-4 w-4" /> Reply
              </a>
              <button className="admin-btn" onClick={() => act(m.id, m.read ? "unread" : "read")}>
                Mark {m.read ? "unread" : "read"}
              </button>
              <button className="admin-btn hover:!text-danger" onClick={() => confirm("Delete this message?") && act(m.id, "delete")} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-fg/85">{m.body}</p>
        </div>
      ))}
    </div>
  );
}
