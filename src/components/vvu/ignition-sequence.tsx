'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/* ────────────────────────────────────────────────────────────────
 *  Types
 * ──────────────────────────────────────────────────────────────── */

interface IgnitionSequenceProps {
  userName: string;
  licenseTier: 'community' | 'professional' | 'enterprise';
  onComplete: () => void;
}

type Phase = 0 | 1 | 2;

interface FibNode {
  /** Base position on unit sphere */
  bx: number;
  by: number;
  bz: number;
  /** Current screen position (updated each frame) */
  sx: number;
  sy: number;
  sz: number;
  /** Target position for convergence (VVU logo) */
  tx: number;
  ty: number;
  /** Activation state: 0=red, 1=snapping, 2=green */
  activation: number;
  /** When this node was activated (ms) */
  activatedAt: number;
  /** Pulse phase offset */
  pulse: number;
}

interface Spark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  speed: number;
}

/* ────────────────────────────────────────────────────────────────
 *  Constants
 * ──────────────────────────────────────────────────────────────── */

const NODE_COUNT = 380;
const BG = '#0a0a0f';
const GREEN = '#3dffb0';
const GOLD = '#C9A84C';
const CYAN = '#3dd6ff';
const RED = '#ff2e3f';

/** Phase timing (ms) */
const PHASE_0_END = 3000;
const PHASE_1_END = 5000;
const PHASE_2_END = 7000;

/* ────────────────────────────────────────────────────────────────
 *  Fibonacci Sphere Generator
 * ──────────────────────────────────────────────────────────────── */

function createFibNodes(): FibNode[] {
  const nodes: FibNode[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < NODE_COUNT; i++) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    nodes.push({
      bx: x,
      by: y,
      bz: z,
      sx: 0,
      sy: 0,
      sz: 0,
      tx: 0,
      ty: 0,
      activation: 0,
      activatedAt: 0,
      pulse: Math.random() * Math.PI * 2,
    });
  }
  return nodes;
}

/* ────────────────────────────────────────────────────────────────
 *  VVU Logo Target Positions
 *
 *  Distribute nodes across three letter regions: V, V, U
 *  Each letter is drawn as a set of line segments that nodes
 *  are distributed along.
 * ──────────────────────────────────────────────────────────────── */

function sampleLetterV(numPoints: number, cx: number, cy: number, s: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const half = Math.floor(numPoints / 2);
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    let x: number, y: number;
    if (i < half) {
      // Left diagonal: top-left to bottom-center
      const lt = i / (half - 1);
      x = cx - 50 * s + lt * 50 * s;
      y = cy - 50 * s + lt * 100 * s;
    } else {
      // Right diagonal: bottom-center to top-right
      const rt = (i - half) / (numPoints - half - 1);
      x = cx + rt * 50 * s;
      y = cy + 50 * s - rt * 100 * s;
    }
    // Add slight scatter for organic feel
    points.push({
      x: x + (Math.random() - 0.5) * 3 * s,
      y: y + (Math.random() - 0.5) * 3 * s,
    });
  }
  return points;
}

function sampleLetterU(numPoints: number, cx: number, cy: number, s: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    let x: number, y: number;
    if (t < 0.3) {
      // Left vertical: top to bottom
      const lt = t / 0.3;
      x = cx - 40 * s;
      y = cy - 50 * s + lt * 80 * s;
    } else if (t < 0.7) {
      // Bottom curve
      const ct = (t - 0.3) / 0.4;
      const angle = Math.PI * ct;
      x = cx - 40 * s + 40 * s * (1 - Math.cos(angle));
      y = cy + 30 * s + 20 * s * Math.sin(angle);
    } else {
      // Right vertical: bottom to top
      const rt = (t - 0.7) / 0.3;
      x = cx + 40 * s;
      y = cy + 30 * s - rt * 80 * s;
    }
    points.push({
      x: x + (Math.random() - 0.5) * 3 * s,
      y: y + (Math.random() - 0.5) * 3 * s,
    });
  }
  return points;
}

