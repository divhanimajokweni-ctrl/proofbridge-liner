import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vvu.earth-tech.ai",
      },
      {
        protocol: "https",
        hostname: "api.vvu.earth-tech.ai",
      },
    ],
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
