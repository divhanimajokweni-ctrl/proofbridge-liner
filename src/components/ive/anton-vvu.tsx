"use client";

import { useEffect, useRef, useState } from "react";

type Vec = { x: number; y: number };

type TileJson = {
  id: string;
  label: string;
  type: "trigger" | "action";
  transform: { position: Vec };
  trigger: { type: string; bounds?: { radius: number }; filter?: { faction: string } };
  action: {
    type: string;
    target_id?: string | null;
    payload?: { hazard_type: string };
  };
  execution: { cooldown_ms: number; max_triggers: number };
};

type TileState = { lastTriggered: number; triggerCount: number; activeIntensity: number };

type Entity = {
  id: string;
  faction: string;
  type: string;
  x: number;
  y: number;
  health: number;
  maxHp: number;
  speed: number;
  radius: number;
  color: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
};

type Projectile = { x: number; y: number; vx: number; vy: number; radius: number; life: number };

type EditorNode = { x: number; y: number; width: number; height: number; tileJson: TileJson };

type Wire = { fromTileId: string; toTileId: string };

const WAVE_CONFIGS = [
  {
    enemies: [{ type: "worker", count: 5, hp: 20, speed: 65, radius: 8, color: "#ff2a00" }],
    delay: 5,
    bonusMatter: 25,
  },
  {
    enemies: [
      { type: "worker", count: 4, hp: 22, speed: 68, radius: 8, color: "#ff2a00" },
      { type: "soldier", count: 2, hp: 55, speed: 42, radius: 12, color: "#a3003b" },
    ],
    delay: 6,
    bonusMatter: 35,
  },
  {
    enemies: [
      { type: "worker", count: 3, hp: 22, speed: 68, radius: 8, color: "#ff2a00" },
      { type: "fireant", count: 5, hp: 14, speed: 115, radius: 6, color: "#ffaa00" },
    ],
    delay: 5,
    bonusMatter: 40,
  },
  {
    enemies: [
      { type: "soldier", count: 4, hp: 60, speed: 45, radius: 12, color: "#a3003b" },
      { type: "fireant", count: 3, hp: 14, speed: 115, radius: 6, color: "#ffaa00" },
    ],
    delay: 7,
    bonusMatter: 50,
  },
  {
    enemies: [
      { type: "soldier", count: 3, hp: 60, speed: 45, radius: 12, color: "#a3003b" },
      { type: "acidspitter", count: 2, hp: 35, speed: 55, radius: 10, color: "#00ff66" },
    ],
    delay: 6,
    bonusMatter: 60,
  },
];

function getWaveConfig(waveNumber: number) {
  if (waveNumber <= WAVE_CONFIGS.length) return WAVE_CONFIGS[waveNumber - 1]!;
  const last = WAVE_CONFIGS[WAVE_CONFIGS.length - 1]!;
  const scale = 1 + (waveNumber - WAVE_CONFIGS.length) * 0.12;
  return {
    enemies: last.enemies.map((e) => ({
      ...e,
      count: Math.max(1, Math.floor(e.count * scale)),
      hp: Math.floor(e.hp * scale),
      speed: e.speed * (1 + (waveNumber - WAVE_CONFIGS.length) * 0.025),
    })),
    delay: Math.min(last.delay + 1, 12),
    bonusMatter: Math.floor(last.bonusMatter * scale),
  };
}

class LogicTileSystem {
  tiles = new Map<string, TileJson>();
  tileStates = new Map<string, TileState>();
  links = new Map<string, Set<string>>();
  maxExecutionDepth = 4;

  registerTile(tileJson: TileJson) {
    this.tiles.set(tileJson.id, tileJson);
    if (!this.tileStates.has(tileJson.id)) {
      this.tileStates.set(tileJson.id, { lastTriggered: 0, triggerCount: 0, activeIntensity: 0 });
    }
    if (tileJson.action?.target_id) {
      if (!this.links.has(tileJson.id)) this.links.set(tileJson.id, new Set());
      this.links.get(tileJson.id)!.add(tileJson.action.target_id);
    }
  }

  clear() {
    this.tiles.clear();
    this.tileStates.clear();
    this.links.clear();
  }

  evaluateSpatialTriggers(entities: Entity[], currentTimeMs: number) {
    for (const entity of entities) {
      if (entity.faction !== "ant") continue;
      for (const [id, tile] of this.tiles) {
        if (tile.trigger.type !== "entity_enter" || !tile.trigger.bounds) continue;
        const dx = entity.x - tile.transform.position.x;
        const dy = entity.y - tile.transform.position.y;
        const r = tile.trigger.bounds.radius;
        if (dx * dx + dy * dy > r * r) continue;
        const state = this.tileStates.get(id)!;
        if (currentTimeMs - state.lastTriggered < tile.execution.cooldown_ms) continue;
        if (tile.execution.max_triggers !== -1 && state.triggerCount >= tile.execution.max_triggers)
          continue;
        this.executeEventWire(id, currentTimeMs, 0);
      }
    }
  }

