import Link from 'next/link';

export default function PopiaCompliance() {
  return (
    <main style={{ padding: '3rem 2rem', background: '#FAFAF7', color: '#1E1E1C', minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto', lineHeight: '1.7' }}>
        <Link href="/" style={{ color: '#8A9A5B', fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', textDecoration: 'none' }}>← BACK TO HUB</Link>
        <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '2rem', fontWeight: 800, margin: '1.5rem 0' }}>POPIA Compliance Statement</h1>
        <p style={{ background: '#E9E2D6', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, borderLeft: '4px solid #CC7722' }}>
          <strong>Responsible Party:</strong> VVU Foundation (Registration: CIPC Pending) | <strong>Storage:</strong> AWS af-south-1 (Cape Town, South Africa)
        </p>
        <h3 style={{ marginTop: '2rem' }}>1. Processing Context & Retentions</h3>
        <p style={{ fontSize: '0.9rem', color: '#444' }}>
          Personal parameters gathered through operations (Names, identification tokens, contact endpoints) are handled strictly to enable peer-to-peer structural distributions via the Stitch banking API layer. Financial records are preserved for exactly 7 years in compliance with statutory FICA operational guidelines.
        </p>
        <h3 style={{ marginTop: '1.5rem' }}>2. Data Subject Protections</h3>
        <p style={{ fontSize: '0.9rem', color: '#444' }}>
          Platform participants hold standard access privileges, tracking limits, structural remediation avenues, and operational suppression keys. Data breach management protocols require notifying the Information Regulator within 72 hours under POPIA §22 via security@vvu.foundation.
        </p>
      </div>
    </main>
  );
}
