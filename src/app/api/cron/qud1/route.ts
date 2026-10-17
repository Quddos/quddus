import { connection } from "next/server";

// Daily Vercel Cron ping that keeps the free Hugging Face Space hosting Qud-1's
// own weights from going to sleep (Spaces sleep after 48 h without traffic).
export async function GET(req: Request) {
  await connection(); // run on every request, never prerendered
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const base = process.env.QUD1_BASE_URL?.replace(/\/+$/, "");
  if (!base) return Response.json({ ok: false, detail: "QUD1_BASE_URL is not set" });
  try {
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${process.env.QUD1_API_KEY || ""}` },
      signal: AbortSignal.timeout(20_000),
    });
    return Response.json({ ok: res.ok, status: res.status });
  } catch (e) {
    // A sleeping Space starts waking on the first request even if this one times out.
    return Response.json({ ok: false, detail: (e as Error).message });
  }
}
