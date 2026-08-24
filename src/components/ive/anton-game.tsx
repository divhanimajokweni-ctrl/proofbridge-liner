"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Particle = {
  x: number; y: number; vx: number; vy: number;
  radius: number; color: string; alpha: number; decay: number;
};
type Bullet = { x: number; y: number; vx: number; vy: number; radius: number; color: string };
type Enemy = {
  x: number; y: number; vx: number; vy: number;
  color: string; radius: number; speed: number; hp: number;
  behavior?: string; seed: number; empStun: number;
};
type Zone =
  | { type: "emp"; x: number; y: number; radius: number; maxRadius: number; speed: number }
  | { type: "fusion_core"; x: number; y: number; radius: number; life: number; pulse: number };

const PHRASES = [
  "WUBBA LUBBA DUB DUB!",
  "GET SCHWIFTY!",
  "YOUR BIO-SIGNATURE IS MICROSCOPIC!",
  "DISQUALIFIED!",
  "I'M MR. MEESEEKS, LOOK AT ME!",
  "BOO, NOT COOL!",
  "SCIENCE, BITCHES!",
  "CRITICAL TIME PARADOX DETECTED!",
  "MAGNETS! HOW DO THEY WORK?!",
];

const ENEMY_TYPES: { color: string; radius: number; speed: number; hp: number; behavior?: string }[] = [
  { color: "#ff0055", radius: 18, speed: 1.2, hp: 3 },
  { color: "#ffaa00", radius: 12, speed: 2.4, hp: 1, behavior: "sine" },
  { color: "#bd00ff", radius: 15, speed: 1.8, hp: 2 },
];

/**
 * AntonGame — survival shooter variant.
 * Pilot "Anton the Ant" orbits a black-hole singularity, fires plasma at
 * incoming enemies, and uses three abilities (Time Dilate, Mag Pulse, Grav
 * Fusion Bomb) to survive escalating waves.
 */
