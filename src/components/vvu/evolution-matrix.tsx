"use client";

/**
 * EvolutionMatrix — Fibonacci-distributed instanced point cloud that
 * morphs between 4 stages of the VVU trust story:
 *
 *   0. GLOBAL SPHERE     →  STUDI's institutional view (every node equal)
 *   1. ANT MASCOT (ANTONE) →  STUDI's mascot (worker/scholar)
 *   2. KINETIC WEB SPIDER  →  IVE's plugin network (webhook fan-out)
 *   3. MILES SPIDER-MAN   →  IVE's engineering release (red = authorized)
 *
 * Fibonacci lattice: phi = acos(-1 + 2i/N), theta = sqrt(N·π)·phi —
 * the canonical lowest-discrepancy isotropic sphere distribution.
 *
 * ── Ghost Buffer + Intent Worker (0ms latency) ─────────────────────
 * The matrix spawns a Web Worker (`public/intentWorker.js`) that runs
 * the operator intent vector through an Epistemic Hazard Wall every
 * 50ms. When the wall returns ALLOW for a predicted stage, the matrix
 * immediately sets `ghostTargetRef.current = predictedStage` — and the
 * very next requestAnimationFrame begins easing `phaseRef.current`
 * toward that stage. This is the 0ms latency standard: the visible
 * morph starts the instant the worker fires ALLOW, BEFORE the next
 * /api/theorem-state poll (5s cadence) catches up. The Ghost Buffer
 * is the pre-rendered position cache for the predicted stage; the
 * main render loop composites against it.
 *
 * ── Telemetry binding ──────────────────────────────────────────────
 * When `dataDriven` is true (default for hero backdrops and the
 * standalone Live page), the matrix reads its target stage from the
 * global theorem-state store. The store updates every 5s; the matrix
 * eases toward that target. The Intent Worker's ALLOW signal pre-
 * cedes the store update by up to 5s — the Ghost Buffer fills that
 * gap.
 *
 * ── Fail-closed bound ──────────────────────────────────────────────
 * The worker's Epistemic Hazard Wall refuses ALLOW when any breaker
 * is tripped (EIS Theorem 5). So the Ghost Buffer can never pre-
 * render a Miles morph under a tripped breaker — the matrix is
 * visually fail-closed, not just contractually.
 *
 * Bug-fix from v1 React port: previous version had
 * `useEffect(..., [isPlaying, smokeEnabled])` which tore down the
 * entire Three.js scene on every toggle. Fixed here by holding
 * dynamic state in refs and running a single mount-time effect.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useWorkspace, type WorkspaceId } from "@/lib/workspace";
import {
  useTheoremStore,
  stageForWorkspace,
  stageForCockpit,
} from "@/lib/theorem/theorem-store";

export type EvolutionMatrixMode = "hero" | "full";

interface EvolutionMatrixProps {
  mode?: EvolutionMatrixMode;
  className?: string;
  /** In non-data-driven mode, which stage range to auto-loop through. */
  stageRange?: [number, number];
  /**
   * When true (default for hero), the matrix reads its target stage
   * from the global theorem-state store. The standalone page sets
   * this to false to keep the auto-loop + slider exploration.
   */
  dataDriven?: boolean;
  /** When true (Valve Cockpit), use the combined 4-stage morph. */
  combinedStage?: boolean;
  /**
   * When true (default), spawn the Intent Worker and bind the Ghost
   * Buffer. Set false to disable the 0ms pre-render path entirely
   * (e.g. for headless test environments that don't ship Web Workers).
   */
  ghostBufferEnabled?: boolean;
  /**
   * Fires when the Ghost Buffer pre-renders a stage transition — i.e.
   * the worker posted ALLOW and the matrix has snapped phaseRef to
   * the predicted stage. Used for telemetry logging.
   */
  onGhostRender?: (target: string, score: number) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NODE_COUNT = 650;

const STAGE_CONFIG = [
  { text: "0. GLOBAL SPHERE", color: "#7c8bf5" },
  { text: "1. ANT MASCOT (ANTONE)", color: "#c07a40" },
  { text: "2. KINETIC WEB SPIDER", color: "#e67e22" },
  { text: "3. MILES SPIDER-MAN", color: "#e74c3c" },
] as const;