function assignLogoTargets(nodes: FibNode[], cx: number, cy: number, scale: number) {
  const third = Math.floor(NODE_COUNT / 3);
  const letterSpacing = 100 * scale;

  // V1
  const v1Points = sampleLetterV(third, cx - letterSpacing, cy, scale);
  // V2
  const v2Points = sampleLetterV(third, cx, cy, scale);
  // U
  const uPoints = sampleLetterU(NODE_COUNT - third * 2, cx + letterSpacing, cy, scale);

  for (let i = 0; i < third; i++) {
    nodes[i].tx = v1Points[i].x;
    nodes[i].ty = v1Points[i].y;
  }
  for (let i = 0; i < third; i++) {
    nodes[third + i].tx = v2Points[i].x;
    nodes[third + i].ty = v2Points[i].y;
  }
  for (let i = 0; i < NODE_COUNT - third * 2; i++) {
    nodes[third * 2 + i].tx = uPoints[i].x;
    nodes[third * 2 + i].ty = uPoints[i].y;
  }
}

/* ────────────────────────────────────────────────────────────────
 *  SHA-256 Hash Generation (Web Crypto API)
 * ──────────────────────────────────────────────────────────────── */

async function generateSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ────────────────────────────────────────────────────────────────
 *  Color interpolation helper
 * ──────────────────────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

/* ────────────────────────────────────────────────────────────────
 *  Component
 * ──────────────────────────────────────────────────────────────── */

