'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function UbuntuPoolsLanding() {
  const [status, setStatus] = useState('INGESTING QUEUES...');
  const [progress, setProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tasks = ["PARSE_HMAC", "VERIFY_STITCH_EFT", "MUTATE_REPUTATION", "SIGN_ED25519", "ANCHOR_AMOY"];
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (trackRef.current) {
            const ants = trackRef.current.querySelectorAll('.marching-ant');
            ants.forEach(ant => ant.remove());
          }
          return 0;
        }
        
        const nextProgress = prev + 5;
        const currentTask = tasks[Math.floor(Math.random() * tasks.length)];
        setStatus(`PROCESSING ${currentTask}`);

        if (trackRef.current) {
          const ant = document.createElement('div');
          ant.className = 'marching-ant';
          ant.style.position = 'absolute';
          ant.style.top = '50%';
          ant.style.transform = 'translateY(-50%)';
          ant.style.left = '60px';
          ant.style.fontFamily = '"DM Mono", monospace';
          ant.style.fontSize = '0.6rem';
          ant.style.color = '#8A9A5B';
          ant.style.whiteSpace = 'nowrap';
          ant.innerHTML = `🐜 <span style="background:rgba(138,154,91,0.15); padding:2px 6px; border-radius:4px; margin-left:4px;">${currentTask}</span>`;
          trackRef.current.appendChild(ant);

          let currentPos = 60;
          const endPos = trackRef.current.clientWidth - 160;
          const runAnimation = () => {
            currentPos += 6;
            ant.style.left = `${currentPos}px`;
            if (currentPos < endPos) {
              requestAnimationFrame(runAnimation);
            } else {
              ant.style.opacity = '0';
              setTimeout(() => ant.remove(), 100);
            }
          };
          requestAnimationFrame(runAnimation);
        }
        return nextProgress;
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ background: '#FAFAF7', color: '#1E1E1C', minHeight: '100vh', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#8A9A5B', textDecoration: 'none', fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', fontWeight: 500 }}>← RETURN TO CORE GATEWAY</Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 3rem', borderBottom: '1px solid #E9E2D6', paddingBottom: '1rem' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '2.2rem', fontWeight: 800 }}>🏘️ Ubuntu Pools</h1>
          <span style={{ background: '#8A9A5B', color: '#FFF', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 700 }}>VILLAGE OS V2.1</span>
        </div>

        <div style={{ background: '#1E1E1C', borderRadius: '16px', padding: '1.5rem', color: '#FFFFFF', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: '#8A9A5B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            <span>🐜 Ant Stack Queue Engine (SIMULATED)</span>
            <span>{status}</span>
          </div>
          <div ref={trackRef} style={{ height: '64px', background: '#0C0C0A', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#CC7722', background: '#1A1A17', padding: '2px 6px', borderRadius: '4px', zIndex: 10 }}>🍂 STITCH EFT</div>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', color: '#8A9A5B', background: '#1A1A17', padding: '2px 6px', borderRadius: '4px', zIndex: 10 }}>📂 VAULT</div>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #CC7722, #8A9A5B)', transition: 'width 0.1s linear' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', border: '1px solid #E9E2D6', textAlign: 'center' }}>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.1rem' }}>Reputation Score (DEMO)</h3>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: '6px solid #CC7722', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, margin: '1.5rem auto 1rem' }}>74</div>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: '#5A5A55' }}>Steward Management Tier (SIMULATED)</p>
          </div>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', border: '1px solid #E9E2D6' }}>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '1.1rem', marginBottom: '1rem' }}>Sovereign Allocation (DEMO)</h3>
            <p style={{ fontSize: '0.85rem', color: '#5A5A55', lineHeight: '1.5', marginBottom: '1.5rem' }}>Deploy structural pooling units securely mapped against zero-knowledge consensus infrastructure.</p>
            <input type="text" placeholder="Pool Label Identifier" style={{ width: '100%', padding: '0.75rem', border: '1px solid #E9E2D6', borderRadius: '8px', background: '#FAFAF7', fontFamily: 'inherit', marginBottom: '0.75rem' }} />
            <button style={{ width: '100%', padding: '0.75rem', background: '#1E1E1C', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Initialize Framework (DEMO)</button>
          </div>
        </div>
      </div>
    </main>
  );
}
