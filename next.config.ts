import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
<<<<<<< HEAD
  /* config options here */
=======
>>>>>>> origin/main
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
<<<<<<< HEAD
  // Allow cross-origin dev requests from the preview-chat sandbox host so
  // HMR / _next resources load cleanly during development.
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "localhost", "127.0.0.1"],
=======
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
>>>>>>> origin/main
};

export default nextConfig;
