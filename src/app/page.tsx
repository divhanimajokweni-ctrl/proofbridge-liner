'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [phase, setPhase] = useState<'sphere' | 'redirect'>('sphere');

  useEffect(() => {
    // Show the Trust Sphere with swirling rings for 4 seconds,
    // then redirect to the Trust Dashboard
    const timer = setTimeout(() => {
      setPhase('redirect');
      window.location.replace('/vvu-trust-dashboard.html');
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (phase === 'redirect') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#060a10',
        color: '#D4AF37',
        fontFamily: 'ui-monospace, monospace',
        gap: '1rem',
      }}>
        <div style={{ fontSize: '0.7em', color: '#5b7280', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Loading Trust Dashboard…
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#060a10',
      color: '#e8e6e0',
      fontFamily: "'Syne', 'Georgia', serif",
      gap: '2rem',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Swirling three rings — large, centered */}
      <div style={{
        position: 'relative',
        width: '180px',
        height: '180px',
      }}>
        <svg viewBox="0 0 100 100" fill="none" style={{
          width: '100%',
          height: '100%',
          animation: 'ring-swirl-large 6s ease-in-out infinite',
          transformOrigin: '50% 55%',
          filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))',
        }}>
          <circle cx="35" cy="40" r="16" stroke="#D4AF37" strokeWidth="4" style={{ animation: 'ring-pulse-large 3s ease-in-out infinite', animationDelay: '0s' }} />
          <circle cx="65" cy="40" r="16" stroke="#C9A84C" strokeWidth="4" style={{ animation: 'ring-pulse-large 3s ease-in-out infinite', animationDelay: '1s' }} />
          <circle cx="50" cy="64" r="16" stroke="#FFFFFF" strokeWidth="4" style={{ animation: 'ring-pulse-large 3s ease-in-out infinite', animationDelay: '2s' }} />
        </svg>
      </div>

      {/* Brand text */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '1.8em',
          fontWeight: 800,
          letterSpacing: '0.04em',
          color: '#e8e6e0',
          margin: 0,
        }}>
          Venture Vision <span style={{ color: '#D4AF37' }}>Ubuntu</span>
        </h1>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.6em',
          color: '#5b7280',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginTop: '8px',
        }}>
          TRUST RUNTIME · VERIFICATION STATE SPACE
        </div>
      </div>

      {/* "We Serve Trust" */}
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.7em',
        color: '#D4AF37',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        opacity: 0.8,
      }}>
        We Serve Trust
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes ring-swirl-large {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.1); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes ring-pulse-large {
          0%, 100% { stroke-width: 4; opacity: 1; }
          50% { stroke-width: 6; opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          svg { animation: none !important; }
          circle { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