export default function AntonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const slowmoCdRef = useRef<HTMLSpanElement>(null);
  const empCdRef = useRef<HTMLSpanElement>(null);
  const bombCdRef = useRef<HTMLSpanElement>(null);
  const apiRef = useRef<{
    slowmo: () => void; emp: () => void; bomb: () => void; reset: () => void;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let messageTimer: ReturnType<typeof setTimeout> | undefined;

    const blackHole = { x: 0, y: 0, radius: 65, gravityConstant: 0.15 };
    const state = {
      player: {
        x: 0, y: 0, vx: 0, vy: 0, speed: 4.5, radius: 16, angle: 0,
        health: 100, maxHealth: 100, history: [] as { x: number; y: number }[],
      },
      keys: {} as Record<string, boolean>,
      bullets: [] as Bullet[],
      enemies: [] as Enemy[],
      particles: [] as Particle[],
      zones: [] as Zone[],
      score: 0,
      wave: 1,
      isGameOver: false,
      timeScale: 1,
      nextWaveTimer: 120,
      pointer: { x: 0, y: 0 },
      firing: false,
      fireCooldown: 0,
      cooldowns: {
        slowmo: { current: 0, max: 400, duration: 150, active: false },
        emp: { current: 0, max: 300 },
        bomb: { current: 0, max: 500 },
      },
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      blackHole.x = canvas.width / 2;
      blackHole.y = canvas.height / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const quote = (text?: string) => {
      const el = messageRef.current;
      if (!el) return;
      el.innerText = text ?? PHRASES[Math.floor(Math.random() * PHRASES.length)]!;
      el.dataset['visible'] = "true";
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => {
        el.dataset['visible'] = "false";
      }, 1800);
    };

    const updateHealthBar = () => {
      const pct = Math.max(0, (state.player.health / state.player.maxHealth) * 100);
      if (healthRef.current) healthRef.current.style.width = `${pct}%`;
    };

    const spawnWave = () => {
      const count = 4 + state.wave * 3;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(canvas.width, canvas.height) * 0.6 + Math.random() * 200;
        const t = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]!;
        state.enemies.push({
          x: blackHole.x + Math.cos(angle) * dist,
          y: blackHole.y + Math.sin(angle) * dist,
          vx: 0, vy: 0, ...t, seed: Math.random() * 100, empStun: 0,
        });
      }
    };

    const init = () => {
      state.player.x = blackHole.x + 220;
      state.player.y = blackHole.y;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.health = 100;
      state.player.history = [];
      state.bullets = [];
      state.enemies = [];
      state.particles = [];
      state.zones = [];
      state.score = 0;
      state.wave = 1;
      state.isGameOver = false;
      state.timeScale = 1;
      state.nextWaveTimer = 120;
      state.pointer = { x: blackHole.x + 400, y: blackHole.y };
      state.cooldowns.slowmo = { current: 0, max: 400, duration: 150, active: false };
      state.cooldowns.emp.current = 0;
      state.cooldowns.bomb.current = 0;
      setScore(0);
      setWave(1);
      setGameOver(false);
      updateHealthBar();
      spawnWave();
      quote("INITIATING TIMELINE CORE");
    };

    const firePlasma = () => {
      const p = state.player;
      const a = Math.atan2(state.pointer.y - p.y, state.pointer.x - p.x);
      state.bullets.push({
        x: p.x + Math.cos(a) * p.radius,
        y: p.y + Math.sin(a) * p.radius,
        vx: Math.cos(a) * 9,
        vy: Math.sin(a) * 9,
        radius: 4,
        color: "#39ff14",
      });
      for (let i = 0; i < 4; i++) {
        state.particles.push({
          x: p.x + Math.cos(a) * p.radius,
          y: p.y + Math.sin(a) * p.radius,
          vx: (Math.cos(a) + (Math.random() - 0.5) * 0.4) * 3,
          vy: (Math.sin(a) + (Math.random() - 0.5) * 0.4) * 3,
          radius: Math.random() * 3 + 1,
          color: "#00e5ff",
          alpha: 1,
          decay: 0.04,
        });
      }
    };

    const triggerSlowMo = () => {
      const cd = state.cooldowns.slowmo;
      if (state.isGameOver || cd.current > 0 || cd.active) return;
      cd.active = true;
      state.timeScale = 0.25;
      quote("TIME DILATION INJECTED");
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 300 + 100;
        state.particles.push({
          x: blackHole.x + Math.cos(a) * d,
          y: blackHole.y + Math.sin(a) * d,
          vx: -Math.cos(a) * 2, vy: -Math.sin(a) * 2,
          radius: 2, color: "#bd00ff", alpha: 0.8, decay: 0.01,
        });
      }
    };

    const triggerEMP = () => {
      if (state.isGameOver || state.cooldowns.emp.current > 0) return;
      state.cooldowns.emp.current = state.cooldowns.emp.max;
      quote("MAGNETIC PULSE STRIKE");
      state.zones.push({
        type: "emp", x: state.player.x, y: state.player.y,
        radius: 10, maxRadius: 280, speed: 8,
      });
    };

    const triggerBomb = () => {
      if (state.isGameOver || state.cooldowns.bomb.current > 0) return;
      state.cooldowns.bomb.current = state.cooldowns.bomb.max;
      quote("GRAVITY FUSION BOMB");
      state.zones.push({
        type: "fusion_core", x: state.pointer.x, y: state.pointer.y,
        radius: 5, life: 180, pulse: 0,
      });
    };

    const endGame = () => {
      state.isGameOver = true;
      state.timeScale = 1;
      setFinalScore(state.score);
      setGameOver(true);
    };

    apiRef.current = {
      slowmo: triggerSlowMo,
      emp: triggerEMP,
      bomb: triggerBomb,
      reset: init,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      state.keys[k] = true;
      if (k === "q") triggerSlowMo();
      if (k === "e") triggerEMP();
      if (k === "r") triggerBomb();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      state.keys[e.key.toLowerCase()] = false;
    };
    const setPointer = (cx: number, cy: number) => {
      const rect = canvas.getBoundingClientRect();
      state.pointer.x = cx - rect.left;
      state.pointer.y = cy - rect.top;
    };
    const onMove = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      setPointer(e.clientX, e.clientY);
      state.firing = true;
    };
    const onUp = () => {
      state.firing = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    const update = () => {
      if (state.isGameOver) return;
      const p = state.player;
      const cds = state.cooldowns;

      if (cds.slowmo.active) {
        cds.slowmo.duration--;
        if (cds.slowmo.duration <= 0) {
          cds.slowmo.active = false;
          state.timeScale = 1;
          cds.slowmo.current = cds.slowmo.max;
          cds.slowmo.duration = 150;
        }
      } else if (cds.slowmo.current > 0) cds.slowmo.current--;
      if (cds.emp.current > 0) cds.emp.current--;
      if (cds.bomb.current > 0) cds.bomb.current--;

      const setCd = (ref: React.RefObject<HTMLSpanElement | null>, pct: number) => {
        if (ref.current) ref.current.style.height = `${pct}%`;
      };
      setCd(slowmoCdRef, (cds.slowmo.current / cds.slowmo.max) * 100);
      setCd(empCdRef, (cds.emp.current / cds.emp.max) * 100);
      setCd(bombCdRef, (cds.bomb.current / cds.bomb.max) * 100);

      if (state.fireCooldown > 0) state.fireCooldown--;
      if (state.firing && state.fireCooldown <= 0) {
        firePlasma();
        state.fireCooldown = 8;
      }

      let mx = 0, my = 0;
      if (state.keys["w"] || state.keys["arrowup"]) my -= 1;
      if (state.keys["s"] || state.keys["arrowdown"]) my += 1;
      if (state.keys["a"] || state.keys["arrowleft"]) mx -= 1;
      if (state.keys["d"] || state.keys["arrowright"]) mx += 1;
      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my);
        p.vx += (mx / len) * p.speed * 0.15;
        p.vy += (my / len) * p.speed * 0.15;
      }
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.x += p.vx;
      p.y += p.vy;
      p.x = Math.max(8, Math.min(canvas.width - 8, p.x));
      p.y = Math.max(8, Math.min(canvas.height - 8, p.y));
      p.angle = Math.atan2(state.pointer.y - p.y, state.pointer.x - p.x);
      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 25) p.history.shift();

      const pdx = blackHole.x - p.x;
      const pdy = blackHole.y - p.y;
      const pdist = Math.max(1, Math.hypot(pdx, pdy));
      if (pdist > blackHole.radius) {
        const force = Math.min(3.5, (blackHole.gravityConstant * 900) / (pdist * pdist * 0.02));
        p.x += (pdx / pdist) * force;
        p.y += (pdy / pdist) * force;
      } else {
        p.health = 0;
        updateHealthBar();
        endGame();
        return;
      }

      for (let i = state.zones.length - 1; i >= 0; i--) {
        const zone = state.zones[i]!;
        if (zone.type === "emp") {
          zone.radius += zone.speed;
          if (zone.radius > zone.maxRadius) {
            state.zones.splice(i, 1);
            continue;
          }
          for (const e of state.enemies) {
            const d = Math.hypot(e.x - zone.x, e.y - zone.y);
            if (d < zone.radius && d > zone.radius - 30) e.empStun = 90;
          }
        } else {
          zone.life--;
          zone.pulse += 0.2;
          for (const e of state.enemies) {
            const fdx = zone.x - e.x;
            const fdy = zone.y - e.y;
            const fd = Math.max(1, Math.hypot(fdx, fdy));
            if (fd < 350) {
              const pull = (350 - fd) * 0.02 * state.timeScale;
              e.x += (fdx / fd) * pull;
              e.y += (fdy / fd) * pull;
            }
          }
          if (zone.life <= 0) {
            for (let k = 0; k < 45; k++) {
              const a = Math.random() * Math.PI * 2;
              const spd = Math.random() * 7 + 3;
              state.particles.push({
                x: zone.x, y: zone.y,
                vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                radius: Math.random() * 5 + 2, color: "#bd00ff", alpha: 1, decay: 0.02,
              });
            }
            for (let ei = state.enemies.length - 1; ei >= 0; ei--) {
              const e = state.enemies[ei]!;
              if (Math.hypot(zone.x - e.x, zone.y - e.y) < 120) {
                e.hp -= 5;
                if (e.hp <= 0) {
                  state.enemies.splice(ei, 1);
                  state.score += 150;
                  setScore(state.score);
                }
              }
            }
            state.zones.splice(i, 1);
          }
        }
      }

      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i]!;
        b.x += b.vx * state.timeScale;
        b.y += b.vy * state.timeScale;
        const bdx = blackHole.x - b.x;
        const bdy = blackHole.y - b.y;
        const bdist = Math.max(1, Math.hypot(bdx, bdy));
        if (bdist < blackHole.radius * 4) {
          const lens = Math.min(1.2, (blackHole.gravityConstant * 400) / (bdist * bdist * 0.03));
          b.vx += (bdx / bdist) * lens * state.timeScale;
          b.vy += (bdy / bdist) * lens * state.timeScale;
        }
        if (bdist < blackHole.radius || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          state.bullets.splice(i, 1);
          continue;
        }
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j]!;
          if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
            e.hp--;
            state.bullets.splice(i, 1);
            for (let k = 0; k < 6; k++) {
              state.particles.push({
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                radius: Math.random() * 3 + 1, color: e.color, alpha: 1, decay: 0.05,
              });
            }
            if (e.hp <= 0) {
              state.enemies.splice(j, 1);
              state.score += 100;
              setScore(state.score);
              if (Math.random() < 0.22) quote();
            }
            break;
          }
        }
      }

      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i]!;
        if (e.empStun > 0) {
          e.empStun--;
        } else {
          const edx = p.x - e.x;
          const edy = p.y - e.y;
          const ed = Math.max(1, Math.hypot(edx, edy));
          let tvx = (edx / ed) * e.speed;
          let tvy = (edy / ed) * e.speed;
          if (e.behavior === "sine") {
            const wave2 = Math.sin(Date.now() * 0.005 + e.seed) * 1.5;
            const perpX = -tvy;
            const perpY = tvx;
            tvx += perpX * wave2;
            tvy += perpY * wave2;
          }
          e.vx += (tvx - e.vx) * 0.05;
          e.vy += (tvy - e.vy) * 0.05;
          e.x += e.vx * state.timeScale;
          e.y += e.vy * state.timeScale;
        }

        const ebdx = blackHole.x - e.x;
        const ebdy = blackHole.y - e.y;
        const ebd = Math.max(1, Math.hypot(ebdx, ebdy));
        if (ebd < blackHole.radius) {
          state.enemies.splice(i, 1);
          continue;
        } else if (ebd < blackHole.radius * 3) {
          const g = Math.min(3, (blackHole.gravityConstant * 300) / (ebd * ebd * 0.02));
          e.x += (ebdx / ebd) * g * state.timeScale;
          e.y += (ebdy / ebd) * g * state.timeScale;
        }

        const pex = p.x - e.x;
        const pey = p.y - e.y;
        const ped = Math.max(1, Math.hypot(pex, pey));
        if (ped < p.radius + e.radius) {
          p.health -= 0.75;
          updateHealthBar();
          p.vx += (pex / ped) * 1.5;
          p.vy += (pey / ped) * 1.5;
          if (p.health <= 0) {
            endGame();
            return;
          }
        }
      }

      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i]!;
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (Math.hypot(blackHole.x - pt.x, blackHole.y - pt.y) < blackHole.radius || pt.alpha <= 0) {
          state.particles.splice(i, 1);
        }
      }

      if (state.enemies.length === 0) {
        state.nextWaveTimer--;
        if (state.nextWaveTimer <= 0) {
          state.wave++;
          setWave(state.wave);
          spawnWave();
          state.nextWaveTimer = 120;
          quote(`SECTOR ${state.wave} INBOUND`);
        }
      }
    };

    const draw = () => {
      const p = state.player;
      ctx.fillStyle = "rgba(5, 3, 10, 0.28)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.0015;
      ctx.save();
      ctx.translate(blackHole.x, blackHole.y);
      ctx.rotate(-time * 0.2);
      for (let i = 0; i < 4; i++) {
        const grad = ctx.createRadialGradient(0, 0, blackHole.radius, 0, 0, blackHole.radius * 4.5);
        grad.addColorStop(0, "rgba(189, 0, 255, 0.05)");
        grad.addColorStop(0.3, "rgba(0, 229, 255, 0.03)");
        grad.addColorStop(0.6, "rgba(57, 255, 20, 0.02)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, blackHole.radius * (4 + i * 0.5), blackHole.radius * (2 + i * 0.2), (i * Math.PI) / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      for (const zone of state.zones) {
        if (zone.type === "emp") {
          ctx.strokeStyle = "#00e5ff";
          ctx.lineWidth = 4;
          ctx.shadowColor = "#00e5ff";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          const pulseRad = zone.radius + Math.sin(zone.pulse) * 8;
          const g = ctx.createRadialGradient(zone.x, zone.y, 2, zone.x, zone.y, pulseRad * 3);
          g.addColorStop(0, "#ffffff");
          g.addColorStop(0.2, "#bd00ff");
          g.addColorStop(0.5, "rgba(0, 229, 255, 0.4)");
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, pulseRad * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const pt of state.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const coreGrad = ctx.createRadialGradient(
        blackHole.x, blackHole.y, blackHole.radius - 12,
        blackHole.x, blackHole.y, blackHole.radius + 20,
      );
      coreGrad.addColorStop(0, "#000000");
      coreGrad.addColorStop(0.65, "#000000");
      coreGrad.addColorStop(0.78, "#39ff14");
      coreGrad.addColorStop(0.88, "#bd00ff");
      coreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(blackHole.x, blackHole.y, blackHole.radius + 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#05020a";
      ctx.beginPath();
      ctx.arc(blackHole.x, blackHole.y, blackHole.radius - 2, 0, Math.PI * 2);
      ctx.fill();

      if (state.cooldowns.slowmo.active && p.history.length > 1) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p.history[0]!.x, p.history[0]!.y);
        for (let i = 1; i < p.history.length; i++) ctx.lineTo(p.history[i]!.x, p.history[i]!.y);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      const pd = Math.hypot(blackHole.x - p.x, blackHole.y - p.y);
      if (pd < blackHole.radius * 3) {
        const stretch = 1 + (1 - pd / (blackHole.radius * 3));
        ctx.scale(stretch, 1 / stretch);
      }
      ctx.fillStyle = "#1c133a";
      ctx.beginPath(); ctx.arc(-14, 0, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-3, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(7, 0, 7, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.strokeStyle = "#00e5ff";
      ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(15, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, 3); ctx.lineTo(15, 8); ctx.stroke();
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(2, 4, 8, 4);
      ctx.restore();

      for (const e of state.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(Math.atan2(p.y - e.y, p.x - e.x));
        if (e.empStun > 0) {
          ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
          ctx.shadowColor = "#00e5ff";
          ctx.shadowBlur = 10;
        }
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(e.radius * 0.6, -e.radius * 0.4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.radius * 0.6, e.radius * 0.4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        for (let l = -1; l <= 1; l += 2) {
          ctx.beginPath();
          ctx.moveTo(0, l * e.radius * 0.5);
          ctx.lineTo(-e.radius * 0.5, l * e.radius * 1.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(e.radius * 0.3, l * e.radius * 0.5);
          ctx.lineTo(e.radius * 0.6, l * e.radius * 1.3);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const b of state.bullets) {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const loop = () => {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    };

    init();
    loop();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(messageTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      apiRef.current = null;
    };
  }, []);

  const abilities = [
    { id: "slowmo", key: "Q", icon: "⏳", name: "Time Dilate", run: () => apiRef.current?.slowmo(), cdRef: slowmoCdRef },
    { id: "emp", key: "E", icon: "🧲", name: "Mag Pulse", run: () => apiRef.current?.emp(), cdRef: empCdRef },
    { id: "bomb", key: "R", icon: "💥", name: "Grav Fusion", run: () => apiRef.current?.bomb(), cdRef: bombCdRef },
  ];

  const restart = useCallback(() => apiRef.current?.reset(), []);

  return (
    <div className="game-root">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="hud">
        <div className="hud-panel hud-left">
          <div className="stat-line">
            Pilot: <span>Anton the Ant</span>
          </div>
          <div>
            <div className="stat-line" style={{ fontSize: 12 }}>
              Shield Sync // Inf
            </div>
            <div className="health-bar-container">
              <div className="health-bar" ref={healthRef} />
            </div>
          </div>
        </div>
        <div className="hud-panel hud-right">
          <div className="wave-text">Wave {wave}</div>
          <div className="score-text">Score: {String(score).padStart(5, "0")}</div>
        </div>
      </div>

      <div className="abilities-panel">
        {abilities.map((a) => (
          <div className="ability-slot" key={a.id}>
            <div className="ability-key">Key [{a.key}]</div>
            <button
              type="button"
              className="ability-btn"
              aria-label={a.name}
              onClick={a.run}
            >
              <span aria-hidden>{a.icon}</span>
              <span className="cd-overlay" ref={a.cdRef} />
            </button>
            <div className="ability-name">{a.name}</div>
          </div>
        ))}
      </div>

      <div className="center-message" ref={messageRef} data-visible="false" />

      {gameOver && (
        <div className="game-over">
          <h1>Paradox Timeline Deleted</h1>
          <p style={{ fontSize: 20, color: "var(--neon-cyan)" }}>
            Final Score: {String(finalScore).padStart(5, "0")}
          </p>
          <button type="button" className="restart-btn" onClick={restart}>
            Respawn Timeline
          </button>
        </div>
      )}
    </div>
  );
}
