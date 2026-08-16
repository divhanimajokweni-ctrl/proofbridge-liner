"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/* ── VVU Brand Colors ── */
const STAGE_COLORS = {
  0: "#4a90e2", // Global Sphere - blue
  1: "#c9a84c", // Ant Mascot - gold
  2: "#e67e22", // Web Spider - orange
  3: "#ff4757", // Spider-Man - red
};

const NODE_COUNT = 650;

/* ── Deterministic Pseudo-Random ── */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/* ── Stage Position Generators ── */
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
  let isRedComponent = false;
  if (ratio < 0.12) {
    isRedComponent = true;
    const p = rand(i);
    const leg = i % 8;
    const a = (leg * Math.PI) / 4 + rand(i + 1) * 0.1;
    x = Math.cos(a) * (p * 0.25);
    y = 0.15 + Math.sin(a) * (p * 0.25);
  } else if (ratio < 0.18) {
    isRedComponent = true;
    const side = i % 2 === 0 ? 1 : -1;
    const p = rand(i);
    x = 0.1 * side + (rand(i + 1) - 0.5) * 0.05 + p * 0.04 * side;
    y = 0.52 + p * 0.12;
  } else if (ratio < 0.42) {
    const p = rand(i);
    if (rand(i + 1) > 0.4) {
      const a = rand(i + 2) * Math.PI * 2;
      const r = Math.sqrt(rand(i + 3)) * 0.24;
      x = r * Math.cos(a);
      y = 0.45 + r * Math.sin(a);
    } else {
      x = -0.15 - p * 0.65;
      y = 0.35 - Math.sin(p * Math.PI * 0.6) * 0.2;
    }
  } else if (ratio < 0.68) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.26;
    x = 0.15 + r * Math.cos(a) * 1.1;
    y = 0.15 + r * Math.sin(a);
  } else if (ratio < 0.86) {
    const p = rand(i);
    x = -0.6 + p * 0.5;
    y = -0.25 - Math.sin(p * Math.PI * 0.5) * 0.25;
  } else {
    const p = rand(i);
    x = 0.08 + p * 0.65;
    y = 0.05 - p * 0.55;
  }
  return { pos: new THREE.Vector3(x * 1.5, (y - 0.05) * 1.5, z), isRed: isRedComponent };
}

interface NodeCache {
  s0: THREE.Vector3;
  s1: THREE.Vector3;
  s2: THREE.Vector3;
  s3: THREE.Vector3;
  isRed: boolean;
  smokeDir: THREE.Vector3;
}

const stageLabels = [
  "0. GLOBAL SPHERE",
  "1. ANT MASCOT",
  "2. WEB SPIDER",
  "3. MILES SPIDER-MAN",
];

interface MorphingMatrixProps {
  className?: string;
}

