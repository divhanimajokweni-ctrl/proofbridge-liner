'use client';

/**
 * Advanced PiP Wrapper with Network Heartbeat & Auto-Close
 *
 * Uses the Document Picture-in-Picture API to pop out a floating overlay.
 * Monitors connection health via /api/health-check heartbeat.
 * Auto-closes after 10s countdown when network connectivity is lost.
 * Injects parent stylesheets into the PiP window context.
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface FloatingOverlayWrapperProps {
  children: React.ReactNode;
  windowWidth?: number;
  windowHeight?: number;
}

export default function FloatingOverlayWrapper({
  children,
  windowWidth = 460,
  windowHeight = 440,
}: FloatingOverlayWrapperProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [networkHealthy, setNetworkHealthy] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const healthyRef = useRef(true);
  const pipRef = useRef<Window | null>(null);

  // Sync refs with state for interval callbacks
  useEffect(() => {
    healthyRef.current = networkHealthy;
  }, [networkHealthy]);

  useEffect(() => {
    pipRef.current = pipWindow;
  }, [pipWindow]);

  // Heartbeat + auto-close logic
  useEffect(() => {
    let healthInterval: ReturnType<typeof setInterval> | null = null;
    let countdownInterval: ReturnType<typeof setInterval> | null = null;
    let isPipOpen = !!pipWindow;

    if (pipWindow) {
      healthInterval = setInterval(async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch('/api/health-check', {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('unhealthy');
          setNetworkHealthy(true);
          setCountdown(10);
        } catch {
          setNetworkHealthy(false);
        }
      }, 3000);
    } else {
      setNetworkHealthy(true);
      setCountdown(10);
    }

    return () => {
      if (healthInterval) clearInterval(healthInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [pipWindow]);

  // Countdown timer when network is down
  useEffect(() => {
    if (networkHealthy || !pipWindow) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (pipRef.current) {
            pipRef.current.close();
            setPipWindow(null);
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [networkHealthy, pipWindow]);

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    try {
      // @ts-ignore — Document Picture-in-Picture API
      const pip = await window.documentPictureInPicture.requestWindow({
        width: windowWidth,
        height: windowHeight,
      });

      // Inject parent stylesheets into the PiP window
      const injectStyles = () => {
        const parentSheets = document.styleSheets;
        for (let i = 0; i < parentSheets.length; i++) {
          try {
            const sheet = parentSheets[i];
            const rules = sheet.cssRules;
            if (rules && rules.length > 0) {
              const style = document.createElement('style');
              style.textContent = Array.from(rules)
                .map((r) => r.cssText)
                .join('\n');
              pip.document.head.appendChild(style);
            }
          } catch {
            // Cross-origin stylesheet — load via link tag
            if (parentSheets[i].href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = parentSheets[i].href!;
              pip.document.head.appendChild(link);
            }
          }
        }
      };

      injectStyles();
      pip.document.body.className =
        'bg-slate-950 p-3 font-mono text-slate-100 overflow-x-hidden';
      pip.document.title = 'ProofBridge Liner — Compliance Monitor';

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (error) {
      console.error('PiP window error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={togglePiP}
        className={`w-full px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
          pipWindow
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            : 'bg-teal-500 text-slate-950 border-transparent hover:bg-teal-400'
        }`}
      >
        {pipWindow
          ? '⏹ CLOSE FLOATING MONITOR'
          : '📺 POP OUT COMPLIANCE MONITOR'}
      </button>

      {/* Network-loss warning banner inside PiP */}
      {!networkHealthy && pipWindow &&
        createPortal(
          <div className="fixed top-0 left-0 right-0 bg-rose-600 text-white font-bold text-xs p-2 text-center animate-pulse z-50">
            NETWORK DISCONNECTED — AUTO-CLOSING IN {countdown}s
          </div>,
          pipWindow.document.body,
        )}

      {/* Render children — inside PiP when open, inline when closed */}
      <div>
        {pipWindow
          ? createPortal(
              <div className="pip-window-root pt-8">
                {children}
              </div>,
              pipWindow.document.body,
            )
          : children}
      </div>
    </div>
  );
}
