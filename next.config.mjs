/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  outputFileTracing: false,
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'vvu.earth-tech.ai',
      'api.vvu.earth-tech.ai',
    ],
  },
  webpack: (config) => {
    config.resolve.alias['ethers'] = path.resolve(__dirname, 'node_modules/ethers/lib.commonjs/index.js');
    config.resolve.alias['@/prover'] = path.resolve(__dirname, 'prover');
    config.resolve.alias['@/server'] = path.resolve(__dirname, 'server');
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  async rewrites() {
    return [
      { source: '/trust-sphere', destination: '/vvv/trust-sphere.html' },
    ]
  },
}

export default nextConfig
