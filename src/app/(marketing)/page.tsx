import { Suspense } from 'react';
import AntColonyLoader from '@/components/fx/AntColonyLoader';

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: '#8F9CAE' }}>Loading ProofBridge…</div>}>
      <ProofBridgeLoader />
    </Suspense>
  );
}

function ProofBridgeLoader() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AntColonyLoader isLoading={true} />
      <div style={{ position: 'relative', zIndex: 10, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.1', color: '#e6edf3' }}>Every rand, <span style={{ color: '#c8a96e' }}>cryptographically</span> proven.</h1>
        <p style={{ color: '#8F9CAE', maxWidth: '640px', marginTop: '1rem', lineHeight: '1.6' }}>
          ProofBridge mints ED25519-signed on-chain receipts for every Ubuntu Pool transaction. The chain is the auditor.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <a href="/dashboard" style={{ background: '#3ecf8e', color: '#000', padding: '0.75rem 1.25rem', borderRadius: '999px', fontWeight: 'bold', textDecoration: 'none' }}>Launch dashboard</a>
          <a href="/ubuntu-pools" style={{ border: '1px solid #1c2535', color: '#c8a96e', padding: '0.75rem 1.25rem', borderRadius: '999px', textDecoration: 'none' }}>Explore pools</a>
        </div>
      </div>
    </div>
  );
}
