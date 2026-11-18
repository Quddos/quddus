import { Clock3, ShieldCheck, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ApplyForm } from "@/components/career/ApplyForm";
import { careerSessionId } from "@/lib/career-auth";
import { listJobs } from "@/lib/career-db";

export const metadata = {
  title: "Apply",
  description: "Submit your details and CV. It takes about a minute.",
};

async function Form({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  // Someone already signed in belongs on the dashboard, not in signup.
  if (await careerSessionId()) redirect("/career/dashboard");
  const [{ job = "" }, jobs] = await Promise.all([searchParams, listJobs()]);
  return <ApplyForm jobs={jobs.map(({ slug, title }) => ({ slug, title }))} job={job} />;
}

export default function ApplyPage(props: PageProps<"/career/apply">) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="mono-label">Application</div>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Tell us about yourself
      </h1>
      <p className="mt-3 text-muted">
        Three short steps. You&apos;ll be done in about a minute, and you can update anything later from your
        dashboard.
      </p>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-cyan" /> ~60 seconds
        </span>
        <span className="inline-flex items-center gap-2">
          <Wallet className="h-4 w-4 text-cyan" /> Weekly payouts, every Tuesday
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan" /> Your details stay private
        </span>
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Form searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
