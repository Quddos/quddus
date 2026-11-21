import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Keep next dev/build checking for Next.js security advisories.
  experimental: { agentUpgrade: "security" },
  images: {
    // Admin uploads live on Vercel Blob; other pasted URLs are shown unoptimized (see lib/images).
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
