import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ThemeScript } from "@/components/career/ThemeScript";
import { ThemeToggle } from "@/components/career/ThemeToggle";
import { currentApplicant } from "@/lib/career-auth";

const careerUrl = process.env.NEXT_PUBLIC_CAREER_URL || "https://career.diaspafra.org";

export const metadata: Metadata = {
  metadataBase: new URL(careerUrl),
  title: { default: "Careers · Diaspafra", template: "%s · Diaspafra Careers" },
  description:
    "Part-time, remote, student-friendly roles at Diaspafra. Apply in under a minute, get trained, and get paid weekly every Tuesday.",
  openGraph: {
    type: "website",
    siteName: "Diaspafra Careers",
    title: "Careers · Diaspafra",
    description: "Remote, part-time roles for students. Paid weekly, every Tuesday.",
    url: careerUrl,
  },
  robots: { index: true, follow: true },
};

async function AccountLink() {
  const me = await currentApplicant();
  return me ? (
    <Link href="/career/dashboard" className="btn-ghost !py-1.5 !text-sm">
      {me.preferred_name || "Dashboard"}
    </Link>
  ) : (
    <Link href="/career/login" className="btn-ghost !py-1.5 !text-sm">
      Sign in
    </Link>
  );
}

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="career-root" className="theme-scope flex min-h-dvh flex-col" data-theme="dark">
      <ThemeScript />
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/career" className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan to-violet" />
            <span className="font-display text-[15px] font-semibold tracking-tight">
              Diaspafra <span className="text-muted">Careers</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/career#openings" className="hidden px-2 text-sm text-muted transition hover:text-fg sm:block">
              Openings
            </Link>
            <Link href="/career/apply" className="hidden px-2 text-sm text-muted transition hover:text-fg sm:block">
              Apply
            </Link>
            <ThemeToggle />
            <Suspense fallback={<span className="btn-ghost !py-1.5 !text-sm opacity-50">Sign in</span>}>
              <AccountLink />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© Diaspafra. Remote-first, student-friendly work.</p>
          <div className="flex gap-5">
            <Link href="/career" className="transition hover:text-fg">
              Openings
            </Link>
            <Link href="/career/dashboard" className="transition hover:text-fg">
              Dashboard
            </Link>
            <a href="https://quddus.diaspafra.org" className="transition hover:text-fg">
              Main site
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
