/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'vvu.earth-tech.ai',
      'api.vvu.earth-tech.ai'
    ],
  },
  async rewrites() {
    return [
      { source: '/proofbridge', destination: '/vvv/proofbridge.html' },
      { source: '/dlt',         destination: '/vvv/dlt.html' },
      { source: '/gate-1',      destination: '/vvv/gate-1.html' },
      { source: '/gate-2',      destination: '/vvv/gate-2.html' },
      { source: '/gate-3',      destination: '/vvv/gate-3.html' },
      { source: '/gate-4',      destination: '/vvv/gate-4.html' },
      { source: '/gate-5',      destination: '/vvv/gate-5.html' },
      { source: '/gate-6',      destination: '/vvv/gate-6.html' },
      { source: '/gates',       destination: '/vvv/index.html' },
    ]
  },
}

module.exports = nextConfig
