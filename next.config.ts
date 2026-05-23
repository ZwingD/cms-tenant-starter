import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make Next bundle the package's TypeScript source if needed (the package
  // ships dual ESM + CJS so this is usually a no-op, but kept for safety).
  transpilePackages: ["@zwingd-ce/cms-revalidate-nextjs"],
};

export default nextConfig;
