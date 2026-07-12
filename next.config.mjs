/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: '.',
    resolveAlias: {
      '@': {
        source: '.',
      },
    },
  },
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
