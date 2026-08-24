"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight particle field rendered on a canvas.
 * Renders amber + emerald + rose particles drifting upward against a dark obsidian base.
 * Optimized for low GPU footprint (<=120 particles).
 */
export function ParticleField({ density = 80 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = canvas.offsetWidth * devicePixelRatio);
    let h = (canvas.height = canvas.offsetHeight * devicePixelRatio);

    const colors = [
      { r: 230, g: 178, b: 92 },   // gold
      { r: 110, g: 214, b: 162 },  // emerald
      { r: 220, g: 110, b: 110 },  // rose
    ];

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      c: { r: number; g: number; b: number };
      a: number;
    };

    const parts: P[] = Array.from({ length: density }, () => {
      const c = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
        vy: (-Math.random() * 0.6 - 0.15) * devicePixelRatio,
        r: (Math.random() * 1.8 + 0.4) * devicePixelRatio,
        c,
        a: Math.random() * 0.6 + 0.2,
      };
    });

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    window.addEventListener("resize", resize);

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c.r}, ${p.c.g}, ${p.c.b}, ${p.a})`;
        ctx.shadowColor = `rgba(${p.c.r}, ${p.c.g}, ${p.c.b}, 0.6)`;
        ctx.shadowBlur = 6 * devicePixelRatio;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      aria-hidden
    />
  );
}
