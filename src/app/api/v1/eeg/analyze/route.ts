import { consume, findKey, LIMITS } from "@/lib/api-keys";
import { hasDatabase, sql } from "@/lib/db";
import { analyze, DEFAULT_OPTIONS, type Recording } from "@/lib/eeg/analyze";
import { parseCsv, parseEdf } from "@/lib/eeg/parse";
import { apiError, CORS } from "../../cors";

export const maxDuration = 60;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// Runs the EEG Biomarker pipeline. Send a multipart `file` (EDF or CSV, optional `fs`),
// or JSON { fs, channels: [{ name, data: number[] }] }.
export async function POST(req: Request) {
  if (!hasDatabase()) return apiError(503, "The API isn't configured yet.", "not_configured");
  const auth = req.headers.get("authorization") ?? "";
  const record = await findKey(auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "");
  if (!record || record.revoked) return apiError(401, "Missing, invalid or revoked API key.", "invalid_api_key");

  let rec: Recording;
  try {
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return apiError(400, "Send the recording as a multipart field named `file`.", "missing_file");
      const fs = Number(form.get("fs")) || undefined;
      rec = /\.(edf|bdf)$/i.test(file.name) ? parseEdf(await file.arrayBuffer(), file.name) : parseCsv(await file.text(), file.name, fs ?? 128);
      if (fs) rec.fs = fs;
    } else {
      const body = (await req.json()) as { fs?: number; channels?: { name?: string; data?: number[] }[] };
      if (!body?.fs || !Array.isArray(body.channels) || !body.channels.length) return apiError(400, "JSON body needs `fs` and `channels`.", "invalid_body");
      rec = {
        fs: body.fs,
        source: "api",
        channels: body.channels.map((c, i) => ({ name: String(c.name ?? `Ch${i + 1}`), data: Float32Array.from(c.data ?? []) })),
      };
    }
  } catch (e) {
    return apiError(400, (e as Error).message || "Couldn't read the recording.", "parse_error");
  }
  if (!(rec.fs >= 32 && rec.fs <= 20000)) return apiError(400, "`fs` must be between 32 and 20000 Hz.", "invalid_fs");

  const limited = await consume(`key:${record.id}`, LIMITS.keyDaily);
  if (limited) return apiError(429, limited, "rate_limit_exceeded");
  await sql()`UPDATE api_keys SET last_used_at = now() WHERE id = ${record.id}`;
  try {
    return Response.json(analyze(rec, { ...DEFAULT_OPTIONS, maxSeconds: 600 }), { headers: CORS });
  } catch (e) {
    return apiError(422, (e as Error).message, "analysis_failed");
  }
}
