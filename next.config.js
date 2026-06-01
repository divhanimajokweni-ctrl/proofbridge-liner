/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone' removed — Vercel uses default serverless output
  async rewrites() {
    return [
      { source: '/',
        destination: '/vvv/index.html' },
      { source: '/pools',
        destination: '/vvv/pools.html' },
      { source: '/pools/onboarding',
        destination: '/vvv/pools-onboarding.html' },
      { source: '/pools/trust',
        destination: '/vvv/pools-trust.html' },
      { source: '/pools/ledger',
        destination: '/vvv/pools-ledger.html' },
      { source: '/pools/governance',
        destination: '/vvv/pools-governance.html' },
      { source: '/pools/learning',
        destination: '/vvv/pools-learning.html' },
      { source: '/pools/profile',
        destination: '/vvv/pools-profile.html' },
      { source: '/pools/compliance',
        destination: '/vvv/pools-compliance.html' },
      { source: '/admin/pools',
        destination: '/vvv/admin-pools.html' },
      { source: '/proofbridge',
        destination: '/vvv/proofbridge.html' },
      { source: '/gate-1',
        destination: '/vvv/gate-1.html' },
      { source: '/submission',
        destination: '/vvv/submission.html' },
      { source: '/demo/:path*',
        destination: '/demo/:path*' },
    ];
  },
};

export default nextConfig;
