import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-40cdace1-2522-46fb-bb66-681928384294.space-z.ai",
    ".space-z.ai",
  ],
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
      {
        protocol: "https",
        hostname: "clerk.venturevisionubuntu.co.za",
      },
    ],
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