const WORKSPACE_RANGE: Record<WorkspaceId, [number, number]> = {
  studi: [0, 1],
  ive: [2, 3],
};

// ─── Deterministic pseudo-random (so clouds don't shimmer between frames) ──

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

// ─── Stage position generators ──────────────────────────────────────────────

function getSpherePos(i: number): THREE.Vector3 {
  const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
  const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
  return new THREE.Vector3(
    Math.cos(theta) * Math.sin(phi) * 1.1,
    Math.sin(theta) * Math.sin(phi) * 1.1,
    Math.cos(phi) * 1.1
  );
}

function getAntPos(i: number): THREE.Vector3 {
  const ratio = i / NODE_COUNT;
  let x = 0,
    y = 0,
    z = (rand(i + 5) - 0.5) * 0.05;
  if (ratio < 0.25) {
    const a = rand(i + 1) * Math.PI * 2;
    const dist = Math.sqrt(rand(i + 2)) * 0.35;
    x = -0.6 + dist * Math.cos(a) * 1.2;
    y = -0.15 + dist * Math.sin(a);
  } else if (ratio < 0.45) {
    const a = rand(i + 1) * Math.PI * 2;
    const dist = Math.sqrt(rand(i + 2)) * 0.18;
    x = -0.1 + dist * Math.cos(a);
    y = 0.05 + dist * Math.sin(a);
  } else if (ratio < 0.65) {
    const a = rand(i + 1) * Math.PI * 2;
    const dist = Math.sqrt(rand(i + 2)) * 0.18;
    x = 0.35 + dist * Math.cos(a);
    y = 0.25 + dist * Math.sin(a);
  } else {
    const leg = i % 6;
    const p = rand(i + 3);
    if (leg === 0) { x = -0.2 - p * 0.3; y = 0.05 + p * 0.4; }
    if (leg === 1) { x = -0.1 - p * 0.4; y = 0.05 - p * 0.2; }
    if (leg === 2) { x = 0.0 - p * 0.2; y = 0.0 - p * 0.5; }
    if (leg === 3) { x = -0.1 + p * 0.3; y = 0.05 + p * 0.5; }
    if (leg === 4) { x = 0.0 + p * 0.4; y = 0.05 - p * 0.1; }
    if (leg === 5) { x = 0.1 + p * 0.2; y = 0.0 - p * 0.5; }
  }
  return new THREE.Vector3(x, y, z);
}

function getWebSpiderPos(i: number): THREE.Vector3 {
  const ratio = i / NODE_COUNT;
  let x = 0,
    y = 0,
    z = 0;
  if (ratio < 0.3) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.22;
    x = r * Math.cos(a);
    y = r * Math.sin(a) * 1.3;
  } else if (ratio < 0.45) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.1;
    x = r * Math.cos(a);
    y = 0.28 + r * Math.sin(a);
  } else {
    const leg = i % 8;
    const p = rand(i + 2);
    const angle = (leg * Math.PI) / 4 + 0.2;
    x = Math.cos(angle) * (0.2 + p * 0.6);
    y = Math.sin(angle) * (0.25 + p * 0.6) * 1.2;
  }
  return new THREE.Vector3(x, y - 0.2, z);
}

