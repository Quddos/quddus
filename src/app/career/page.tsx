import { ArrowRight, BadgeCheck, GraduationCap, Globe2, Timer, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { JobCard } from "@/components/career/JobCard";
import { listJobs } from "@/lib/career-db";

export const metadata = {
  // Same segment as the layout, so the template does not apply here.
  title: { absolute: "Careers at Diaspafra · Open roles" },
  description:
    "Remote, part-time roles for students at Diaspafra. No experience needed, training provided, paid weekly every Tuesday.",
};

async function Openings() {
  const jobs = await listJobs();
  if (jobs.length === 0)
    return (
      <div className="card p-10 text-center">
        <p className="text-muted">No openings are live right now.</p>
        <p className="mt-2 text-sm text-dim">
          Send your details anyway — we keep applications on file and reach out when a role opens.
        </p>
        <Link href="/career/apply" className="btn-primary mt-6">
          Submit your CV <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

const PERKS = [
  { icon: Timer, title: "6 hours a week", text: "3 days a week, 2 hours a day. Built around your class timetable." },
  { icon: Wallet, title: "Paid every Tuesday", text: "Weekly payouts in your own currency — PayPal, UPI or local bank." },
  { icon: GraduationCap, title: "No experience needed", text: "Training is provided. We hire for consistency and curiosity." },
  { icon: Globe2, title: "Fully remote", text: "Work from anywhere with a laptop and a good internet connection." },
];

const STEPS = [
  { n: "01", title: "Apply in under a minute", text: "Your details, your CV, and how soon you can start." },
  { n: "02", title: "Short intro chat", text: "A quick WhatsApp conversation so we can get to know you." },
  { n: "03", title: "Get trained", text: "We walk you through the tools and the first week's tasks." },
  { n: "04", title: "Get paid weekly", text: "Log your hours; your payout lands every Tuesday." },
];

export default function CareerHome() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <section className="py-16 sm:py-24">
        <span className="pill">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan pulse-dot" /> Now hiring students
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Part-time work that fits around <span className="text-gradient">your degree</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Diaspafra hires students for remote, part-time roles in content, social and AI automation. No prior
          experience — training is provided, hours are flexible, and payouts land every Tuesday.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/career/apply" className="btn-primary">
            Submit your CV <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="#openings" className="btn-ghost">
            See open roles
          </Link>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-dim">
          <BadgeCheck className="h-4 w-4 text-cyan" /> Takes about 60 seconds. You can finish your profile later.
        </p>
      </section>

      <section className="grid gap-4 border-t border-line py-12 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-5">
            <Icon className="h-5 w-5 text-cyan" />
            <h2 className="mt-3 font-medium">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section id="openings" className="scroll-mt-24 border-t border-line py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mono-label">Open roles</div>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Where we need help</h2>
          </div>
          <Link href="/career/apply" className="hidden text-sm text-cyan sm:block">
            Apply without picking a role →
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="card h-48 animate-pulse" />
              ))}
            </div>
          }
        >
          <Openings />
        </Suspense>
      </section>

      <section className="border-t border-line py-14">
        <div className="mono-label">How it works</div>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">From application to first payout</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-5">
              <div className="font-mono text-xs text-cyan">{s.n}</div>
              <h3 className="mt-2 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-20 rounded-2xl border border-line bg-bg-2 p-8 sm:p-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Ready to get started?</h2>
        <p className="mt-2 max-w-xl text-muted">
          Submit your details and CV now. You&apos;ll get a dashboard where you can track your application, your
          weekly payout status and your payout history.
        </p>
        <Link href="/career/apply" className="btn-primary mt-6">
          Submit your CV <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
