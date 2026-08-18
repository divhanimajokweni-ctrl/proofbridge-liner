"use client";

/**
 * Engineering Track — 3D CAD building (three.js, raw).
 *
 * Port A: render columns / beams / slab in neutral grey IMMEDIATELY on mount.
 * Port B: when the verification map resolves, lerp each component's color
 *         toward its EIS state color. Anomalous components pulse.
 *
 * The UI stays interactive throughout — OrbitControls-style rotation via
 * pointer drag, wheel to zoom. Even while IVE is running, the user can
 * orbit the building.
 */

import { useEffect, useRef } from "react";
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

export function EngineeringTrack({
  artifact,
  verifications,
  verifying,
  selected,
  onSelect,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshByIdRef = useRef<Map<string, ComponentMesh>>(new Map());
  const stateRef = useRef({
    verifications: new Map() as VerificationMap,
    selected: null as string | null,
  });

  // Keep the ref state in sync with prop changes
  useEffect(() => {
    stateRef.current.verifications = verifications;
    // Trigger color update on existing meshes
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
    for (const [id, cm] of meshByIdRef.current) {
      const isSelected = id === selected;
      const mat = (cm.mesh.material as THREE.MeshStandardMaterial);
      mat.emissive.setHex(isSelected ? 0x0ea5e9 : 0x000000);
      mat.emissiveIntensity = isSelected ? 0.4 : 0;
    }
  }, [selected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ─── Scene + camera + renderer ────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(10, 7, 10);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(8, 12, 6);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x88ccff, 0.25);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    // Ground grid
    const grid = new THREE.GridHelper(20, 20, 0x1e293b, 0x1e293b);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.4;
    scene.add(grid);

    // ─── Build meshes from the artifact (Port A) ────────────────────────
    const group = new THREE.Group();
    scene.add(group);
    meshByIdRef.current = new Map();

    for (const c of artifact.components) {
      const geo = new THREE.BoxGeometry(
        c.base.scale?.[0] ?? 1,
        c.base.scale?.[1] ?? 1,
        c.base.scale?.[2] ?? 1
      );
      const baseColor = new THREE.Color(c.base.color);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        roughness: 0.85,
        metalness: c.kind === "beam" ? 0.4 : 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...c.base.position);
      mesh.userData.componentId = c.id;
      mesh.userData.targetColor = baseColor.clone();
      group.add(mesh);

      meshByIdRef.current.set(c.id, {
        mesh,
        baseColor,
        componentId: c.id,
        anomaly: c.anomaly,
      });
    }

    // ─── Pointer-based orbit control (no extra dep) ─────────────────────
    let theta = Math.atan2(camera.position.x, camera.position.z);
    let phi = Math.acos(camera.position.y / camera.position.length());
    let radius = camera.position.length();
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 1.5, 0);
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
      theta -= dx * 0.01;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - dy * 0.01));
      updateCamera();
    };
    const onUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(4, Math.min(30, radius + e.deltaY * 0.02));
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
      // Lerp colors toward target (Port B overlay)
      const t = performance.now();
      for (const [, cm] of meshByIdRef.current) {
        const mat = cm.mesh.material as THREE.MeshStandardMaterial;
        const target = cm.mesh.userData.targetColor as THREE.Color;
        if (target) {
          mat.color.lerp(target, 0.08);
        }
        // Anomaly pulse
        if (cm.anomaly) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.005);
          mat.emissiveIntensity = (stateRef.current.selected === cm.componentId ? 0.4 : 0)
            + pulse * 0.25;
          const state = stateRef.current.verifications.get(cm.componentId);
          const pulseColor = state
            ? new THREE.Color(EIS_HEX[state])
            : new THREE.Color(0xef4444);
          mat.emissive.lerp(pulseColor, 0.08);
        }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // Resize
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

  return <div ref={mountRef} className="w-full h-full" />;
}

type VerificationMap = Map<string, VerificationState>;