  executeEventWire(tileId: string, currentTimeMs: number, depth = 0) {
    if (depth > this.maxExecutionDepth) return;
    const tile = this.tiles.get(tileId);
    if (!tile) return;
    const state = this.tileStates.get(tileId);
    if (!state) return;
    state.lastTriggered = currentTimeMs;
    state.triggerCount++;
    state.activeIntensity = 1;
    const action = tile.action;
    if (!action?.target_id) return;
    const targetState = this.tileStates.get(action.target_id);
    if (targetState) targetState.activeIntensity = 1;
    const downstream = this.links.get(action.target_id);
    if (downstream) {
      for (const nextId of downstream) this.executeEventWire(nextId, currentTimeMs, depth + 1);
    }
  }

  updateVisualFades(dt: number) {
    for (const state of this.tileStates.values()) {
      if (state.activeIntensity > 0) {
        state.activeIntensity = Math.max(0, state.activeIntensity - dt * 2.5);
      }
    }
  }
}

const defaultNetwork: { tiles: TileJson[] } = {
  tiles: [
    {
      id: "trigger_prox_01",
      label: "Pheromone Trigger",
      type: "trigger",
      transform: { position: { x: 100, y: 140 } },
      trigger: { type: "entity_enter", bounds: { radius: 100 }, filter: { faction: "ant" } },
      action: { type: "modify_target", target_id: "action_lure_01" },
      execution: { cooldown_ms: 100, max_triggers: -1 },
    },
    {
      id: "action_lure_01",
      label: "Pheromone Lure",
      type: "action",
      transform: { position: { x: 360, y: 140 } },
      trigger: { type: "manual" },
      action: { type: "spawn_hazard", payload: { hazard_type: "pheromone_lure" } },
      execution: { cooldown_ms: 0, max_triggers: -1 },
    },
    {
      id: "trigger_prox_02",
      label: "Thermal Proximity",
      type: "trigger",
      transform: { position: { x: 100, y: 320 } },
      trigger: { type: "entity_enter", bounds: { radius: 80 }, filter: { faction: "ant" } },
      action: { type: "modify_target", target_id: "action_fire_02" },
      execution: { cooldown_ms: 250, max_triggers: -1 },
    },
    {
      id: "action_fire_02",
      label: "Trail-Fire Grid",
      type: "action",
      transform: { position: { x: 360, y: 320 } },
      trigger: { type: "manual" },
      action: { type: "spawn_hazard", payload: { hazard_type: "trail_fire" } },
      execution: { cooldown_ms: 0, max_triggers: -1 },
    },
  ],
};

/**
 * AntonVVU — the VVU "Accretion Disk Build-Layer".
 *
 * Left pane: a node-based logic editor. Drag tile bodies to reposition
 * triggers in the live arena; drag from green output ports to orange input
 * ports to wire triggers → actions. The LogicTileSystem evaluates spatial
 * entity_enter triggers each tick and propagates execution along wires.
 *
 * Right pane: the live arena. A black-hole accretion disk forms the
 * backdrop; waves of ants spawn from the screen edges and are lured or
 * burned by the hazards bound to action tiles.
 *
 * Demonstrates the IVE usage-model pillars: agnostic integration
 * (CAD/GIS-style spatial layers), model-driven V-design (each wire = a
 * requirement ↔ verification pair), and AIR runtime intervention (real-time
 * logic execution without restarting the simulation).
 */
