import { ExternalLink, Inbox, KeyRound, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SECTIONS } from "@/lib/admin-schema";
import { getAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

async function Shell({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-fg";
  return (
    <div className="md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line p-4 md:sticky md:top-0 md:h-dvh md:overflow-y-auto md:border-b-0 md:border-r">
        <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan to-violet" />
          <span className="font-display font-semibold">Control room</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          <Link href="/admin" className={item}>
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link href="/admin/messages" className={item}>
            <Inbox className="h-4 w-4" /> Messages
          </Link>
          <Link href="/admin/api" className={item}>
            <KeyRound className="h-4 w-4" /> API keys
          </Link>
          <div className="mono-label hidden px-3 pb-1 pt-5 md:block">Content</div>
          {SECTIONS.map((s) => (
            <Link key={s.key} href={`/admin/${s.key}`} className={`${item} whitespace-nowrap`}>
              {s.label}
            </Link>
          ))}
          <div className="mono-label hidden px-3 pb-1 pt-5 md:block">Account</div>
          <Link href="/admin/settings" className={item}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <Link href="/" target="_blank" className={item}>
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <form action={logoutAction}>
            <button className={`${item} w-full`}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </nav>
        <div className="mt-6 hidden px-3 font-mono text-xs text-dim md:block">Signed in as {admin}</div>
      </aside>
      <div className="min-w-0 px-5 pb-20 md:px-10">{children}</div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="mono-label grid min-h-dvh place-items-center">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
