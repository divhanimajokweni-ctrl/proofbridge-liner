/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['ethers'] = path.resolve(__dirname, 'node_modules/ethers/lib.commonjs/index.js');
    config.resolve.alias['@/prover'] = path.resolve(__dirname, 'prover');
    return config;
  },
  async rewrites() {
    return [
      { source: '/proofbridge', destination: '/vvv/proofbridge.html' },
      { source: '/gate-1',      destination: '/vvv/gate-1.html' },
      { source: '/gates',       destination: '/vvv/index.html' },
    ]
  },
}

export default nextConfig
