'use client';

/**
 * Villa Ravine — procedural 3D scene
 * ----------------------------------
 * Terrain plane with displaced vertices (including a ravine strip), a box
 * villa with a cone roof, 2–3 trees (cylinder trunk + cone foliage), and
 * 11 camera presets (Day / Night / Section / Floor Plan + Cameras 5–11).
 *
 * Same Three.js setup pattern as src/components/evidence/hbk-viewport.tsx:
 * useEffect once-only init, useRef for canvas/scene/renderer, ResizeObserver
 * for responsive sizing, full cleanup on unmount.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Camera, Sun, Moon, Scissors, Grid3x3 } from 'lucide-react';

type CameraId =
  | 'day'
  | 'night'
  | 'section'
  | 'floorplan'
  | 'cam5'
  | 'cam6'
  | 'cam7'
  | 'cam8'
  | 'cam9'
  | 'cam10'
  | 'cam11';

interface CameraPreset {
  id: CameraId;
  label: string;
  icon?: typeof Camera;
}

const CAMERAS: CameraPreset[] = [
  { id: 'day', label: 'Day View', icon: Sun },
  { id: 'night', label: 'Night View', icon: Moon },
  { id: 'section', label: 'Section', icon: Scissors },
  { id: 'floorplan', label: 'Floor Plan', icon: Grid3x3 },
  { id: 'cam5', label: 'Camera 5' },
  { id: 'cam6', label: 'Camera 6' },
  { id: 'cam7', label: 'Camera 7' },
  { id: 'cam8', label: 'Camera 8' },
  { id: 'cam9', label: 'Camera 9' },
  { id: 'cam10', label: 'Camera 10' },
  { id: 'cam11', label: 'Camera 11' },
];

// 11 distinct orbit positions — angled cinematic viewpoints
const CAMERA_POSITIONS: Record<CameraId, { pos: [number, number, number]; target: [number, number, number]; ortho?: boolean; clip?: boolean }> = {
  day:        { pos: [12, 8, 12], target: [0, 1, 0] },
  night:      { pos: [10, 7, 10], target: [0, 1, 0] },
  section:    { pos: [14, 3, 0],  target: [0, 0, 0], clip: true },
  floorplan:  { pos: [0, 22, 0.001], target: [0, 0, 0], ortho: true },
  cam5:       { pos: [-12, 6, 12], target: [0, 1, 0] },
  cam6:       { pos: [12, 6, -12], target: [0, 1, 0] },
  cam7:       { pos: [-12, 6, -12], target: [0, 1, 0] },
  cam8:       { pos: [0, 4, 16], target: [0, 1, 0] },
  cam9:       { pos: [16, 4, 0], target: [0, 1, 0] },
  cam10:      { pos: [0, 16, 12], target: [0, 0, 0] },
  cam11:      { pos: [-8, 2, 14], target: [0, 1, 0] },
};

export default function VillaRavine() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const perspCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCamRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const nightLightsRef = useRef<THREE.PointLight[]>([]);
  const villaGroupRef = useRef<THREE.Group | null>(null);
  const treesRef = useRef<THREE.Group | null>(null);
  const sectionClipRef = useRef<THREE.Plane | null>(null);
  const rendererClipsRef = useRef<THREE.Plane[]>([]);
  const animationRef = useRef<number | null>(null);
  const activeCamIdRef = useRef<CameraId>('day');

  const [activeCam, setActiveCam] = useState<CameraId>('day');

  // Apply a camera preset (position, target, optional ortho + section clip)
  const applyCamera = (id: CameraId) => {
    const preset = CAMERA_POSITIONS[id];
    if (!preset) return;
    const renderer = rendererRef.current;
    const mount = mountRef.current;
    if (!renderer || !mount) return;

    // Toggle section clip plane
    if (preset.clip) {
      if (sectionClipRef.current) {
        sectionClipRef.current.normal.set(-1, 0, 0);
        sectionClipRef.current.constant = 0;
      }
      rendererClipsRef.current = sectionClipRef.current ? [sectionClipRef.current] : [];
    } else {
      rendererClipsRef.current = [];
    }
    renderer.localClippingEnabled = rendererClipsRef.current.length > 0;
    // Apply to all materials in scene
    sceneRef.current?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material;
        const apply = (m: THREE.Material) => {
          (m as THREE.MeshPhongMaterial).clippingPlanes = rendererClipsRef.current;
          (m as THREE.MeshPhongMaterial).clipShadows = true;
        };
        if (Array.isArray(mat)) mat.forEach(apply);
        else apply(mat);
      }
    });

    // Switch camera + reset controls target
    const isOrtho = !!preset.ortho;
    const cam = isOrtho ? orthoCamRef.current : perspCamRef.current;
    const other = isOrtho ? perspCamRef.current : orthoCamRef.current;
    if (!cam || !controlsRef.current) return;

    cam.position.set(...preset.pos);
    cam.lookAt(new THREE.Vector3(...preset.target));
    controlsRef.current.object = cam;
    controlsRef.current.target.set(...preset.target);
    controlsRef.current.update();

    // Hide the other camera (we only render with `cam`)
    if (other) other.visible = false;
    cam.visible = true;

    // Lighting transitions
    if (id === 'night') {
      if (ambientRef.current) ambientRef.current.intensity = 0.25;
      if (dirLightRef.current) {
        dirLightRef.current.intensity = 0.18;
        dirLightRef.current.color.setHex(0x223355);
      }
      sceneRef.current!.background = new THREE.Color(0x040810);
      sceneRef.current!.fog = new THREE.Fog(0x040810, 12, 38);
      nightLightsRef.current.forEach((l) => (l.visible = true));
    } else if (id === 'day') {
      if (ambientRef.current) ambientRef.current.intensity = 0.75;
      if (dirLightRef.current) {
        dirLightRef.current.intensity = 0.95;
        dirLightRef.current.color.setHex(0xffffff);
      }
      sceneRef.current!.background = new THREE.Color(0x8fb5d8);
      sceneRef.current!.fog = new THREE.Fog(0x8fb5d8, 18, 45);
      nightLightsRef.current.forEach((l) => (l.visible = false));
    } else {
      // Section / floor plan / cinematic — moderate lighting
      if (ambientRef.current) ambientRef.current.intensity = 0.55;
      if (dirLightRef.current) {
        dirLightRef.current.intensity = 0.7;
        dirLightRef.current.color.setHex(0xffffff);
      }
      sceneRef.current!.background = new THREE.Color(0x16242e);
      sceneRef.current!.fog = new THREE.Fog(0x16242e, 15, 42);
      nightLightsRef.current.forEach((l) => (l.visible = false));
    }

    // Resize the active camera to current viewport
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (isOrtho && orthoCamRef.current) {
      const o = orthoCamRef.current;
      const aspect = width / Math.max(1, height);
      const frustum = 14;
      o.left = -frustum * aspect;
      o.right = frustum * aspect;
      o.top = frustum;
      o.bottom = -frustum;
      o.updateProjectionMatrix();
    } else if (!isOrtho && perspCamRef.current) {
      perspCamRef.current.aspect = width / Math.max(1, height);
      perspCamRef.current.updateProjectionMatrix();
    }
  };

  useEffect(() => {
    activeCamIdRef.current = activeCam;
    applyCamera(activeCam);
  }, [activeCam]);

  // Scene init — runs once on mount
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8fb5d8);
    scene.fog = new THREE.Fog(0x8fb5d8, 18, 45);
    sceneRef.current = scene;

    // Two cameras — perspective for cinematic, orthographic for floor plan
    const perspCam = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    perspCam.position.set(12, 8, 12);
    perspCam.lookAt(0, 1, 0);
    perspCamRef.current = perspCam;

    const orthoCam = new THREE.OrthographicCamera(-14, 14, 14, -14, 0.1, 200);
    orthoCam.position.set(0, 22, 0.001);
    orthoCam.lookAt(0, 0, 0);
    orthoCam.visible = false;
    orthoCamRef.current = orthoCam;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = false;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // OrbitControls — always on, attached to the active camera
    const controls = new OrbitControls(perspCam, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0x9ab4c8, 0.75);
    scene.add(ambient);
    ambientRef.current = ambient;

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(10, 14, 8);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Night lights — point lights at windows / porch
    const nightLights: THREE.PointLight[] = [];
    const warmLight = new THREE.PointLight(0xffb800, 1.4, 12);
    warmLight.position.set(0, 2, 1.5);
    warmLight.visible = false;
    scene.add(warmLight);
    nightLights.push(warmLight);
    const coolLight = new THREE.PointLight(0x00d4ff, 0.8, 14);
    coolLight.position.set(-3, 1.5, -3);
    coolLight.visible = false;
    scene.add(coolLight);
    nightLights.push(coolLight);
    nightLightsRef.current = nightLights;

    // Section clip plane (used by "section" preset)
    const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    sectionClipRef.current = clipPlane;

    // ─── Terrain (procedurally displaced plane with ravine gap) ─────────
    const TERRAIN_SIZE = 30;
    const TERRAIN_SEG = 48;
    const terrainGeo = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEG,
      TERRAIN_SEG,
    );
    terrainGeo.rotateX(-Math.PI / 2);
    const positions = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      // Base rolling height — sum of low-freq sinusoids
      let y =
        Math.sin(x * 0.35) * 0.4 +
        Math.cos(z * 0.28) * 0.5 +
        Math.sin((x + z) * 0.15) * 0.3;

      // Ravine: a strip along z=-2..+2 lowered sharply
      const ravineDist = Math.abs(z);
      if (ravineDist < 2.5) {
        const t = ravineDist / 2.5; // 0 at center, 1 at edge
        const ravineDepth = (1 - t * t) * 3.5;
        y -= ravineDepth;
      }
      // Flatten the building pad near origin (x in [-2,2], z outside ravine)
      if (Math.abs(x) < 2.6 && Math.abs(z) > 3.0 && Math.abs(z) < 5.5) {
        y *= 0.15;
      }
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshPhongMaterial({
      color: 0x3f5a3a,
      flatShading: false,
      shininess: 4,
      side: THREE.DoubleSide,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Subtle grid overlay
    const grid = new THREE.GridHelper(TERRAIN_SIZE, 30, 0x2a4458, 0x1a2732);
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.02;
    scene.add(grid);

    // ─── Villa — box body + cone roof + interior floor ─────────────────
    const villa = new THREE.Group();
    villa.position.set(0, 0, 4.2);
    scene.add(villa);
    villaGroupRef.current = villa;

    const wallMat = new THREE.MeshPhongMaterial({
      color: 0xcfb892,
      flatShading: false,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.4), wallMat);
    body.position.y = 1.0;
    villa.add(body);

    // Foundation
    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.3, 2.8),
      new THREE.MeshPhongMaterial({ color: 0x4a4a4a }),
    );
    foundation.position.y = 0.0;
    villa.add(foundation);

    // Roof — cone
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 1.4, 4),
      new THREE.MeshPhongMaterial({ color: 0x6b2e2e }),
    );
    roof.position.y = 2.7;
    roof.rotation.y = Math.PI / 4;
    villa.add(roof);

    // Windows — small emissive planes so they glow at night
    const windowMat = new THREE.MeshPhongMaterial({
      color: 0xffe08a,
      emissive: 0xffb800,
      emissiveIntensity: 0.6,
    });
    const win1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.7), windowMat);
    win1.position.set(-0.6, 1.2, 1.21);
    villa.add(win1);
    const win2 = win1.clone();
    win2.position.set(0.6, 1.2, 1.21);
    villa.add(win2);
    const win3 = win1.clone();
    win3.rotation.y = Math.PI / 2;
    win3.position.set(1.51, 1.2, 0);
    villa.add(win3);

    // Door
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 1.2),
      new THREE.MeshPhongMaterial({ color: 0x3b2a1a }),
    );
    door.position.set(0, 0.6, 1.21);
    villa.add(door);

    // ─── Trees (cylinder trunk + cone foliage) ─────────────────────────
    const trees = new THREE.Group();
    scene.add(trees);
    treesRef.current = trees;

    const treePositions: [number, number][] = [
      [5, 7],
      [-6, -5],
      [7, -6],
      [-7, 6],
    ];
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x4a2f1a });
    const foliageMats = [
      new THREE.MeshPhongMaterial({ color: 0x2f5a2a }),
      new THREE.MeshPhongMaterial({ color: 0x3f6a35 }),
    ];
    treePositions.forEach(([tx, tz], i) => {
      // Skip trees that fall in the ravine
      if (Math.abs(tz) < 2.5) return;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8),
        trunkMat,
      );
      trunk.position.set(tx, 0.6, tz);
      trees.add(trunk);

      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 1.8, 8),
        foliageMats[i % foliageMats.length],
      );
      foliage.position.set(tx, 1.8, tz);
      trees.add(foliage);
    });

    // ─── Ravine "stream" — flat blue plane in the lowered strip ────────
    const streamGeo = new THREE.PlaneGeometry(30, 4);
    streamGeo.rotateX(-Math.PI / 2);
    const stream = new THREE.Mesh(
      streamGeo,
      new THREE.MeshPhongMaterial({
        color: 0x1a4a6a,
        transparent: true,
        opacity: 0.85,
        emissive: 0x0a2230,
        shininess: 80,
      }),
    );
    stream.position.set(0, -2.4, 0);
    scene.add(stream);

    // Initial camera setup
    const handleResize = () => {
      if (!mount || !renderer) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      perspCam.aspect = width / Math.max(1, height);
      perspCam.updateProjectionMatrix();
      const aspect = width / Math.max(1, height);
      const frustum = 14;
      orthoCam.left = -frustum * aspect;
      orthoCam.right = frustum * aspect;
      orthoCam.top = frustum;
      orthoCam.bottom = -frustum;
      orthoCam.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // Animation loop — picks active camera each frame
    const clock = new THREE.Clock();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Subtle foliage sway
      treesRef.current?.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh) {
          const geo = child.geometry;
          // Sway the foliage cones (the second of each pair)
          if (geo instanceof THREE.ConeGeometry) {
            child.rotation.z = Math.sin(t * 0.8 + idx) * 0.04;
          }
        }
      });

      // Controls update + render with active camera
      if (controlsRef.current) controlsRef.current.update();
      const id = activeCamIdRef.current;
      const cam = CAMERA_POSITIONS[id]?.ortho ? orthoCam : perspCam;
      renderer.render(scene, cam);
    };
    animate();

    // Apply default camera preset after init
    applyCamera('day');

    // Cleanup
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 p-4 h-full">
      {/* 3D viewport */}
      <div className="relative k-card p-0 overflow-hidden min-h-[400px] lg:min-h-[560px]">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <Camera className="h-4 w-4 k-cyan" />
          <span className="text-xs k-card-title m-0">VILLA RAVINE · 11 CAMERAS</span>
        </div>
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
          <span className="k-badge k-badge-warn">PARTIAL</span>
          <span className="k-badge k-badge-dim">{CAMERAS.length} CAMS</span>
        </div>
        <div ref={mountRef} className="w-full h-full" style={{ minHeight: '400px' }} />

        {/* Camera label overlay (bottom) */}
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded bg-[var(--k-bg-elevated)]/80 border border-[var(--k-line)]">
          <span className="text-[10px] k-dim uppercase tracking-widest">Active</span>
          <span className="ml-2 text-xs k-cyan font-bold">
            {CAMERAS.find((c) => c.id === activeCam)?.label}
          </span>
        </div>
      </div>

      {/* Camera selector sidebar */}
      <div className="flex flex-col gap-4">
        <div className="k-card">
          <div className="k-card-title">CAMERA SELECT</div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {CAMERAS.map((c) => {
              const Icon = c.icon;
              const isActive = c.id === activeCam;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCam(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-[var(--k-cyan-bright)] text-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.08)]'
                      : 'border-[var(--k-line)] text-[var(--k-fg)] hover:border-[var(--k-line-strong)] hover:text-[var(--k-fg-bright)]'
                  }`}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                  {c.label}
                </button>
              );
            })}
          </div>

          <Separator className="my-3" />

          <div className="flex flex-col gap-1 text-[10px] k-dim uppercase tracking-wider">
            <span>
              <Sun className="inline h-3 w-3 mr-1 k-warn" /> Day · bright sky + sun
            </span>
            <span>
              <Moon className="inline h-3 w-3 mr-1 k-cyan" /> Night · dim + warm lights
            </span>
            <span>
              <Scissors className="inline h-3 w-3 mr-1 k-danger" /> Section · clip X=0
            </span>
            <span>
              <Grid3x3 className="inline h-3 w-3 mr-1 k-pass" /> Floor Plan · orthographic top-down
            </span>
          </div>
        </div>

        <div className="k-card">
          <div className="k-card-title">SCENE NOTES</div>
          <div className="text-xs k-dim leading-relaxed space-y-2">
            <p>
              <span className="k-cyan font-bold">Terrain:</span> 48×48 displaced plane ·
              rolling sinusoid base · ravine strip lowered ~3.5m.
            </p>
            <p>
              <span className="k-cyan font-bold">Villa:</span> 3×2×2.4m box body · 4-sided
              cone roof · 3 emissive windows · foundation pad flattened.
            </p>
            <p>
              <span className="k-cyan font-bold">Trees:</span> cylinder trunk + cone foliage ·
              sway animated.
            </p>
            <p>
              <span className="k-cyan font-bold">Stream:</span> flat translucent plane in
              ravine floor.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="justify-center py-2 border-[var(--k-line-strong)] text-[var(--k-amber-bright)]">
          SIMULATION · NOT SURVEY-GRADE
        </Badge>
      </div>
    </div>
  );
}
