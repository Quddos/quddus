import { ArrowRight, CalendarClock, Check, Clock, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getJob } from "@/lib/career-db";

async function Role({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job || job.status === "draft") notFound();

  const facts = [
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Clock, label: "Schedule", value: job.schedule },
    { icon: Wallet, label: "Pay rate", value: job.pay_rate },
    { icon: CalendarClock, label: "Payout", value: job.payout_schedule },
  ].filter((f) => f.value);

  return (
    <article className="py-14">
      <Link href="/career#openings" className="text-sm text-muted transition hover:text-fg">
        ← All openings
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="pill">{job.employment_type}</span>
        {job.status !== "open" && <span className="pill !text-amber">Closed</span>}
        {job.hours_per_week && <span className="pill">{job.hours_per_week} a week</span>}
      </div>
      <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {job.title}
      </h1>
      {job.blurb && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{job.blurb}</p>}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-dim">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="mt-1.5 text-sm font-medium">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          {job.description && (
            <section>
              <h2 className="font-display text-xl font-semibold">About the role</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted">
                {job.description.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}
          {job.responsibilities.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold">What you will do</h2>
              <ul className="mt-3 space-y-2.5">
                {job.responsibilities.map((r) => (
                  <li key={r} className="flex gap-3 text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {job.requirements.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold">Who can apply</h2>
              <ul className="mt-3 space-y-2.5">
                {job.requirements.map((r) => (
                  <li key={r} className="flex gap-3 text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet" /> <span>{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold">How to apply</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Submit your details and CV. It takes about a minute, and you get a dashboard to track your
              application and weekly payouts.
            </p>
            {job.status === "open" ? (
              <Link href={`/career/apply?job=${job.slug}`} className="btn-primary mt-5 w-full">
                Apply now <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <p className="mt-5 rounded-lg border border-line p-3 text-sm text-muted">
                This role is closed. You can still{" "}
                <Link href="/career/apply" className="text-cyan">
                  send your CV
                </Link>{" "}
                for future openings.
              </p>
            )}
            <Link href="/career/login" className="btn-ghost mt-3 w-full">
              Already applied? Sign in
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

export default function JobPage(props: PageProps<"/career/jobs/[slug]">) {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <Suspense fallback={<div className="mono-label py-20">Loading the role…</div>}>
        <Role params={props.params} />
      </Suspense>
    </div>
  );
}
