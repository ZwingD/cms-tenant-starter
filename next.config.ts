import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make Next bundle the package's TypeScript source if needed (the package
  // ships dual ESM + CJS so this is usually a no-op, but kept for safety).
  transpilePackages: ["@zwingd-ce/cms-revalidate-nextjs"],
  images: {
    remotePatterns: [
      {
        // CMS media is served from a shared CloudFront distribution.
        // The wildcard covers both the dev and any future prod distribution
        // without requiring a config change per environment.
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
