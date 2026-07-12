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
      '@/lib/db': {
        source: './lib/db/src',
      },
    },
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
    config.resolve.alias['@/lib/db'] = path.resolve(__dirname, 'lib/db/src');
    return config;
  },
  async rewrites() {
    return []
  },
}

export default nextConfig
