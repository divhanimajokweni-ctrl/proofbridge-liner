'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ProofBridgeLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = 135;
    let rotationX = 0;
    let rotationY = 0;
    
    const nodes: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 180; i += 10) {
      let latitude = (i * Math.PI) / 180 - Math.PI / 2;
      for (let j = 0; j < 360; j += 15) {
        let longitude = (j * Math.PI) / 180 - Math.PI;
        let x = radius * Math.cos(latitude) * Math.sin(longitude);
        let y = radius * Math.sin(latitude);
        let z = radius * Math.cos(latitude) * Math.cos(longitude);
        nodes.push({ x, y, z });
      }
    }

    let animationFrameId: number;
    const projectAndRenderGlobe = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(204, 119, 34, 0.75)';

      rotationY += 0.003;
      rotationX += 0.0015;

      const cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);

      nodes.forEach((node) => {
        let rotX = node.x * cosY - node.z * sinY;
        let rotZ = node.z * cosY + node.x * sinY;
        let rotY = node.y * cosX - rotZ * sinX;
        let finalZ = rotZ * cosX + node.y * sinX;

        if (finalZ + radius > 0) {
          const screenX = canvas.width / 2 + rotX;
          const screenY = canvas.height / 2 + rotY;
          const scalingFactor = Math.max(0.4, (finalZ + radius) / (radius * 2));

          ctx.beginPath();
          ctx.arc(screenX, screenY, scalingFactor * 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(projectAndRenderGlobe);
    };

    projectAndRenderGlobe();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <main style={{ background: '#1E1E1C', color: '#FFFFFF', minHeight: '100vh', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#CC7722', textDecoration: 'none', fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', fontWeight: 500 }}>← RETURN TO CORE GATEWAY</Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '2.2rem', fontWeight: 800 }}>🔗 ProofBridge Liner</h1>
          <span style={{ background: '#CC7722', color: '#1E1E1C', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 700 }}>POLYGON AMOY NET</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div style={{ background: '#0C0C0A', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', lineHeight: 1.8 }}>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF5F56' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFBD2E' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27C93F' }}></span>
            </div>
            <div style={{ color: '#666' }}>$ proofbridge --status</div>
            <div style={{ color: '#8A9A5B' }}>▶ Circuit-Breaker Mesh: OPERATIONAL</div>
            <div style={{ color: '#666' }}>$ proofbridge integrity --verify</div>
            <div style={{ color: '#8A9A5B' }}>✓ ED25519 Cryptographic Root Key Verified</div>
            <div style={{ color: 'rgba(255,255,255,0.25)' }}>✓ TEE State: software-attested fallback enabled (SIMULATED)</div>
            <div style={{ color: '#666' }}>$ <span style={{ animation: 'blink 1s infinite' }}>_</span></div>
          </div>

          <div style={{ background: '#0C0C0A', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={canvasRef} width="360" height="360" style={{ maxWidth: '100%', height: 'auto' }} />
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', color: '#CC7722', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '1rem' }}>
              ATTESTATION QUORUM GEOMETRY (SIMULATED)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