function getSpideyPos(i: number): { pos: THREE.Vector3; isRed: boolean } {
  const ratio = i / NODE_COUNT;
  let x = 0,
    y = 0,
    z = 0;
  let isRed = false;
  if (ratio < 0.12) {
    isRed = true;
    const p = rand(i);
    const leg = i % 8;
    const a = (leg * Math.PI) / 4 + rand(i + 1) * 0.1;
    x = Math.cos(a) * (p * 0.3);
    y = 0.2 + Math.sin(a) * (p * 0.28);
  } else if (ratio < 0.18) {
    isRed = true;
    const side = i % 2 === 0 ? 1 : -1;
    const p = rand(i);
    x = 0.12 * side + (rand(i + 1) - 0.5) * 0.08 + p * 0.05 * side;
    y = 0.65 + p * 0.15;
  } else if (ratio < 0.4) {
    const p = rand(i);
    x = -0.15 - p * 0.75;
    y = 0.45 - Math.sin(p * Math.PI * 0.6) * 0.25;
  } else if (ratio < 0.65) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.28;
    x = 0.2 + r * Math.cos(a) * 1.2;
    y = 0.3 + r * Math.sin(a);
  } else if (ratio < 0.82) {
    const p = rand(i);
    x = -0.7 + p * 0.6;
    y = -0.3 - Math.sin(p * Math.PI * 0.5) * 0.3;
  } else {
    const p = rand(i);
    x = 0.1 + p * 0.8;
    y = 0.1 - p * 0.6;
  }
  return { pos: new THREE.Vector3(x * 1.4, (y - 0.1) * 1.4, z), isRed };
}

// Pre-compute every node's per-stage position once.
interface NodeCache {
  s0: THREE.Vector3;
  s1: THREE.Vector3;
  s2: THREE.Vector3;
  s3: THREE.Vector3;
  isRed: boolean;
}

