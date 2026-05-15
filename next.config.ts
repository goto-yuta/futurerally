import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.vercel-storage.com" },
    ],
  },
  // Turbopack can mangle .wasm imports for native modules; we don't need it for dev DB.
  turbopack: {
    resolveAlias: {
      "@electric-sql/pglite": "@electric-sql/pglite",
    },
  },
};

export default nextConfig;
