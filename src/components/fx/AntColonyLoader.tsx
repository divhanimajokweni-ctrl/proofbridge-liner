import React, { useEffect, useRef, useState, useMemo } from 'react';

interface AntColonyLoaderProps {
  isLoading: boolean;
  onComplete?: () => void;
  simulateNetworkError?: boolean;
}

export default function AntColonyLoader({ isLoading, onComplete, simulateNetworkError = false }: AntColonyLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('INITIALIZING COLONY NETWORK...');
  const [isSystemFault, setIsSystemFault] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const trackingLogs = [
    'ASSEMBLING SYSTEM WORKERS [🐜...]',
    'LINKING PROOF-PACKETS // UMUNTU NGUMUNTU NGABANTU',
    'DISTRIBUTING NODE WEIGHTS COOPERATIVELY...',
    'COLONY COLLATION STABLE. PREPARING UI GRAPHICS...'
  ];

  const marchDuration = useMemo(() => {
    if (progress < 25) return '5.0s';
    if (progress < 60) return '3.5s';
    if (progress < 85) return '2.0s';
    return '0.9s';
  }, [progress]);

  const matrixLanes = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${(i * 7) + 2}%`,
      delay: `${Math.random() * 5}s`,
      speed: `${3 + Math.random() * 4}s`
    }));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    setProgress(0);
    setIsSystemFault(false);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev > 45 && simulateNetworkError) {
          setIsSystemFault(true);
          setCurrentTask('CRITICAL_ERR: INGEST ROUTE BLOCKED. PACKETS DROPPED.');
          clearInterval(progressInterval);
          return prev;
        }

        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }

        const logIndex = Math.min(Math.floor((prev / 100) * trackingLogs.length), trackingLogs.length - 1);
        if (!isSystemFault) {
          setCurrentTask(trackingLogs[logIndex]);
        }

        return prev + Math.random() * 4 + 1.5;
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, [isLoading, simulateNetworkError, isSystemFault]);

  if (!isLoading && progress >= 100) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#020305', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', zIndex: 9999,
      fontFamily: 'monospace', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes antMatrixRain {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 0.12; }
          90% { opacity: 0.12; }
          100% { transform: translateY(105vh); opacity: 0; }
        }
        @keyframes antMarchLeftToRight {
          0% { transform: translateX(-30px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(530px); opacity: 0; }
        }
        @keyframes packetScatterDrop {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(22px) rotate(180deg); opacity: 0.3; }
        }
        @keyframes textGlitchFlash {
          0%, 100% { opacity: 1; text-shadow: 0 0 2px rgba(255,50,50,0.5); }
          50% { opacity: 0.4; text-shadow: none; }
        }
        .matrix-rain-lane {
          position: absolute; top: -100px; color: #1d332d; font-size: 11px;
          writing-mode: vertical-rl; text-orientation: upright;
          animation: antMatrixRain linear infinite; pointer-events: none; user-select: none;
        }
        .ant-worker-unit {
          display: inline-block; position: absolute;
          animation: antMarchLeftToRight ${marchDuration} infinite linear;
        }
        .dropped-payload {
          display: inline-block; position: absolute; left: 45%; top: 12px;
          animation: packetScatterDrop 0.6s forwards cubic-bezier(0.25, 1, 0.5, 1);
        }
        .fault-flash-text {
          animation: textGlitchFlash 0.5s infinite ease-in-out;
        }
      `}</style>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        {matrixLanes.map((lane) => (
          <div
            key={lane.id}
            className="matrix-rain-lane"
            style={{ left: lane.left, animationDelay: lane.delay, animationDuration: lane.speed }}
          >
            🐜🐜🐜🐜🐜🐜🐜🐜🐜🐜
          </div>
        ))}
      </div>

      <div style={{
        width: '90%', maxWidth: '500px', backgroundColor: '#06080C',
        border: isSystemFault ? '1px solid #C8502A' : '1px solid #141B25',
        boxShadow: isSystemFault ? '0 0 40px rgba(200,80,42,0.15)' : '0 0 30px rgba(0,0,0,0.7)',
        borderRadius: '4px', padding: '1.5rem', boxSizing: 'border-box', zIndex: 5,
        transition: 'border 0.4s ease, box-shadow 0.4s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #141B25', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          <span style={{ color: isSystemFault ? '#C8502A' : '#8F9CAE', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {isSystemFault ? '⚠️ ENGINE_FAULT_DETECTED' : 'SYSTEM_BOOT // COLONY_CONCURRENCY'}
          </span>
          <span style={{ color: isSystemFault ? '#FF5555' : '#D4A843', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {isSystemFault ? 'HALTED' : `${Math.floor(progress)}%`}
          </span>
        </div>

        <div style={{
          height: '48px', backgroundColor: isSystemFault ? '#140505' : '#020305',
          border: isSystemFault ? '1px dashed #C8502A' : '1px dashed #141B25',
          borderRadius: '2px', position: 'relative', overflow: 'hidden', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', transition: 'background-color 0.4s ease'
        }}>
          {isSystemFault ? (
            <>
              <div style={{ position: 'absolute', left: '42%', fontSize: '14px' }}>🐜</div>
              <span className="dropped-payload" style={{ color: '#FF3333' }}>📦</span>
              <div style={{ position: 'absolute', left: '55%', fontSize: '14px' }}>🐜</div>
              <span className="dropped-payload" style={{ color: '#FF3333', left: '57%', animationDelay: '0.1s' }}>⚡</span>
            </>
          ) : (
            <>
              <div className="ant-worker-unit" style={{ animationDelay: '0.0s' }}>
                <span>🐜</span><span style={{ fontSize: '8px', color: '#00E5FF', verticalAlign: 'super', marginLeft: '-2px' }}>📦</span>
              </div>
              <div className="ant-worker-unit" style={{ animationDelay: '0.8s' }}>
                <span>🐜</span><span style={{ fontSize: '8px', color: '#D4A843', verticalAlign: 'super', marginLeft: '-2px' }}>⚡</span>
              </div>
              <div className="ant-worker-unit" style={{ animationDelay: '1.6s' }}>
                <span>🐜</span><span style={{ fontSize: '8px', color: '#FF3333', verticalAlign: 'super', marginLeft: '-2px' }}>💾</span>
              </div>
            </>
          )}
        </div>

        <div style={{ width: '100%', height: '4px', backgroundColor: '#10151D', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            backgroundColor: isSystemFault ? '#C8502A' : '#D4A843',
            boxShadow: isSystemFault ? '0 0 10px #C8502A' : '0 0 8px #D4A843',
            transition: 'width 0.15s ease-out, background-color 0.4s ease'
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className={isSystemFault ? 'fault-flash-text' : ''} style={{ color: isSystemFault ? '#FF5555' : '#00E5FF', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            &gt; {currentTask}
          </div>
          <div style={{ color: '#445366', fontSize: '0.65rem', borderTop: '1px solid #10151D', paddingTop: '0.4rem', marginTop: '0.2rem', textAlign: 'center', fontStyle: 'italic' }}>
            &quot;Umuntu ngumuntu ngabantu&quot; — The colony never fails if every ant shows up.
          </div>
        </div>
      </div>
    </div>
  );
}