export function IgnitionSequence({
  userName,
  licenseTier,
  onComplete,
}: IgnitionSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const nodesRef = useRef<FibNode[] | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const phaseRef = useRef<Phase>(0);
  const sessionNodeRef = useRef(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>(0);
  const [showPathB, setShowPathB] = useState(false);
  const [hashReceipt, setHashReceipt] = useState('');
  const [terminalText, setTerminalText] = useState('');
  const [airInput, setAirInput] = useState('');
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref fresh
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Generate SHA-256 hash for Path B
  useEffect(() => {
    if (licenseTier !== 'community') {
      const data = `ProofBridge::${userName}::${Date.now()}::VVU-Ignition`;
      generateSHA256(data).then((hash) => {
        setHashReceipt(hash);
      });
    }
  }, [licenseTier, userName]);

  // Terminal text typewriter effect
  useEffect(() => {
    if (currentPhase !== 1) return;
    const fullText = `> Secure Handshake Established. Welcome, ${userName}.`;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setTerminalText(fullText.slice(0, idx));
      if (idx >= fullText.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [currentPhase, userName]);

  /* ──────────────────────────────────────────────────────────────
   *  Canvas Animation Loop
   * ────────────────────────────────────────────────────────────── */

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    if (startTimeRef.current === 0) startTimeRef.current = now;
    const elapsed = now - startTimeRef.current;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw === 0 || ch === 0) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = cw / 2;
    const cy = ch / 2;
    const radius = Math.min(cw, ch) * 0.32;

    // Initialize nodes once
    if (!nodesRef.current) {
      nodesRef.current = createFibNodes();
      // Pick a random "session node"
      sessionNodeRef.current = Math.floor(Math.random() * NODE_COUNT);
    }
    const nodes = nodesRef.current;

    // Assign logo targets (recomputed each frame for responsiveness)
    assignLogoTargets(nodes, cx, cy, Math.min(cw, ch) / 600);

    // ── Phase detection ──
    let phase: Phase;
    if (elapsed < PHASE_0_END) phase = 0;
    else if (elapsed < PHASE_1_END) phase = 1;
    else phase = 2;

    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      setCurrentPhase(phase);
    }

    // ── Clear ──
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cw, ch);

    // ════════════════════════════════════════════════════════════
    //  PHASE 0: Fibonacci Node Activation (0-3s)
    // ════════════════════════════════════════════════════════════
    if (phase === 0) {
      const progress = elapsed / PHASE_0_END; // 0..1

      // Slow tumble rotation
      const angleA = elapsed * 0.0003;
      const angleB = elapsed * 0.00018;
      const cosA = Math.cos(angleA);
      const sinA = Math.sin(angleA);
      const cosB = Math.cos(angleB);
      const sinB = Math.sin(angleB);

      // Activate nodes in wave from session node
      const sessionIdx = sessionNodeRef.current;
      const activationWave = progress * 2.5; // how far the wave has spread

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Distance from session node (in index space, wrapping)
        const dist = Math.min(
          Math.abs(i - sessionIdx),
          NODE_COUNT - Math.abs(i - sessionIdx)
        );
        const normalizedDist = dist / (NODE_COUNT / 2);

        if (normalizedDist < activationWave && n.activation === 0) {
          n.activation = 1;
          n.activatedAt = now;
        }

        // Snap to green after a brief transition
        if (n.activation === 1 && now - n.activatedAt > 200) {
          n.activation = 2;
          // Create sparks from this node to adjacent nodes
          if (sparksRef.current.length < 60) {
            const adjacent = [i - 1, i + 1, i - 20, i + 20].filter(
              (j) => j >= 0 && j < NODE_COUNT
            );
            for (const adj of adjacent) {
              if (Math.random() < 0.25) {
                sparksRef.current.push({
                  x1: 0, y1: 0, x2: 0, y2: 0,
                  progress: 0,
                  speed: 0.8 + Math.random() * 1.5,
                });
              }
            }
          }
        }

        // Project onto 2D
        const x1 = n.bx * cosA - n.bz * sinA;
        const z1 = n.bx * sinA + n.bz * cosA;
        const y2 = n.by * cosB - z1 * sinB;
        const z2 = n.by * sinB + z1 * cosB;

        n.sx = cx + x1 * radius;
        n.sy = cy + y2 * radius;
        n.sz = z2;
        n.pulse += 0.016 * 3;
      }

      // Ambient glow behind sphere
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.2);
      grad.addColorStop(0, 'rgba(61, 255, 176, 0.04)');
      grad.addColorStop(1, 'rgba(10, 10, 15, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Draw connection lines between activated nodes
      const maxD = radius * 0.22;
      const maxD2 = maxD * maxD;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.activation < 2) continue;
        for (let j = i + 1; j < Math.min(i + 15, nodes.length); j++) {
          const b = nodes[j];
          if (b.activation < 2) continue;
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            const t = 1 - Math.sqrt(d2) / maxD;
            ctx.globalAlpha = t * 0.22;
            ctx.strokeStyle = GREEN;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const depth = (n.sz + 1) * 0.5;
        const alpha = 0.2 + depth * 0.8;
        const baseSize = 1.5 + depth * 1.5;
        const pulseScale = n.activation === 2 ? 1 + Math.sin(n.pulse) * 0.1 : 1;
        const size = baseSize * pulseScale;

        let color: string;
        if (i === sessionIdx && n.activation >= 1) {
          // Session node: bright green with glow
          color = GREEN;
          ctx.globalAlpha = alpha * 0.25;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, size * 4, 0, Math.PI * 2);
          ctx.fillStyle = GREEN;
          ctx.fill();
        } else if (n.activation === 0) {
          color = RED;
        } else if (n.activation === 1) {
          const t = Math.min(1, (now - n.activatedAt) / 200);
          color = lerpColor(RED, GREEN, t);
        } else {
          color = GREEN;
        }

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Green glow for activated nodes
        if (n.activation === 2) {
          ctx.globalAlpha = alpha * 0.12;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = GREEN;
          ctx.fill();
        }
      }

      // Draw sparks
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.progress += 0.016 * s.speed;
        if (s.progress >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = (1 - s.progress) * 0.6;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        const px = s.x1 + (s.x2 - s.x1) * s.progress;
        const py = s.y1 + (s.y2 - s.y1) * s.progress;
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ════════════════════════════════════════════════════════════
    //  PHASE 1: Convergence (3-5s)
    // ════════════════════════════════════════════════════════════
    if (phase === 1) {
      const progress = (elapsed - PHASE_0_END) / (PHASE_1_END - PHASE_0_END); // 0..1
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Rapid spin that accelerates
      const spinSpeed = 0.002 * (1 + progress * 4);
      const angleA = elapsed * spinSpeed;
      const angleB = elapsed * spinSpeed * 0.6;
      const cosA = Math.cos(angleA);
      const sinA = Math.sin(angleA);
      const cosB = Math.cos(angleB);
      const sinB = Math.sin(angleB);

      const third = Math.floor(NODE_COUNT / 3);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Rotated sphere position
        const x1 = n.bx * cosA - n.bz * sinA;
        const z1 = n.bx * sinA + n.bz * cosA;
        const y2 = n.by * cosB - z1 * sinB;

        const sphereX = cx + x1 * radius;
        const sphereY = cy + y2 * radius;

        // Interpolate to logo target
        n.sx = sphereX + (n.tx - sphereX) * ease;
        n.sy = sphereY + (n.ty - sphereY) * ease;
        n.sz = 0;
        n.pulse += 0.016 * 3;
      }

      // Ambient glow
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 0.8);
      grad.addColorStop(0, 'rgba(61, 255, 176, 0.05)');
      grad.addColorStop(1, 'rgba(10, 10, 15, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw nodes with VVU colors emerging
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const alpha = 0.5 + ease * 0.5;
        const size = 1.5 + ease * 1.2;

        let finalColor: string;
        if (i < third) finalColor = GREEN;
        else if (i < third * 2) finalColor = GOLD;
        else finalColor = CYAN;

        // Blend from green to final color based on convergence progress
        const color = lerpColor(GREEN, finalColor, ease);

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow
        ctx.globalAlpha = alpha * 0.12;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ════════════════════════════════════════════════════════════
    //  PHASE 2: Divergence (5-7s)
    // ════════════════════════════════════════════════════════════
    if (phase === 2) {
      const progress = Math.min(1, (elapsed - PHASE_1_END) / (PHASE_2_END - PHASE_1_END));
      const fadeOut = Math.max(0, 1 - progress * 2);

      // Draw VVU logo fading out
      const third = Math.floor(NODE_COUNT / 3);
      const colors = [GREEN, GOLD, CYAN];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const colorIdx = i < third ? 0 : i < third * 2 ? 1 : 2;
        const color = colors[colorIdx];
        const alpha = fadeOut * 0.8;
        const size = 1.5;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(n.tx, n.ty, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Start animation
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Handle Path B demo display
  useEffect(() => {
    if (currentPhase === 2 && licenseTier !== 'community') {
      const timer = setTimeout(() => setShowPathB(true), 800);
      return () => clearTimeout(timer);
    }
    if (currentPhase === 2 && licenseTier === 'community') {
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, licenseTier]);

  /* ──────────────────────────────────────────────────────────────
   *  Path B: Ludicrous Demonstration
   * ────────────────────────────────────────────────────────────── */

  const isPathB = licenseTier !== 'community' && showPathB;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: BG, fontFamily: 'monospace' }}
    >
      {/* Full-viewport canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: isPathB ? 0 : 1, transition: 'opacity 150ms ease-out' }}
      />

      {/* Terminal text overlay (Phase 1) */}
      {currentPhase >= 1 && !isPathB && (
        <div
          className="absolute inset-x-0 bottom-[25%] flex justify-center"
          style={{
            opacity: currentPhase === 1 ? 1 : currentPhase === 2 ? 0 : 0,
            transition: 'opacity 100ms linear',
          }}
        >
          <div className="text-center">
            <p
              className="text-sm tracking-widest"
              style={{ color: GREEN }}
            >
              {terminalText}
              <span
                className="inline-block ml-0.5 w-2 h-4 align-middle"
                style={{
                  background: GREEN,
                  animation: 'ignition-blink 0.6s step-end infinite',
                }}
              />
            </p>
          </div>
        </div>
      )}

      {/* Path B: Ludicrous Demonstration */}
      {isPathB && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8"
          style={{
            animation: 'ignition-expand 150ms ease-out',
          }}
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <h2
              className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: GREEN }}
            >
              ProofBridge Identity Verified
            </h2>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#7b7d8c' }}>
              License Tier: {licenseTier.toUpperCase()}
            </p>
          </div>

          {/* Three Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
            {/* Panel 1: ProofBridge Receipt */}
            <div
              className="rounded-lg border p-4 sm:p-6"
              style={{
                borderColor: 'rgba(61, 255, 176, 0.15)',
                background: 'rgba(10, 10, 20, 0.9)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: GREEN, boxShadow: `0 0 8px ${GREEN}66` }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>
                  ProofBridge Receipt
                </span>
              </div>

              <div className="space-y-3 text-[11px]">
                <div>
                  <span style={{ color: '#7b7d8c' }}>Session:</span>
                  <span className="ml-2" style={{ color: '#d4d4d8' }}>
                    {new Date().toISOString().slice(0, 19)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#7b7d8c' }}>Identity:</span>
                  <span className="ml-2" style={{ color: GREEN }}>{userName}</span>
                </div>
                <div>
                  <span style={{ color: '#7b7d8c' }}>License:</span>
                  <span className="ml-2" style={{ color: GOLD }}>{licenseTier.toUpperCase()}</span>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: 'rgba(61, 255, 176, 0.1)' }}>
                  <span style={{ color: '#7b7d8c' }}>SHA-256:</span>
                  <div
                    className="mt-1 break-all leading-relaxed"
                    style={{ color: CYAN, fontSize: '9px' }}
                  >
                    {hashReceipt || 'computing...'}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: GREEN, animation: 'ignition-blink 1s step-end infinite' }}
                  />
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: GREEN }}>
                    Anchored to Immutable Ledger
                  </span>
                </div>
              </div>
            </div>

            {/* Panel 2: Simulation Target */}
            <div
              className="rounded-lg border p-4 sm:p-6 flex flex-col items-center justify-center"
              style={{
                borderColor: 'rgba(201, 168, 76, 0.15)',
                background: 'rgba(10, 10, 20, 0.9)',
              }}
            >
              <div className="flex items-center gap-2 mb-4 self-start">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: GOLD, boxShadow: `0 0 8px ${GOLD}66` }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                  Simulation Target
                </span>
              </div>

              {/* Wireframe HBK Mk-II */}
              <div className="relative w-full aspect-square max-w-[200px] mb-4">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  style={{ filter: `drop-shadow(0 0 6px ${GOLD}33)` }}
                >
                  {/* Outer hexagonal wireframe */}
                  <polygon
                    points="100,20 160,60 160,140 100,180 40,140 40,60"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                  <polygon
                    points="100,40 140,65 140,135 100,160 60,135 60,65"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="0.3"
                    opacity="0.4"
                  />
                  {/* Inner structure lines */}
                  <line x1="100" y1="20" x2="100" y2="180" stroke={GOLD} strokeWidth="0.3" opacity="0.3" />
                  <line x1="40" y1="60" x2="160" y2="140" stroke={GOLD} strokeWidth="0.3" opacity="0.3" />
                  <line x1="160" y1="60" x2="40" y2="140" stroke={GOLD} strokeWidth="0.3" opacity="0.3" />
                  {/* Cross beams */}
                  <line x1="40" y1="60" x2="160" y2="60" stroke={GOLD} strokeWidth="0.2" opacity="0.2" />
                  <line x1="40" y1="140" x2="160" y2="140" stroke={GOLD} strokeWidth="0.2" opacity="0.2" />
                  {/* Pulse ring */}
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="0.3"
                    opacity="0.2"
                    strokeDasharray="4 4"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 100 100"
                      to="360 100 100"
                      dur="20s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>

              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{
                  borderColor: 'rgba(201, 168, 76, 0.3)',
                  background: 'rgba(201, 168, 76, 0.08)',
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: GOLD, animation: 'ignition-blink 1.5s step-end infinite' }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                  Awaiting Resources
                </span>
              </div>

              <p className="mt-3 text-[10px] text-center" style={{ color: '#7b7d8c' }}>
                72-Hour Cape Town HBK Mk-II Simulation
              </p>
            </div>

            {/* Panel 3: AIR Intake */}
            <div
              className="rounded-lg border p-4 sm:p-6"
              style={{
                borderColor: 'rgba(61, 214, 255, 0.15)',
                background: 'rgba(10, 10, 20, 0.9)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: CYAN, boxShadow: `0 0 8px ${CYAN}66` }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CYAN }}>
                  AIR Intake
                </span>
              </div>

              <div className="space-y-3 text-[11px]">
                <p style={{ color: '#d4d4d8' }}>
                  Identity verified. VVU is currently targeting a 72-hour HBK simulation.
                </p>
                <p style={{ color: CYAN }}>
                  How do you align with this target?
                </p>

                {/* Terminal-style input */}
                <div
                  className="mt-4 rounded border p-3"
                  style={{ borderColor: 'rgba(61, 214, 255, 0.2)', background: 'rgba(0, 0, 0, 0.4)' }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: CYAN }}>&gt;</span>
                    <input
                      type="text"
                      value={airInput}
                      onChange={(e) => setAirInput(e.target.value)}
                      placeholder="Describe your alignment..."
                      className="flex-1 bg-transparent border-none outline-none text-[11px]"
                      style={{ color: '#d4d4d8', caretColor: CYAN }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: CYAN, animation: 'ignition-blink 1s step-end infinite' }}
                  />
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7b7d8c' }}>
                    Agentic Terminal Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => onCompleteRef.current()}
            className="mt-8 rounded-lg border px-8 py-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-150 hover:scale-105"
            style={{
              borderColor: `${GREEN}33`,
              color: GREEN,
              background: `${GREEN}0a`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${GREEN}1a`;
              e.currentTarget.style.borderColor = `${GREEN}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${GREEN}0a`;
              e.currentTarget.style.borderColor = `${GREEN}33`;
            }}
          >
            Continue to Workspace →
          </button>
        </div>
      )}

      {/* Global keyframes */}
      <style>{`
        @keyframes ignition-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes ignition-expand {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default IgnitionSequence;