export default function MorphingMatrix({ className = "" }: MorphingMatrixProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);

  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [smokeActive, setSmokeActive] = useState(false);

  const phaseRef = useRef(0);
  const forceRef = useRef(1.5);
  const isPlayingRef = useRef(false);
  const playDirRef = useRef(1);
  const smokeProgressRef = useRef(0);
  const smokeActiveRef = useRef(false);
  const cacheRef = useRef<NodeCache[]>([]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    smokeActiveRef.current = smokeActive;
  }, [smokeActive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ── Scene Setup ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /* ── Instanced Mesh ── */
    const dotGeometry = new THREE.CircleGeometry(0.015, 8);
    const instancedMesh = new THREE.InstancedMesh(
      dotGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
      NODE_COUNT
    );
    scene.add(instancedMesh);

    const white = new THREE.Color(0xffffff);
    const spiderRed = new THREE.Color(0xff2233);
    const dummy = new THREE.Object3D();

    /* ── Build Cache ── */
    const cache: NodeCache[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const spideyData = getSpideyPos(i);
      const angle = rand(i) * Math.PI * 2;
      const elevation = (rand(i + 1) - 0.5) * Math.PI;
      const speed = 0.8 + rand(i + 2) * 1.4;
      const blastDir = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed
      );
      cache.push({
        s0: getSpherePos(i),
        s1: getAntPos(i),
        s2: getWebSpiderPos(i),
        s3: spideyData.pos,
        isRed: spideyData.isRed,
        smokeDir: blastDir,
      });
    }
    cacheRef.current = cache;

    /* ── Update Nodes ── */
    function updateNodes(val: number) {
      const stageIdx = Math.floor(val);
      const frac = val - stageIdx;
      const configIndex = Math.min(stageIdx, 3);

      setStage(configIndex);

      if (smokeActiveRef.current && smokeProgressRef.current < 1.0) {
        smokeProgressRef.current += 0.02;
      } else if (!smokeActiveRef.current && smokeProgressRef.current > 0.0) {
        smokeProgressRef.current -= 0.025;
      }

      const smokeEase = Math.sin(smokeProgressRef.current * Math.PI * 0.5);
      const currentForce = forceRef.current;

      for (let i = 0; i < NODE_COUNT; i++) {
        const node = cache[i];
        let fromPos: THREE.Vector3, toPos: THREE.Vector3;
        if (stageIdx === 0) { fromPos = node.s0; toPos = node.s1; }
        else if (stageIdx === 1) { fromPos = node.s1; toPos = node.s2; }
        else { fromPos = node.s2; toPos = node.s3; }

        const ease = frac * frac * (3 - 2 * frac);

        const basePos = new THREE.Vector3();
        if (stageIdx < 2) { basePos.lerpVectors(fromPos, toPos, ease); }
        else { basePos.lerpVectors(fromPos, node.s3, stageIdx === 2 ? ease : 1); }

        if (smokeProgressRef.current > 0.001) {
          const blastOffset = node.smokeDir.clone().multiplyScalar(smokeEase * currentForce);
          basePos.add(blastOffset);
        }
        dummy.position.copy(basePos);

        let currentScale = 1.0;
        if (stageIdx === 0) {
          const time = Date.now() * 0.001;
          const pseudoRotZ = Math.sin(node.s0.x + time) * 0.5;
          currentScale = (pseudoRotZ + 1.2) * 1.1;
        } else if (stageIdx === 3) {
          currentScale = node.isRed ? 1.6 : 1.1;
        }

        if (smokeProgressRef.current > 0.001) {
          currentScale *= 1.0 - smokeEase * 0.85;
        }
        dummy.scale.set(currentScale, currentScale, currentScale);

        if (stageIdx >= 2) {
          const colorEase = stageIdx === 2 ? ease : 1;
          let finalColor = node.isRed ? spiderRed : white;
          if (smokeProgressRef.current > 0.001) {
            const smokeCloudColor = new THREE.Color(0x555555);
            finalColor = new THREE.Color().lerpColors(finalColor, smokeCloudColor, smokeEase);
          }
          instancedMesh.setColorAt(i, new THREE.Color().lerpColors(white, finalColor, colorEase));
        } else {
          if (smokeProgressRef.current > 0.001) {
            const smokeCloudColor = new THREE.Color(0x666666);
            instancedMesh.setColorAt(i, new THREE.Color().lerpColors(white, smokeCloudColor, smokeEase));
          } else {
            instancedMesh.setColorAt(i, white);
          }
        }
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    }

    /* ── Animation Loop ── */
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);

      if (isPlayingRef.current) {
        let currentVal = phaseRef.current;
        const oldStage = Math.floor(currentVal);
        currentVal += 0.004 * playDirRef.current;
        const newStage = Math.floor(currentVal);

        if (oldStage !== newStage && newStage >= 0 && newStage <= 3) {
          smokeProgressRef.current = 1.0;
          smokeActiveRef.current = false;
        }

        if (currentVal >= 3) { currentVal = 3; playDirRef.current = -1; }
        if (currentVal <= 0) { currentVal = 0; playDirRef.current = 1; }
        phaseRef.current = currentVal;
      }

      updateNodes(phaseRef.current);
      renderer.render(scene, camera);
    }
    animate();

    /* ── Resize ── */
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      dotGeometry.dispose();
      (instancedMesh.material as THREE.Material).dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handlePhaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    phaseRef.current = parseFloat(e.target.value);
    setIsPlaying(false);
  }, []);

  const handleForceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    forceRef.current = parseFloat(e.target.value);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const toggleSmoke = useCallback(() => {
    setSmokeActive((s) => !s);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Overlay Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
        bg-[rgba(10,11,14,0.92)] backdrop-blur-xl border border-[#1f232e]
        rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl">

        {/* Stage Label */}
        <div
          className="font-bold tracking-wider text-xs uppercase min-w-[160px] text-center transition-colors duration-300"
          style={{ color: STAGE_COLORS[stage as keyof typeof STAGE_COLORS] }}
        >
          {stageLabels[stage]}
        </div>

        {/* Timeline Slider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-[#6b7280] tracking-wider font-bold">
            TIMELINE
          </span>
          <input
            type="range"
            min="0"
            max="3"
            step="0.001"
            defaultValue="0"
            onChange={handlePhaseChange}
            className="w-48 h-1.5 rounded-full appearance-none cursor-pointer
              bg-gradient-to-r from-[#4a90e2] via-[#c9a84c] via-[#e67e22] to-[#ff4757]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Force Slider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-[#6b7280] tracking-wider font-bold">
            BLAST
          </span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            defaultValue="1.5"
            onChange={handleForceChange}
            className="w-24 h-1.5 rounded-full appearance-none cursor-pointer bg-[#2d3039]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Play Button */}
        <button
          onClick={togglePlay}
          className="bg-[#12141a] border border-[#2d3039] text-[#f0f2f5] px-4 py-2 rounded-xl
            text-xs font-bold hover:bg-[#1c2028] transition-colors cursor-pointer"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        {/* Smoke Button */}
        <button
          onClick={toggleSmoke}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border
            ${smokeActive
              ? "bg-[#ff4757] border-[#ff6b6b] text-white"
              : "bg-[#12141a] border-[#2d3039] text-[#f0f2f5] hover:bg-[#1c2028]"
            }`}
        >
          {smokeActive ? "💥 Condense" : "💨 Blast"}
        </button>
      </div>
    </div>
  );
}
