import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin dev requests from the preview-chat sandbox host so
  // HMR / _next resources load cleanly during development.
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "localhost", "127.0.0.1"],
};

export default nextConfig;
