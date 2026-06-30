import Link from 'next/link';

export default function PopiaCompliance() {
  return (
    <main className="vvu-docs" style={{ minHeight: '100vh' }}>
      <div className="vvu-docs-container">
        <p className="vvu-docs-back-link">
          <Link href="/" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.05em' }}>← BACK TO HUB</Link>
        </p>
        <h1 className="vvu-docs-h1">POPIA Compliance Statement</h1>
        <div className="vvu-docs-accent-card">
          <strong>Responsible Party:</strong> VVU Foundation (Registration: CIPC Pending) | <strong>Storage:</strong> AWS af-south-1 (Cape Town, South Africa)
        </div>

        <h3 className="vvu-docs-h3">1. Processing Context & Retentions</h3>
        <p className="vvu-docs-p">
          Personal parameters gathered through operations (Names, identification tokens, contact endpoints) are handled strictly to enable peer-to-peer structural distributions via the Stitch banking API layer. Financial records are preserved for exactly 7 years in compliance with statutory FICA operational guidelines.
        </p>

        <h3 className="vvu-docs-h3">2. Data Subject Protections</h3>
        <p className="vvu-docs-p">
          Platform participants hold standard access privileges, tracking limits, structural remediation avenues, and operational suppression keys. Data breach management protocols require notifying the Information Regulator within 72 hours under POPIA §22 via security@vvu.foundation.
        </p>
      </div>
    </main>
  );
}
