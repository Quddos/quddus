import { NextResponse, type NextRequest } from "next/server";

// career.diaspafra.org serves the career portal at its own root while sharing
// this codebase and database. Set NEXT_PUBLIC_CAREER_HOST to use another host
// (comma-separated for several, e.g. a preview domain).
const CAREER_HOSTS = (process.env.NEXT_PUBLIC_CAREER_HOST || "career.diaspafra.org")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

// Paths that must keep their real route on every host.
const PASS_THROUGH = ["/career", "/api", "/admin", "/_next", "/_vercel"];

function isCareerHost(header: string | null) {
  const host = (header ?? "").split(":")[0].toLowerCase();
  if (!host) return false;
  return CAREER_HOSTS.includes(host) || host.startsWith("career.");
}

export function proxy(request: NextRequest) {
  if (!isCareerHost(request.headers.get("host"))) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PASS_THROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  // Files in /public (favicon.ico, icon.svg, sitemap.xml …) keep their path.
  if (pathname.includes(".")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/career" : `/career${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
