import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdmin, readSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { blobMode, SERVER_UPLOAD_LIMIT } from "@/lib/blob-config";

// Tells the admin UI which upload path is available.
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ mode: blobMode(), serverLimit: SERVER_UPLOAD_LIMIT });
}

// Issues short-lived tokens so the browser uploads straight to Vercel Blob,
// which allows large videos and 3D models.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const cookie = request.headers.get("cookie") ?? "";
        const token = cookie
          .split(/;\s*/)
          .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
          ?.slice(SESSION_COOKIE.length + 1);
        if (!(await readSessionToken(token))) throw new Error("Not signed in");
        return {
          allowedContentTypes: [
            "image/*",
            "video/*",
            "application/pdf",
            "model/gltf-binary",
            "model/gltf+json",
            "application/octet-stream",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
