"use client";

/**
 * Sports Track — 3D football pitch + 22 player dots + 120 events.
 *
 * Port A: render the pitch + player dots IMMEDIATELY on mount.
 * Port B: when the verification map resolves, color each dot by its EIS
 *         state. Anomalous players pulse; events are drawn as small markers
 *         on the pitch at the current scrubber time.
 *
 * The 4D timeline scrubber below the pitch lets the user scrub the match.
 * The UI MUST stay interactive throughout — scrubbing + orbiting both work
 * during the 3s verification window.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { StudyArtifact } from "@/lib/study/artifacts";
import { EIS_HEX } from "@/lib/study/artifacts";
import type { VerificationState } from "@/lib/eis/types";

interface Props {
  artifact: StudyArtifact;
  verifications: Map<string, VerificationState>;
  verifying: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
}

interface ComponentMesh {
  mesh: THREE.Mesh;
  baseColor: THREE.Color;
  componentId: string;
  anomaly?: { kind: string; description: string };
}

export function SportsTrack({
  artifact,
  verifications,
  verifying,
  selected,
  onSelect,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshByIdRef = useRef<Map<string, ComponentMesh>>(new Map());
  const [timeSeconds, setTimeSeconds] = useState(0);
  const timeRef = useRef(0);
  const stateRef = useRef({
    verifications: new Map() as Map<string, VerificationState>,
    selected: null as string | null,
    time: 0,
  });

  useEffect(() => {
    stateRef.current.verifications = verifications;
    for (const [id, cm] of meshByIdRef.current) {
      const state = verifications.get(id);
      const targetColor = state
        ? new THREE.Color(EIS_HEX[state])
        : cm.baseColor.clone();
      cm.mesh.userData.targetColor = targetColor;
    }
  }, [verifications]);

  useEffect(() => {
    stateRef.current.selected = selected;
  }, [selected]);

  useEffect(() => {
    stateRef.current.time = timeSeconds;
  }, [timeSeconds]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ─── Scene + camera + renderer ────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x052e16);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 14, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.5);
    sun.position.set(8, 16, 8);
    scene.add(sun);

    // ─── Pitch ─────────────────────────────────────────────────────────
    const pitchGeo = new THREE.PlaneGeometry(20, 12);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 1,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);
    // Pitch lines (white border)
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(20, 0.01, 12)),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    border.position.y = 0.02;
    scene.add(border);
    // Center line
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.021;
    scene.add(centerLine);

    // ─── Players + events (Port A) ──────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);
    meshByIdRef.current = new Map();

    for (const c of artifact.components) {
      const isPlayer = c.kind === "player";
      const isEvent = c.kind === "event";
      if (!isPlayer && !isEvent) continue;
      const radius = isPlayer ? 0.4 : 0.15;
      const geo = new THREE.SphereGeometry(radius, 16, 12);
      const baseColor = new THREE.Color(c.base.color);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...c.base.position);
      mesh.userData.componentId = c.id;
      mesh.userData.targetColor = baseColor.clone();
      mesh.userData.visible = !isEvent; // events hidden until scrubbed to their time
      mesh.visible = mesh.userData.visible;
      group.add(mesh);

      meshByIdRef.current.set(c.id, {
        mesh,
        baseColor,
        componentId: c.id,
        anomaly: c.anomaly,
      });
    }

    // ─── Pointer orbit ──────────────────────────────────────────────────
    let theta = 0;
    let phi = Math.PI / 3;
    let radius = 18;
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * 0.008;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - dy * 0.008));
      updateCamera();
    };
    const onUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(8, Math.min(40, radius + e.deltaY * 0.03));
      updateCamera();
    };
    const onClick = (e: MouseEvent) => {
      if (isDragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(group.children, false);
      if (hits[0]) {
        const id = hits[0].object.userData.componentId as string;
        if (id) onSelect(id);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    // ─── Render loop ────────────────────────────────────────────────────
    let raf = 0;
    const animate = () => {
      const t = performance.now();
      // Show events whose timestamp is within ±2s of the scrubber
      const currentT = stateRef.current.time;
      for (const [id, cm] of meshByIdRef.current) {
        const meta = artifact.components.find((c) => c.id === id)?.base.meta as
          | { t?: number }
          | undefined;
        if (meta?.t !== undefined) {
          // Event — show within 2-second window around scrubber
          const visible = Math.abs(meta.t - currentT) < 2;
          cm.mesh.visible = visible;
          if (visible) {
            // Pulse — closer to scrubber = brighter
            const closeness = 1 - Math.abs(meta.t - currentT) / 2;
            cm.mesh.scale.setScalar(0.5 + closeness * 1.5);
          }
        }
        // Lerp toward target color (Port B overlay)
        const mat = cm.mesh.material as THREE.MeshStandardMaterial;
        const target = cm.mesh.userData.targetColor as THREE.Color;
        if (target) mat.color.lerp(target, 0.08);
        // Anomaly pulse
        if (cm.anomaly) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.005);
          const baseEm = stateRef.current.selected === id ? 0.4 : 0;
          mat.emissiveIntensity = baseEm + pulse * 0.25;
          const state = stateRef.current.verifications.get(id);
          const pulseColor = state
            ? new THREE.Color(EIS_HEX[state])
            : new THREE.Color(0xef4444);
          mat.emissive.lerp(pulseColor, 0.08);
        } else if (stateRef.current.selected === id) {
          mat.emissiveIntensity = 0.4;
          mat.emissive.lerp(new THREE.Color(0x0ea5e9), 0.1);
        } else {
          mat.emissiveIntensity *= 0.92;
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      meshByIdRef.current.clear();
    };
  }, [artifact, onSelect]);

  const duration = artifact.durationSeconds ?? 5400;

  return (
    <div className="flex flex-col h-full">
      <div ref={mountRef} className="flex-1 min-h-[400px]" />
      {/* Timeline scrubber */}
      <div className="px-4 py-3 border-t bg-background/95">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            {Math.floor(timeSeconds / 60)}:
            {String(Math.floor(timeSeconds) % 60).padStart(2, "0")}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            step={1}
            value={timeSeconds}
            onChange={(e) => setTimeSeconds(parseInt(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <span className="text-xs font-mono text-muted-foreground">
            {Math.floor(duration / 60)}:00
          </span>
          <button
            className="text-xs px-2 py-1 rounded border"
            onClick={() => setTimeSeconds(0)}
          >
            Reset
          </button>
        </div>
        {/* Current event indicator */}
        {(() => {
          const current = artifact.timeline?.find(
            (e) => Math.abs(e.t - timeSeconds) < 2
          );
          if (!current) return null;
          return (
            <div className="mt-2 text-xs text-muted-foreground">
              Event at {Math.floor(current.t / 60)}:
              {String(current.t % 60).padStart(2, "0")} — {current.label}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
