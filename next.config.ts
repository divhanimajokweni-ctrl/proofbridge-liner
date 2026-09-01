import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: "standalone" output removed for Vercel compatibility.
  // Vercel handles deployment natively; standalone is for self-hosting.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "localhost", "127.0.0.1"],
};

export default nextConfig;
