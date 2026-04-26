import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type-checking and linting during Railway builds — saves ~2min on CI
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
    ],
  },
};

export default nextConfig;
