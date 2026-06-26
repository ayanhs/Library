import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  // pdfkit loads .afm font files from node_modules at runtime — must not be bundled
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/book/**": ["./node_modules/pdfkit/js/data/**/*"],
  },
  turbopack: {
    root: projectRoot,
  },
  // OneDrive / synced folders can break file watchers — poll for reliable CSS rebuilds
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "pdfkit"];
    }
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