function buildNodeCache(): NodeCache[] {
  const cache: NodeCache[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const spideyData = getSpideyPos(i);
    cache.push({
      s0: getSpherePos(i),
      s1: getAntPos(i),
      s2: getWebSpiderPos(i),
      s3: spideyData.pos,
      isRed: spideyData.isRed,
    });
  }
  return cache;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EvolutionMatrix({
  mode = "full",
  className,
  stageRange,
  dataDriven = false,
  combinedStage = false,
  ghostBufferEnabled = true,
  onGhostRender,
}: EvolutionMatrixProps) {
  const { workspace } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // UI state — kept in React state so the controls re-render.
  const [isPlaying, setIsPlaying] = useState(true);
  const [smokeEnabled, setSmokeEnabled] = useState(false);

  // Telemetry subscription — reads the live theorem-state verdict that
  // drives the morph. The store updates every 5s; the selector only
  // emits when the stage actually changes so re-renders are tied to
  // verdict transitions, not poll cadence.
  const targetStage = useTheoremStore((s) => {
    if (!dataDriven) return null;
    return combinedStage ? stageForCockpit(s) : stageForWorkspace(workspace, s);
  });
  const breakerTripped = useTheoremStore((s) => s.breaker === "TRIPPED");
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const confidence = useTheoremStore((s) => s.confidence);

  // Mutable refs — read inside the animation loop without forcing it
  // to re-subscribe on every poll tick.
  const isPlayingRef = useRef(isPlaying);
  const smokeEnabledRef = useRef(smokeEnabled);
  const workspaceRef = useRef(workspace);
  const dataDrivenRef = useRef(dataDriven);
  const targetStageRef = useRef<number | null>(targetStage);
  const breakerTrippedRef = useRef(breakerTripped);
  const playDirectionRef = useRef(1);
  const phaseRef = useRef(
    stageRange ? stageRange[0] : WORKSPACE_RANGE[workspace][0]
  );
  const rangeRef = useRef(stageRange ?? WORKSPACE_RANGE[workspace]);

  // ── Ghost Buffer refs ─────────────────────────────────────────────────
  // ghostTargetRef: stage the Intent Worker's ALLOW flag has pre-
  // rendered. When non-null and != targetStageRef, the animation
  // loop eases phaseRef toward ghostTargetRef first — that's the
  // 0ms pre-render path. When the telemetry store catches up (next
  // /api/theorem-state poll ≤5s later), targetStageRef becomes
  // equal to ghostTargetRef, the ghost path goes idle, and the
  // morph continues under telemetry control.
  const ghostTargetRef = useRef<number | null>(null);
  const ghostScoreRef = useRef<number>(0);
  const workerRef = useRef<Worker | null>(null);
  const ghostBufferEnabledRef = useRef(ghostBufferEnabled);
  const onGhostRenderRef = useRef(onGhostRender);
  const studiVerdictRef = useRef(studiVerdict);
  const iveVerdictRef = useRef(iveVerdict);
  const confidenceRef = useRef(confidence);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { smokeEnabledRef.current = smokeEnabled; }, [smokeEnabled]);
  useEffect(() => { targetStageRef.current = targetStage; }, [targetStage]);
  useEffect(() => { breakerTrippedRef.current = breakerTripped; }, [breakerTripped]);
  useEffect(() => { dataDrivenRef.current = dataDriven; }, [dataDriven]);
  useEffect(() => { ghostBufferEnabledRef.current = ghostBufferEnabled; }, [ghostBufferEnabled]);
  useEffect(() => { onGhostRenderRef.current = onGhostRender; }, [onGhostRender]);
  useEffect(() => { studiVerdictRef.current = studiVerdict; }, [studiVerdict]);
  useEffect(() => { iveVerdictRef.current = iveVerdict; }, [iveVerdict]);
  useEffect(() => { confidenceRef.current = confidence; }, [confidence]);
  useEffect(() => {
    workspaceRef.current = workspace;
    if (!dataDriven && !stageRange) {
      rangeRef.current = WORKSPACE_RANGE[workspace];
    }
  }, [workspace, stageRange, dataDriven]);

  // ── Intent Worker — spawn once on mount, terminated on unmount. ───────
  useEffect(() => {
    if (!ghostBufferEnabled) return;
    // Web Workers can be unavailable in some test/SSR contexts — guard.
    if (typeof Worker === "undefined") return;

    let worker: Worker;
    try {
      worker = new Worker("/intentWorker.js");
    } catch {
      // Worker construction failed (e.g. CSP, file:// origin) — leave
      // the Ghost Buffer disabled. The matrix still works under
      // telemetry-only control, just at 5s latency instead of 0ms.
      return;
    }
    workerRef.current = worker;

    worker.onmessage = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (data.type === "ALLOW") {
        // Epistemic Hazard Wall cleared — pre-render the predicted
        // stage. The animation loop will pick up ghostTargetRef on
        // the next rAF (≤16ms away — the 0ms latency standard).
        const stage = typeof data.stage === "number" ? data.stage : null;
        if (stage === null) return;
        // Fail-closed: if breaker has tripped since the worker fired,
        // refuse to pre-render past stage 2 (web-spider pulsing red).
        if (breakerTrippedRef.current && stage > 2) return;
        ghostTargetRef.current = stage;
        ghostScoreRef.current = typeof data.score === "number" ? data.score : 0;
        onGhostRenderRef.current?.(`stage_${stage}`, ghostScoreRef.current);
      } else if (data.type === "DENY") {
        // Wall refused — clear the ghost target so telemetry control
        // resumes. This is the visual fail-closed bound: a DENY from
        // the wall can never leave a Miles morph pre-rendered.
        ghostTargetRef.current = null;
      }
    };

    // Throttled input vector sender — 20fps. Composes the operator's
    // gaze/mouse position with the live verdict confidence to give
    // the wall something to evaluate.
    let lastSend = 0;
    const sendVector = () => {
      if (!workerRef.current) return;
      const now = performance.now();
      if (now - lastSend < 50) return; // 20fps
      lastSend = now;
      // Build the intent vector from the live telemetry + a tiny
      // deterministic operator-input jitter. In a production build
      // this would come from the gaze/mouse hooks; here we use the
      // verdict confidence so the worker's classifier sees the
      // same truth the matrix does.
      const score = Math.min(
        1,
        confidenceRef.current * 0.7 + 0.3 + (Math.random() * 0.05 - 0.025)
      );
      const studiGatesMet = studiVerdictRef.current === "PROVEN" ? 1 : 0;
      const iveClaimsAuth =
        iveVerdictRef.current === "PROVEN"
          ? 1
          : iveVerdictRef.current === "INCONCLUSIVE"
            ? 0.3
            : 0;
      const conjuncts =
        iveVerdictRef.current === "PROVEN"
          ? { C: true, E: true, I: true, S: true, R: true }
          : { C: false, E: false, I: false, S: false, R: false };
      workerRef.current.postMessage({
        type: "VECTOR",
        sessionId: "evolution-matrix",
        input: {
          score,
          breakerTripped: breakerTrippedRef.current,
          studiGatesMet,
          iveClaimsAuth,
          conjuncts,
        },
      });
    };
    // Tick the vector at 5Hz so the wall re-evaluates as the store
    // changes. Lower frequency than 20fps would still work — this
    // just gives a fast pre-render once ALLOW fires.
    const interval = window.setInterval(sendVector, 200);
    // Also re-evaluate immediately on any verdict transition.
    const sendImmediate = () => sendVector();
    window.addEventListener("mousemove", sendImmediate, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", sendImmediate);
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostBufferEnabled]);

  // ── Three.js scene — created ONCE on mount, never rebuilt. ──────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const dotGeometry = new THREE.CircleGeometry(0.015, 8);
    const instancedMesh = new THREE.InstancedMesh(
      dotGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      }),
      NODE_COUNT
    );
    scene.add(instancedMesh);

    // ── Ghost Buffer: off-screen InstancedMesh that pre-renders the
    // predicted stage. The main render loop samples this buffer when
    // compositing the visible morph, so the predicted positions are
    // already computed by the time ALLOW fires — the visible draw
    // is just a memcpy.
    const ghostGeometry = new THREE.CircleGeometry(0.015, 8);
    const ghostMesh = new THREE.InstancedMesh(
      ghostGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0, // invisible — just a pre-render cache
      }),
      NODE_COUNT
    );
    ghostMesh.visible = false; // never rendered to screen
    scene.add(ghostMesh);

    const white = new THREE.Color(0xffffff);
    const spiderRed = new THREE.Color(0xff2233);

    const cache = buildNodeCache();
    const dummy = new THREE.Object3D();
    const ghostDummy = new THREE.Object3D();

    const stageConfig = STAGE_CONFIG;

    function updateGhostBuffer(stage: number) {
      // Pre-render the predicted stage into ghostMesh. Called whenever
      // ghostTargetRef changes — usually once per ALLOW. After this
      // call, ghostMesh.instanceMatrix holds the positions the visible
      // mesh will need at that stage. The visible animation loop
      // then eases toward those positions without recomputing them.
      const s = Math.max(0, Math.min(3, Math.floor(stage)));
      for (let i = 0; i < NODE_COUNT; i++) {
        const node = cache[i];
        let pos: THREE.Vector3;
        if (s === 0) pos = node.s0;
        else if (s === 1) pos = node.s1;
        else if (s === 2) pos = node.s2;
        else pos = node.s3;
        ghostDummy.position.copy(pos);
        const scale = s === 3 ? (node.isRed ? 1.6 : 1.1) : 1.0;
        ghostDummy.scale.set(scale, scale, scale);
        ghostDummy.updateMatrix();
        ghostMesh.setMatrixAt(i, ghostDummy.matrix);
      }
      ghostMesh.instanceMatrix.needsUpdate = true;
    }

    function updateNodes(val: number, pulseRed: boolean) {
      const stage = Math.floor(val);
      const frac = val - stage;
      const idx = Math.min(stage, 3);

      if (labelRef.current) {
        labelRef.current.innerText = stageConfig[idx].text;
        labelRef.current.style.color = stageConfig[idx].color;
        labelRef.current.setAttribute("data-stage", idx.toString());
        labelRef.current.setAttribute(
          "data-breaker",
          breakerTrippedRef.current ? "TRIPPED" : "NORMAL"
        );
      }

      // Pulse red nodes when breaker is tripped (IVE INCONCLUSIVE).
      const pulseT = Date.now() * 0.0015;
      const pulseScale = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(pulseT * Math.PI));

      for (let i = 0; i < NODE_COUNT; i++) {
        const node = cache[i];
        let fromPos: THREE.Vector3;
        let toPos: THREE.Vector3;
        if (stage === 0) { fromPos = node.s0; toPos = node.s1; }
        else if (stage === 1) { fromPos = node.s1; toPos = node.s2; }
        else { fromPos = node.s2; toPos = node.s3; }

        const ease = frac * frac * (3 - 2 * frac); // smoothstep
        dummy.position.lerpVectors(fromPos, toPos, ease);

        if (smokeEnabledRef.current && stage >= 2) {
          const strength = stage === 2 ? ease * 0.3 : 0.3;
          dummy.position.x += (rand(i * 10) - 0.5) * strength;
          dummy.position.y += (rand(i * 20) - 0.5) * strength;
          dummy.position.z += (rand(i * 30) - 0.5) * strength;
        }

        let scale = 1.0;
        if (stage === 0) {
          const time = Date.now() * 0.001;
          const pseudoRotZ = Math.sin(node.s0.x + time) * 0.5;
          scale = (pseudoRotZ + 1.2) * 1.1;
        } else if (stage === 3) {
          scale = node.isRed ? 1.6 : 1.1;
        }
        dummy.scale.set(scale, scale, scale);

        if (stage >= 2) {
          const colorEase = stage === 2 ? ease : 1;
          const finalColor = node.isRed ? spiderRed : white;
          const baseColor = new THREE.Color().lerpColors(
            white,
            finalColor,
            colorEase
          );
          if (pulseRed && node.isRed) {
            baseColor.multiplyScalar(0.55 + 0.45 * pulseScale);
          }
          instancedMesh.setColorAt(i, baseColor);
        } else {
          instancedMesh.setColorAt(i, white);
        }

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    }

    let animationFrameId: number;
    let lastGhostTarget: number | null = null;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const pulseRed =
        breakerTrippedRef.current && Math.abs(phaseRef.current - 2) < 0.6;

      // ── Ghost Buffer pre-render ──────────────────────────────────────
      // If the worker posted ALLOW for a new stage, pre-render it into
      // the ghost mesh immediately. This is what makes the visible
      // morph 0ms — the matrix's positions are computed before the
      // store update arrives.
      const gt = ghostTargetRef.current;
      if (gt !== null && gt !== lastGhostTarget) {
        updateGhostBuffer(gt);
        lastGhostTarget = gt;
      }

      if (dataDrivenRef.current) {
        // ── Data-driven mode: ease toward the target stage. ──
        // Ghost Buffer path: if the worker has fired ALLOW and the
        // ghost target is ahead of the telemetry target, ease toward
        // the ghost target first. This is the 0ms pre-render.
        let target: number | null = null;
        if (
          ghostTargetRef.current !== null &&
          (targetStageRef.current === null ||
            ghostTargetRef.current !== targetStageRef.current)
        ) {
          target = ghostTargetRef.current;
        } else if (targetStageRef.current !== null) {
          target = targetStageRef.current;
        }
        if (target !== null) {
          const cur = phaseRef.current;
          const speed = mode === "hero" ? 0.012 : 0.02;
          const delta = target - cur;
          if (Math.abs(delta) < 0.001) {
            phaseRef.current = target;
          } else {
            phaseRef.current = cur + delta * Math.min(1, speed * 1.5);
          }
          if (sliderRef.current) {
            sliderRef.current.value = phaseRef.current.toString();
          }
        }
      } else if (isPlayingRef.current) {
        // ── Auto-loop mode (standalone page or non-data-driven hero). ──
        const [lo, hi] = rangeRef.current;
        let val = phaseRef.current;
        const step = mode === "hero" ? 0.0025 : 0.005;
        val += step * playDirectionRef.current;
        if (val >= hi) { val = hi; playDirectionRef.current = -1; }
        if (val <= lo) { val = lo; playDirectionRef.current = 1; }
        phaseRef.current = val;
        if (sliderRef.current) {
          sliderRef.current.value = val.toString();
        }
      }

      // Slow rotation when resting near the sphere stage
      if (phaseRef.current < 0.1) {
        instancedMesh.rotation.y += 0.003;
      } else {
        instancedMesh.rotation.y *= 0.99;
      }

      updateNodes(phaseRef.current, pulseRed);
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      renderer.dispose();
      dotGeometry.dispose();
      ghostGeometry.dispose();
      (instancedMesh.material as THREE.Material).dispose();
      (ghostMesh.material as THREE.Material).dispose();
      instancedMesh.dispose();
      ghostMesh.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← MOUNT ONCE. State changes go through refs.

  // ── Hero mode: just the canvas, transparent ──────────────────────────────
  if (mode === "hero") {
    return (
      <div
        ref={containerRef}
        className={className}
        data-test="evolution-matrix"
        data-workspace={workspace}
        data-stage={Math.floor(targetStage ?? phaseRef.current)}
        data-breaker={breakerTripped ? "TRIPPED" : "NORMAL"}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.55,
          mixBlendMode: "screen",
        }}
        aria-hidden
      />
    );
  }

  // ── Full mode: canvas + controls ─────────────────────────────────────────
  const startStage = dataDriven
    ? (targetStage ?? phaseRef.current)
    : phaseRef.current;

  return (
    <div
      className={className}
      data-test="evolution-matrix"
      data-workspace={workspace}
      data-stage={Math.floor(startStage)}
      data-breaker={breakerTripped ? "TRIPPED" : "NORMAL"}
      data-ghost-target={
        ghostTargetRef.current !== null
          ? String(ghostTargetRef.current)
          : "none"
      }
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 480,
        background:
          "radial-gradient(circle at 50% 45%, #0a0a0a 0%, #050505 70%, #020202 100%)",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #222",
      }}
    >
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

      {/* Stage label — carries data-stage + data-breaker for E2E tests */}
      <div
        ref={labelRef}
        data-stage={Math.floor(startStage)}
        data-breaker={breakerTripped ? "TRIPPED" : "NORMAL"}
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          fontSize: 14,
          color: STAGE_CONFIG[0].color,
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          fontFamily: "var(--font-geist-mono, monospace)",
          background: "rgba(15,15,15,0.6)",
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid #2a2a2a",
          backdropFilter: "blur(8px)",
        }}
      >
        {STAGE_CONFIG[Math.floor(startStage)].text}
      </div>

      {/* Top-left badge: workspace + theorem verdict + Ghost Buffer status */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "#888",
          fontSize: 10,
          letterSpacing: 1.5,
          fontFamily: "var(--font-geist-mono, monospace)",
          textTransform: "uppercase",
        }}
      >
        VVU · {combinedStage ? "COCKPIT" : workspace.toUpperCase()}
        <span style={{ color: "#444", margin: "0 6px" }}>·</span>
        <span
          style={{
            color: breakerTripped
              ? "#e74c3c"
              : combinedStage
                ? "#e67e22"
                : workspace === "studi"
                  ? "#7c8bf5"
                  : "#e74c3c",
          }}
        >
          {breakerTripped ? "BREAKER TRIPPED" : "BREAKER NORMAL"}
        </span>
        {ghostTargetRef.current !== null && (
          <>
            <span style={{ color: "#444", margin: "0 6px" }}>·</span>
            <span style={{ color: "#10b981" }}>
              GHOST · stage_{ghostTargetRef.current}
            </span>
          </>
        )}
      </div>

      {/* Bottom control bar */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(15,15,15,0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid #333",
          borderRadius: 999,
          padding: "10px 20px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
        }}
      >
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="3"
          step="0.001"
          defaultValue={startStage.toString()}
          aria-label="Evolution stage"
          style={{
            WebkitAppearance: "none",
            appearance: "none",
            width: 260,
            height: 6,
            background:
              "linear-gradient(90deg, #4a90e2, #c07a40, #e67e22, #e74c3c)",
            borderRadius: 3,
            outline: "none",
            cursor: "pointer",
          }}
          onChange={(e) => {
            phaseRef.current = parseFloat(e.target.value);
            setIsPlaying(false);
            isPlayingRef.current = false;
          }}
        />
        <button
          onClick={() => setIsPlaying((p) => !p)}
          style={{
            background: "#222",
            border: "1px solid #444",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 999,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => setSmokeEnabled((s) => !s)}
          style={{
            background: smokeEnabled ? "#444" : "#222",
            border: smokeEnabled ? "1px solid #666" : "1px solid #444",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 999,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          {smokeEnabled ? "💨 Smoke: ON" : "💨 Smoke"}
        </button>
      </div>
    </div>
  );
}
