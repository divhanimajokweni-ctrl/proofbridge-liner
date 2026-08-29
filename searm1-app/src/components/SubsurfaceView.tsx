import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Pipe } from "../lib/engine";

export interface SubsurfaceHandle {
  updatePipes(pipes: Pipe[], selectedId: string | null): void;
  resetView(): void;
}

const WORLD_SCALE = 1000; // degrees -> scene units (grid spans +/-24 units)
const PIPE_LENGTH = 8; // scene units between grid nodes (BLOCK * WORLD_SCALE)
const PIPE_RADIUS = 0.22;
const DEPTH_SCALE = 3; // metres below surface -> scene units (exaggerated)

const C_NORMAL = 0x475569;
const C_CANDIDATE = 0xfbbf24;
const C_VERIFIED = 0x34d399;
const C_SELECTED = 0x38bdf8;
const C_LEAK = 0x22d3ee;
const C_BG = 0x0f172a;

// Respect prefers-reduced-motion: keep rings steady instead of pulsing.
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface PipeVisual {
  mesh: THREE.Mesh;
  ring: THREE.Mesh;
}

function pipeColor(pipe: Pipe): number {
  if (pipe.isLeak) return C_LEAK;
  if (pipe.category === "VERIFIED") return C_VERIFIED;
  if (pipe.category === "CANDIDATE") return C_CANDIDATE;
  return C_NORMAL;
}

/** Build a pipe cylinder + its glow ring at the pipe's subsurface depth. */
function createPipeVisual(pipe: Pipe, ringMats: THREE.MeshBasicMaterial[]): PipeVisual {
  const geometry = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, PIPE_LENGTH, 6, 1, false);
  const material = new THREE.MeshStandardMaterial({
    color: pipeColor(pipe),
    roughness: 0.5,
    metalness: 0.3,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const x = pipe.midX * WORLD_SCALE;
  const y = -pipe.depthM * DEPTH_SCALE;
  const z = pipe.midY * WORLD_SCALE;
  mesh.position.set(x, y, z);
  // Align the cylinder's Y axis to the pipe direction in the X-Z plane.
  if (pipe.kind === "H") mesh.rotation.z = -Math.PI / 2;
  else mesh.rotation.x = Math.PI / 2;

  const ringGeo = new THREE.RingGeometry(0.62, 0.88, 40);
  const ringMat = new THREE.MeshBasicMaterial({
    color: C_VERIFIED,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y, z);
  ring.visible = false;
  ringMat.userData = { mesh: ring, ringVisible: false, baseOpacity: 0.55 };
  ringMats.push(ringMat);

  return { mesh, ring };
}

const SubsurfaceView = forwardRef<SubsurfaceHandle>(function SubsurfaceView(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pipesGroupRef = useRef<THREE.Group | null>(null);
  const visualsRef = useRef<Map<string, PipeVisual>>(new Map());
  const ringMatsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const updateVisuals = useCallback((pipes: Pipe[], selectedId: string | null) => {
    const group = pipesGroupRef.current;
    if (!group) return;
    for (const pipe of pipes) {
      let vis = visualsRef.current.get(pipe.id);
      if (!vis) {
        vis = createPipeVisual(pipe, ringMatsRef.current);
        visualsRef.current.set(pipe.id, vis);
        group.add(vis.mesh, vis.ring);
      }
      const selected = pipe.id === selectedId;
      const mat = vis.mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(pipeColor(pipe));
      mat.emissive.setHex(selected ? C_SELECTED : pipe.isLeak ? C_LEAK : 0x000000);
      mat.emissiveIntensity = selected ? 0.5 : pipe.isLeak ? 0.25 : 0;

      const ringMat = vis.ring.material as THREE.MeshBasicMaterial;
      const showRing = pipe.isLeak || pipe.category === "VERIFIED" || selected;
      vis.ring.visible = showRing;
      ringMat.userData.ringVisible = showRing;
      if (showRing) {
        ringMat.color.setHex(pipe.isLeak ? C_LEAK : selected ? C_SELECTED : C_VERIFIED);
        ringMat.userData.baseOpacity = pipe.isLeak ? 0.8 : 0.55;
      }
    }
    // Remove visuals for pipes that no longer exist (not expected in this demo).
    for (const [id, vis] of visualsRef.current) {
      if (!pipes.some((p) => p.id === id)) {
        group.remove(vis.mesh, vis.ring);
        vis.mesh.geometry.dispose();
        (vis.mesh.material as THREE.Material).dispose();
        vis.ring.geometry.dispose();
        (vis.ring.material as THREE.Material).dispose();
        visualsRef.current.delete(id);
      }
    }
  }, []);

  const resetView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(0, 34, 44);
    controls.target.set(0, -3, 0);
    controls.update();
  }, []);

  useImperativeHandle(ref, () => ({ updatePipes: updateVisuals, resetView }), [
    updateVisuals,
    resetView,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C_BG);
    scene.fog = new THREE.Fog(C_BG, 70, 150);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    camera.position.set(0, 34, 44);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(C_BG);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 12;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.target.set(0, -3, 0);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(28, 42, 24);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x38bdf8, 0.55);
    fill.position.set(-28, 12, -22);
    scene.add(fill);

    // Ground plane + grid (earth surface)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(72, 72),
      new THREE.MeshStandardMaterial({
        color: 0x0e1728,
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    const grid = new THREE.GridHelper(64, 16, 0x1e293b, 0x16233b);
    grid.position.y = 0.06;
    scene.add(grid);

    const pipesGroup = new THREE.Group();
    scene.add(pipesGroup);
    pipesGroupRef.current = pipesGroup;

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const phase = (Math.sin(t * 2.4) + 1) / 2; // 0..1
      for (const mat of ringMatsRef.current) {
        if (!mat.userData.ringVisible) {
          mat.opacity = 0;
          continue;
        }
        if (REDUCED_MOTION) {
          mat.opacity = mat.userData.baseOpacity ?? 0.6;
          mat.userData.mesh.scale.set(1, 1, 1);
          continue;
        }
        const scale = 0.9 + 0.9 * phase;
        mat.userData.mesh.scale.set(scale, scale, 1);
        mat.opacity = (mat.userData.baseOpacity ?? 0.6) * (0.45 + 0.55 * phase);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      visualsRef.current.clear();
      ringMatsRef.current = [];
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      pipesGroupRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden" />;
});

export default SubsurfaceView;
