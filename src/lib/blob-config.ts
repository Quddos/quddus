// How admin uploads can reach Vercel Blob on this deployment.
// "client": browser uploads straight to Blob (large files), needs BLOB_READ_WRITE_TOKEN.
// "server": file goes through our function (up to ~4 MB), works with a store ID + OIDC.
export function blobMode(): "client" | "server" | "none" {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "client";
  if (process.env.BLOB_STORE_ID) return "server";
  return "none";
}

export const SERVER_UPLOAD_LIMIT = 4 * 1024 * 1024;
