import Link from "next/link";
import { CareerLogin } from "@/components/career/CareerLogin";

export const metadata = { title: "Sign in" };

export default function CareerLoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-5 py-20">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to track your application, hours and weekly payouts.</p>
      <CareerLogin />
      <p className="mt-6 text-sm text-muted">
        Haven&apos;t applied yet?{" "}
        <Link href="/career/apply" className="text-cyan">
          Submit your CV
        </Link>
        .
      </p>
    </div>
  );
}