export default function AntonVVU() {
  const edRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ wave: 1, matter: 150, health: 100 });
  const [isOver, setIsOver] = useState(false);
  const restartRef = useRef<() => void>(() => {});

  useEffect(() => {
    const edCanvas = edRef.current!;
    const gameCanvas = gameRef.current!;
    const edCtx = edCanvas.getContext("2d")!;
    const gameCtx = gameCanvas.getContext("2d")!;

    let gameWidth = 0;
    let gameHeight = 0;
    let raf = 0;
    let disposed = false;

    const gameState = {
      wave: 1,
      matter: 150,
      playerHealth: 100,
      maxHealth: 100,
      isOver: false,
      waveTimer: 0,
      entities: [] as Entity[],
      particles: [] as Particle[],
      projectiles: [] as Projectile[],
      player: { x: 0, y: 0, radius: 10, speed: 170, shootCooldown: 0, shootRate: 0.18, angle: -Math.PI / 2 },
      keys: {} as Record<string, boolean>,
      stars: [] as { x: number; y: number; size: number; blink: number }[],
      accretionAngle: 0,
    };

    const runtimeLogic = new LogicTileSystem();

    const editor = {
      tiles: new Map<string, EditorNode>(),
      wires: [] as Wire[],
      selectedTile: null as string | null,
      draggingTile: null as string | null,
      dragOffset: { x: 0, y: 0 },
      wireStart: null as { tileId: string } | null,
      mouseX: 0,
      mouseY: 0,
    };

    function syncEditorToRuntime() {
      runtimeLogic.clear();
      for (const [id, node] of editor.tiles) {
        node.tileJson.transform.position.x = node.x;
        node.tileJson.transform.position.y = node.y;
        const wire = editor.wires.find((w) => w.fromTileId === id);
        if (wire) node.tileJson.action.target_id = wire.toTileId;
        else if (node.tileJson.action) node.tileJson.action.target_id = null;
        runtimeLogic.registerTile(node.tileJson);
      }
    }

    function initEditorNetwork(schema: { tiles: TileJson[] }) {
      editor.tiles.clear();
      editor.wires = [];
      schema.tiles.forEach((t) => {
        editor.tiles.set(t.id, {
          x: t.transform.position.x,
          y: t.transform.position.y,
          width: 180,
          height: 58,
          tileJson: t,
        });
      });
      schema.tiles.forEach((t) => {
        if (t.action?.target_id)
          editor.wires.push({ fromTileId: t.id, toTileId: t.action.target_id });
      });
      syncEditorToRuntime();
    }

    function getInteractionTarget(mx: number, my: number) {
      const PORT_R = 10;
      const arr = Array.from(editor.tiles.entries()).reverse();
      for (const [id, tile] of arr) {
        const { x, y, width, height } = tile;
        const inP = { x, y: y + height / 2 };
        const outP = { x: x + width, y: y + height / 2 };
        if (Math.hypot(mx - outP.x, my - outP.y) <= PORT_R)
          return { type: "port" as const, role: "output" as const, tileId: id };
        if (Math.hypot(mx - inP.x, my - inP.y) <= PORT_R)
          return { type: "port" as const, role: "input" as const, tileId: id };
        if (mx >= x && mx <= x + width && my >= y && my <= y + height)
          return { type: "body" as const, role: null, tileId: id };
      }
      return null;
    }

    function edPoint(clientX: number, clientY: number) {
      const rect = edCanvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (edCanvas.width / rect.width),
        y: (clientY - rect.top) * (edCanvas.height / rect.height),
      };
    }

    function edDown(clientX: number, clientY: number) {
      const p = edPoint(clientX, clientY);
      editor.mouseX = p.x;
      editor.mouseY = p.y;
      const target = getInteractionTarget(p.x, p.y);
      if (!target) {
        editor.selectedTile = null;
        return;
      }
      if (target.type === "port" && target.role === "output") {
        editor.wireStart = { tileId: target.tileId };
      } else if (target.type === "body") {
        editor.selectedTile = target.tileId;
        editor.draggingTile = target.tileId;
        const tile = editor.tiles.get(target.tileId)!;
        editor.dragOffset.x = p.x - tile.x;
        editor.dragOffset.y = p.y - tile.y;
      }
    }

    function edMove(clientX: number, clientY: number) {
      const p = edPoint(clientX, clientY);
      editor.mouseX = p.x;
      editor.mouseY = p.y;
      if (editor.draggingTile) {
        const tile = editor.tiles.get(editor.draggingTile)!;
        tile.x = p.x - editor.dragOffset.x;
        tile.y = p.y - editor.dragOffset.y;
        syncEditorToRuntime();
      }
    }

    function edUp() {
      if (editor.wireStart) {
        const target = getInteractionTarget(editor.mouseX, editor.mouseY);
        editor.wires = editor.wires.filter((w) => w.fromTileId !== editor.wireStart!.tileId);
        if (
          target &&
          target.type === "port" &&
          target.role === "input" &&
          target.tileId !== editor.wireStart.tileId
        ) {
          editor.wires.push({ fromTileId: editor.wireStart.tileId, toTileId: target.tileId });
        }
        syncEditorToRuntime();
      }
      editor.draggingTile = null;
      editor.wireStart = null;
    }

    const onEdMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      edDown(e.clientX, e.clientY);
    };
    const onEdMouseMove = (e: MouseEvent) => edMove(e.clientX, e.clientY);
    const onWindowMouseUp = () => edUp();
    const onEdTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      e.preventDefault();
      edDown(e.touches[0]!.clientX, e.touches[0]!.clientY);
    };
    const onEdTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      e.preventDefault();
      edMove(e.touches[0]!.clientX, e.touches[0]!.clientY);
    };

    edCanvas.addEventListener("mousedown", onEdMouseDown);
    edCanvas.addEventListener("mousemove", onEdMouseMove);
    edCanvas.addEventListener("touchstart", onEdTouchStart, { passive: false });
    edCanvas.addEventListener("touchmove", onEdTouchMove, { passive: false });
    window.addEventListener("mouseup", onWindowMouseUp);
    window.addEventListener("touchend", onWindowMouseUp);

    function drawPort(x: number, y: number, role: "input" | "output", isConnected: boolean) {
      edCtx.beginPath();
      edCtx.arc(x, y, 6, 0, Math.PI * 2);
      edCtx.fillStyle = role === "input" ? "#ffaa00" : "#39ff14";
      edCtx.fill();
      edCtx.strokeStyle = isConnected ? "#fff" : "rgba(255,255,255,0.3)";
      edCtx.lineWidth = isConnected ? 2 : 1;
      edCtx.stroke();
    }

    function renderNodeCanvas() {
      edCtx.clearRect(0, 0, edCanvas.width, edCanvas.height);
      edCtx.strokeStyle = "rgba(0,229,255,0.04)";
      edCtx.lineWidth = 1;
      for (let x = 0; x < edCanvas.width; x += 40) {
        edCtx.beginPath();
        edCtx.moveTo(x, 0);
        edCtx.lineTo(x, edCanvas.height);
        edCtx.stroke();
      }
      for (let y = 0; y < edCanvas.height; y += 40) {
        edCtx.beginPath();
        edCtx.moveTo(0, y);
        edCtx.lineTo(edCanvas.width, y);
        edCtx.stroke();
      }

      editor.wires.forEach((wire) => {
        const from = editor.tiles.get(wire.fromTileId);
        const to = editor.tiles.get(wire.toTileId);
        if (!from || !to) return;
        const s = { x: from.x + from.width, y: from.y + from.height / 2 };
        const e = { x: to.x, y: to.y + to.height / 2 };
        const state = runtimeLogic.tileStates.get(wire.fromTileId);
        const int = state ? state.activeIntensity : 0;
        edCtx.beginPath();
        edCtx.moveTo(s.x, s.y);
        edCtx.bezierCurveTo(s.x + 60, s.y, e.x - 60, e.y, e.x, e.y);
        edCtx.strokeStyle = int > 0.05 ? `rgba(200,255,255,${0.4 + int * 0.6})` : "rgba(57,255,20,0.35)";
        edCtx.lineWidth = int > 0.05 ? 2.5 + int * 2 : 1.5;
        edCtx.shadowBlur = int * 12;
        edCtx.shadowColor = "#00e5ff";
        edCtx.stroke();
        edCtx.shadowBlur = 0;
      });

      if (editor.wireStart) {
        const from = editor.tiles.get(editor.wireStart.tileId);
        if (from) {
          const s = { x: from.x + from.width, y: from.y + from.height / 2 };
          edCtx.beginPath();
          edCtx.moveTo(s.x, s.y);
          edCtx.bezierCurveTo(s.x + 50, s.y, editor.mouseX - 50, editor.mouseY, editor.mouseX, editor.mouseY);
          edCtx.strokeStyle = "rgba(255,255,255,0.35)";
          edCtx.setLineDash([5, 5]);
          edCtx.lineWidth = 1.5;
          edCtx.stroke();
          edCtx.setLineDash([]);
        }
      }

      for (const [id, tile] of editor.tiles) {
        const { x, y, width, height, tileJson } = tile;
        const state = runtimeLogic.tileStates.get(id);
        const int = state ? state.activeIntensity : 0;
        edCtx.fillStyle = "rgba(20,13,36,0.85)";
        edCtx.shadowBlur = 8 + int * 16;
        edCtx.shadowColor = tileJson.type === "trigger" ? "#00e5ff" : "#9d00ff";
        edCtx.fillRect(x, y, width, height);
        edCtx.shadowBlur = 0;
        edCtx.strokeStyle =
          editor.selectedTile === id
            ? "rgba(255,255,255,0.8)"
            : tileJson.type === "trigger"
              ? "rgba(0,229,255,0.45)"
              : "rgba(189,0,255,0.45)";
        edCtx.lineWidth = editor.selectedTile === id ? 2 : 1;
        edCtx.strokeRect(x, y, width, height);
        edCtx.fillStyle = "#fff";
        edCtx.font = "bold 12px monospace";
        edCtx.fillText(tileJson.label, x + 12, y + 22);
        edCtx.fillStyle = "rgba(224,213,240,0.55)";
        edCtx.font = "10px monospace";
        if (tileJson.type === "trigger") {
          edCtx.fillText(`Radius: ${tileJson.trigger.bounds?.radius}m`, x + 12, y + 38);
          edCtx.fillText("Target ─►", x + 12, y + 50);
        } else {
          edCtx.fillText(`Mod: ${tileJson.action.payload?.hazard_type}`, x + 12, y + 42);
        }
        drawPort(x, y + height / 2, "input", editor.wires.some((w) => w.toTileId === id));
        drawPort(x + width, y + height / 2, "output", editor.wires.some((w) => w.fromTileId === id));
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      gameState.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function spawnParticle(x: number, y: number, color: string, speed: number, life: number, size?: number) {
      const a = Math.random() * Math.PI * 2;
      gameState.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        maxLife: life,
        color,
        size: size || 2 + Math.random() * 2,
        decay: 0.5 + Math.random() * 0.5,
      });
    }

    function spawnExplosion(x: number, y: number, color: string, qty: number) {
      for (let i = 0; i < qty; i++)
        spawnParticle(x, y, color, 15 + Math.random() * 60, 0.3 + Math.random() * 0.4, 3);
      for (let i = 0; i < qty * 0.4; i++)
        spawnParticle(x, y, "#ffffff", 20 + Math.random() * 40, 0.15 + Math.random() * 0.2, 1.5);
    }

    function handleShoot(clientX: number, clientY: number) {
      if (gameState.isOver) return;
      const rect = gameCanvas.getBoundingClientRect();
      const clickX = (clientX - rect.left) * (gameCanvas.width / rect.width);
      const clickY = (clientY - rect.top) * (gameCanvas.height / rect.height);
      const p = gameState.player;
      if (p.shootCooldown > 0) return;
      const angle = Math.atan2(clickY - p.y, clickX - p.x);
      p.angle = angle;
      gameState.projectiles.push({
        x: p.x + Math.cos(angle) * 18,
        y: p.y + Math.sin(angle) * 18,
        vx: Math.cos(angle) * 380,
        vy: Math.sin(angle) * 380,
        radius: 3,
        life: 2,
      });
      p.shootCooldown = p.shootRate;
      for (let i = 0; i < 6; i++)
        spawnParticle(
          p.x + Math.cos(angle) * 20,
          p.y + Math.sin(angle) * 20,
          "#00e5ff",
          3 + Math.random() * 4,
          0.2 + Math.random() * 0.2,
          2,
        );
    }

    const onGameMouseDown = (e: MouseEvent) => handleShoot(e.clientX, e.clientY);
    const onGameTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length) handleShoot(e.touches[0]!.clientX, e.touches[0]!.clientY);
    };
    gameCanvas.addEventListener("mousedown", onGameMouseDown);
    gameCanvas.addEventListener("touchstart", onGameTouchStart, { passive: false });

    function initStars() {
      gameState.stars = [];
      for (let i = 0; i < 180; i++) {
        gameState.stars.push({
          x: Math.random() * gameWidth,
          y: Math.random() * gameHeight,
          size: Math.random() * 1.5,
          blink: Math.random() * Math.PI * 2,
        });
      }
    }

    function renderBackground(dt: number) {
      gameState.accretionAngle += dt * 0.15;
      gameState.stars.forEach((s) => {
        s.blink += dt * 2;
        const a = 0.3 + Math.sin(s.blink) * 0.3;
        gameCtx.fillStyle = `rgba(255,255,255,${a})`;
        gameCtx.beginPath();
        gameCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        gameCtx.fill();
      });
      const cx = gameWidth / 2;
      const cy = gameHeight / 2;
      const grad = gameCtx.createRadialGradient(cx, cy, 6, cx, cy, 90);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.2, "rgba(0,0,0,0.95)");
      grad.addColorStop(0.5, "rgba(255,170,0,0.08)");
      grad.addColorStop(0.8, "rgba(0,229,255,0.04)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      gameCtx.fillStyle = grad;
      gameCtx.beginPath();
      gameCtx.arc(cx, cy, 90, 0, Math.PI * 2);
      gameCtx.fill();
      gameCtx.strokeStyle = "rgba(255,170,0,0.08)";
      gameCtx.lineWidth = 1;
      for (let r = 70; r < Math.max(gameWidth, gameHeight); r += 70) {
        gameCtx.beginPath();
        gameCtx.ellipse(cx, cy, r, r * 0.35, gameState.accretionAngle * (r % 2 === 0 ? 1 : -1) * 0.02, 0, Math.PI * 2);
        gameCtx.stroke();
      }
      const time = performance.now() * 0.001;
      for (let i = 0; i < 40; i++) {
        const angle = time * 0.5 + i * 0.35;
        const r = 45 + (i % 5) * 25 + Math.sin(time + i) * 10;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r * 0.35;
        const a = 0.4 + Math.sin(time * 2 + i) * 0.3;
        gameCtx.fillStyle = i % 3 === 0 ? `rgba(255,170,0,${a})` : `rgba(0,229,255,${a * 0.6})`;
        gameCtx.beginPath();
        gameCtx.arc(px, py, 1.2, 0, Math.PI * 2);
        gameCtx.fill();
      }
    }

    function runWaveSpawning(dt: number) {
      if (gameState.isOver) return;
      const antsAlive = gameState.entities.filter((e) => e.faction === "ant").length;
      if (antsAlive > 0) return;
      gameState.waveTimer -= dt;
      if (gameState.waveTimer > 0) return;
      const config = getWaveConfig(gameState.wave)!;
      config.enemies.forEach((def) => {
        for (let i = 0; i < def.count; i++) {
          const side = Math.floor(Math.random() * 4);
          let sx = 0;
          let sy = 0;
          if (side === 0) {
            sx = Math.random() * gameWidth;
            sy = -25;
          } else if (side === 1) {
            sx = gameWidth + 25;
            sy = Math.random() * gameHeight;
          } else if (side === 2) {
            sx = Math.random() * gameWidth;
            sy = gameHeight + 25;
          } else {
            sx = -25;
            sy = Math.random() * gameHeight;
          }
          gameState.entities.push({
            id: `ant_${Date.now()}_${Math.random()}`,
            faction: "ant",
            type: def.type,
            x: sx,
            y: sy,
            health: def.hp,
            maxHp: def.hp,
            speed: def.speed,
            radius: def.radius,
            color: def.color,
          });
        }
      });
      gameState.matter += config.bonusMatter;
      gameState.waveTimer = config.delay;
    }

    function updateSimulation(dt: number) {
      if (gameState.isOver) return;

      let mx = 0;
      let my = 0;
      if (gameState.keys["w"] || gameState.keys["arrowup"]) my = -1;
      if (gameState.keys["s"] || gameState.keys["arrowdown"]) my = 1;
      if (gameState.keys["a"] || gameState.keys["arrowleft"]) mx = -1;
      if (gameState.keys["d"] || gameState.keys["arrowright"]) mx = 1;
      if (mx !== 0 && my !== 0) {
        mx *= 0.7071;
        my *= 0.7071;
      }
      const p = gameState.player;
      p.x += mx * p.speed * dt;
      p.y += my * p.speed * dt;
      p.x = Math.max(14, Math.min(gameWidth - 14, p.x));
      p.y = Math.max(14, Math.min(gameHeight - 14, p.y));
      if (p.shootCooldown > 0) p.shootCooldown -= dt;

      for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const b = gameState.projectiles[i]!;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (Math.random() < 0.5) spawnParticle(b.x, b.y, "rgba(0,229,255,0.6)", 0.5, 0.15, 1);
        if (b.life <= 0 || b.x < -20 || b.x > gameWidth + 20 || b.y < -20 || b.y > gameHeight + 20)
          gameState.projectiles.splice(i, 1);
      }

      const now = performance.now();
      runtimeLogic.evaluateSpatialTriggers(gameState.entities, now);
      runtimeLogic.updateVisualFades(dt);

      for (let i = gameState.entities.length - 1; i >= 0; i--) {
        const ent = gameState.entities[i]!;
        if (ent.faction !== "ant") continue;
        let tx = p.x;
        let ty = p.y;

        for (const tile of runtimeLogic.tiles.values()) {
          if (tile.trigger.type !== "entity_enter" || !tile.trigger.bounds) continue;
          const dist = Math.hypot(ent.x - tile.transform.position.x, ent.y - tile.transform.position.y);
          if (dist > tile.trigger.bounds.radius) continue;
          if (!tile.action?.target_id) continue;
          const targetNode = runtimeLogic.tiles.get(tile.action.target_id);
          if (!targetNode?.action?.payload) continue;
          const hz = targetNode.action.payload.hazard_type;
          if (hz === "pheromone_lure") {
            tx = targetNode.transform.position.x;
            ty = targetNode.transform.position.y;
          }
          if (hz === "trail_fire") {
            ent.health -= 28 * dt;
            if (Math.random() < 0.2) spawnExplosion(ent.x, ent.y, "#ffaa00", 2);
          }
        }

        const ang = Math.atan2(ty - ent.y, tx - ent.x);
        ent.x += Math.cos(ang) * ent.speed * dt;
        ent.y += Math.sin(ang) * ent.speed * dt;

        for (let j = gameState.projectiles.length - 1; j >= 0; j--) {
          const b = gameState.projectiles[j]!;
          if (Math.hypot(b.x - ent.x, b.y - ent.y) <= ent.radius + b.radius + 2) {
            ent.health -= 20;
            spawnExplosion(b.x, b.y, ent.color, 5);
            gameState.projectiles.splice(j, 1);
            break;
          }
        }

        if (ent.health <= 0) {
          spawnExplosion(ent.x, ent.y, ent.color, 14);
          gameState.matter += ent.type === "soldier" ? 50 : ent.type === "acidspitter" ? 40 : 18;
          gameState.entities.splice(i, 1);
          if (gameState.entities.filter((e) => e.faction === "ant").length === 0) {
            gameState.wave++;
            gameState.waveTimer = 2.5;
          }
          continue;
        }

        if (Math.hypot(ent.x - p.x, ent.y - p.y) <= ent.radius + p.radius + 2) {
          gameState.playerHealth -= 20 * dt;
          if (Math.random() < 0.25) spawnExplosion(p.x, p.y, "#ffffff", 2);
          if (gameState.playerHealth <= 0) {
            gameState.playerHealth = 0;
            gameState.isOver = true;
            setIsOver(true);
          }
        }
      }

      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const pt = gameState.particles[i]!;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.96;
        pt.vy *= 0.96;
        pt.life -= dt * pt.decay;
        if (pt.life <= 0) gameState.particles.splice(i, 1);
      }
      if (gameState.particles.length > 600)
        gameState.particles.splice(0, gameState.particles.length - 600);
    }

    function renderGameArena(dt: number) {
      gameCtx.clearRect(0, 0, gameWidth, gameHeight);
      renderBackground(dt);

      for (const [id, tile] of runtimeLogic.tiles) {
        const pos = tile.transform.position;
        const state = runtimeLogic.tileStates.get(id);
        const pulse = 1 + Math.sin(performance.now() / 150) * 0.06;
        if (tile.type === "trigger" && tile.trigger.bounds) {
          const r = tile.trigger.bounds.radius * pulse;
          const g = gameCtx.createRadialGradient(pos.x, pos.y, r * 0.15, pos.x, pos.y, r);
          g.addColorStop(0, "rgba(0,229,255,0.03)");
          g.addColorStop(0.7, "rgba(0,229,255,0.06)");
          g.addColorStop(1, "rgba(0,229,255,0.18)");
          gameCtx.fillStyle = g;
          gameCtx.beginPath();
          gameCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          gameCtx.fill();
          gameCtx.strokeStyle = `rgba(0,229,255,${0.15 + (state ? state.activeIntensity * 0.3 : 0)})`;
          gameCtx.lineWidth = 1.5;
          gameCtx.stroke();
          gameCtx.setLineDash([4, 8]);
          gameCtx.beginPath();
          gameCtx.arc(pos.x, pos.y, r * pulse, 0, Math.PI * 2);
          gameCtx.stroke();
          gameCtx.setLineDash([]);
        } else if (tile.type === "action" && tile.action.payload) {
          const hz = tile.action.payload.hazard_type;
          gameCtx.beginPath();
          gameCtx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
          gameCtx.fillStyle = hz === "pheromone_lure" ? "rgba(189,0,255,0.12)" : "rgba(255,170,0,0.12)";
          gameCtx.fill();
          gameCtx.strokeStyle = hz === "pheromone_lure" ? "rgba(189,0,255,0.5)" : "rgba(255,170,0,0.5)";
          gameCtx.lineWidth = 1.5;
          gameCtx.stroke();
          gameCtx.fillStyle = "#fff";
          gameCtx.font = "9px monospace";
          gameCtx.textAlign = "center";
          gameCtx.fillText(hz === "pheromone_lure" ? "LURE" : "FIRE", pos.x, pos.y + 3);
          gameCtx.textAlign = "left";
        }
      }

      gameState.entities.forEach((ent) => {
        gameCtx.shadowBlur = 12;
        gameCtx.shadowColor = ent.color;
        gameCtx.fillStyle = ent.color;
        gameCtx.beginPath();
        gameCtx.arc(ent.x, ent.y, ent.radius, 0, Math.PI * 2);
        gameCtx.fill();
        gameCtx.shadowBlur = 0;
        if (ent.health < ent.maxHp) {
          const bw = ent.radius * 2.2;
          const pct = ent.health / ent.maxHp;
          gameCtx.fillStyle = "rgba(255,255,255,0.15)";
          gameCtx.fillRect(ent.x - bw / 2, ent.y - ent.radius - 8, bw, 3);
          gameCtx.fillStyle = pct < 0.3 ? "#ff0055" : "#00ff88";
          gameCtx.fillRect(ent.x - bw / 2, ent.y - ent.radius - 8, bw * pct, 3);
        }
      });

      gameCtx.shadowBlur = 10;
      gameCtx.shadowColor = "rgba(0,229,255,0.5)";
      gameState.projectiles.forEach((b) => {
        gameCtx.fillStyle = "#00e5ff";
        gameCtx.beginPath();
        gameCtx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        gameCtx.fill();
      });
      gameCtx.shadowBlur = 0;

      gameState.particles.forEach((pt) => {
        const a = Math.max(0, pt.life / pt.maxLife);
        gameCtx.globalAlpha = a;
        gameCtx.fillStyle = pt.color;
        gameCtx.beginPath();
        gameCtx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2);
        gameCtx.fill();
      });
      gameCtx.globalAlpha = 1;

      if (!gameState.isOver) {
        const p = gameState.player;
        const ta = p.angle + Math.PI;
        for (let i = 0; i < 5; i++) {
          const t = i / 5;
          const tx = p.x + Math.cos(ta) * (8 + i * 3) + (Math.random() - 0.5) * 3;
          const ty = p.y + Math.sin(ta) * (8 + i * 3) + (Math.random() - 0.5) * 3;
          gameCtx.fillStyle = `rgba(0,229,255,${0.4 - t * 0.35})`;
          gameCtx.beginPath();
          gameCtx.arc(tx, ty, 3 - t * 2, 0, Math.PI * 2);
          gameCtx.fill();
        }
        gameCtx.save();
        gameCtx.translate(p.x, p.y);
        gameCtx.rotate(p.angle);
        gameCtx.shadowBlur = 15;
        gameCtx.shadowColor = "rgba(0,229,255,0.4)";
        gameCtx.fillStyle = "#0a1628";
        gameCtx.beginPath();
        gameCtx.moveTo(14, 0);
        gameCtx.lineTo(-10, -8);
        gameCtx.lineTo(-6, 0);
        gameCtx.lineTo(-10, 8);
        gameCtx.closePath();
        gameCtx.fill();
        gameCtx.fillStyle = "rgba(0,229,255,0.8)";
        gameCtx.beginPath();
        gameCtx.arc(2, 0, 3, 0, Math.PI * 2);
        gameCtx.fill();
        gameCtx.restore();
        gameCtx.shadowBlur = 0;
      }
    }

    function fitCanvasViewports() {
      const left = edCanvas.getBoundingClientRect();
      edCanvas.width = Math.max(1, Math.floor(left.width));
      edCanvas.height = Math.max(1, Math.floor(left.height));
      const right = gameCanvas.getBoundingClientRect();
      gameCanvas.width = Math.max(1, Math.floor(right.width));
      gameCanvas.height = Math.max(1, Math.floor(right.height));
      gameWidth = gameCanvas.width;
      gameHeight = gameCanvas.height;
      initStars();
    }

    function resetToAnchorNode() {
      gameState.wave = 1;
      gameState.matter = 100;
      gameState.playerHealth = 100;
      gameState.isOver = false;
      gameState.waveTimer = 2;
      gameState.entities = [];
      gameState.projectiles = [];
      gameState.particles = [];
      gameState.player.x = gameWidth / 2;
      gameState.player.y = gameHeight / 2;
      gameState.player.angle = -Math.PI / 2;
      setIsOver(false);
      initEditorNetwork(JSON.parse(JSON.stringify(defaultNetwork)));
      initStars();
    }
    restartRef.current = resetToAnchorNode;

    const onResize = () => {
      fitCanvasViewports();
      syncEditorToRuntime();
    };
    window.addEventListener("resize", onResize);

    let lastStamp = performance.now();
    let hudAccum = 0;
    function masterEngineTick(timestamp: number) {
      if (disposed) return;
      let dt = (timestamp - lastStamp) / 1000;
      if (dt > 0.12) dt = 0.12;
      lastStamp = timestamp;
      runWaveSpawning(dt);
      updateSimulation(dt);
      renderNodeCanvas();
      renderGameArena(dt);
      hudAccum += dt;
      if (hudAccum > 0.1) {
        hudAccum = 0;
        setHud({
          wave: gameState.wave,
          matter: Math.floor(gameState.matter),
          health: gameState.playerHealth,
        });
      }
      raf = requestAnimationFrame(masterEngineTick);
    }

    fitCanvasViewports();
    resetToAnchorNode();
    raf = requestAnimationFrame(masterEngineTick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mouseup", onWindowMouseUp);
      window.removeEventListener("touchend", onWindowMouseUp);
      edCanvas.removeEventListener("mousedown", onEdMouseDown);
      edCanvas.removeEventListener("mousemove", onEdMouseMove);
      edCanvas.removeEventListener("touchstart", onEdTouchStart);
      edCanvas.removeEventListener("touchmove", onEdTouchMove);
      gameCanvas.removeEventListener("mousedown", onGameMouseDown);
      gameCanvas.removeEventListener("touchstart", onGameTouchStart);
    };
  }, []);

  const pct = hud.health / 100;
  const activeSegments = Math.ceil(pct * 10);

  return (
    <div className="vvu-root">
      <header className="vvu-header">
        <h2 className="vvu-title">Anton VVU · Accretion Disk Build-Layer</h2>
        <div className="vvu-stats">
          <div>
            WAVE <span className="vvu-stat-val">{hud.wave}</span>
          </div>
          <div>
            MATTER <span className="vvu-stat-val">{hud.matter}</span>
          </div>
          <div className="vvu-core">
            CORE
            <span className="vvu-segments">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < activeSegments
                      ? pct < 0.3
                        ? "vvu-seg vvu-seg-danger"
                        : "vvu-seg vvu-seg-active"
                      : "vvu-seg"
                  }
                />
              ))}
            </span>
          </div>
        </div>
      </header>

      <div className="vvu-main">
        <section className="vvu-pane vvu-pane-left">
          <div className="vvu-pane-title">SDK Node Editor</div>
          <canvas ref={edRef} className="vvu-canvas" />
          <div className="vvu-instructions">
            <b>[Node Sandbox Operations]</b>
            <br />• Drag node bodies to reposition triggers in the live arena.
            <br />• Drag from <span className="vvu-green">Green (Output)</span> to{" "}
            <span className="vvu-orange">Orange (Input)</span> to wire logic.
            <br />• Route triggers into actions to modify real-time enemy vectors.
          </div>
        </section>

        <section className="vvu-pane vvu-pane-right">
          <div className="vvu-pane-title">Live Accretion Disk Viewport</div>
          <canvas ref={gameRef} className="vvu-canvas" />
          {isOver && (
            <div className="vvu-gameover">
              <h3>EVENT HORIZON BREACH</h3>
              <p>Platform consumed by the singularity.</p>
              <button className="vvu-btn" onClick={() => restartRef.current()}>
                Re-Anchor Platform
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
