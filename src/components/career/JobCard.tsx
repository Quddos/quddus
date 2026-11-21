import { ArrowUpRight, CalendarClock, Clock, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/lib/career-db";

export function JobCard({ job }: { job: Job }) {
  const facts = [
    { icon: MapPin, text: job.location },
    { icon: Clock, text: job.schedule },
    { icon: Wallet, text: job.pay_rate },
    { icon: CalendarClock, text: job.payout_schedule },
  ].filter((f) => f.text);

  return (
    <Link
      href={`/career/jobs/${job.slug}`}
      className="card group block p-6 transition hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="pill">{job.employment_type}</span>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{job.title}</h3>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-dim transition group-hover:text-cyan" />
      </div>
      {job.blurb && <p className="mt-2 text-sm leading-relaxed text-muted">{job.blurb}</p>}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        {facts.map(({ icon: Icon, text }) => (
          <span key={text} className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-dim" /> {text}
          </span>
        ))}
      </div>
    </Link>
  );
}
