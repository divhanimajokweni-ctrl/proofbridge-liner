'use client';

/**
 * HBK MKII Viewport — 13-part exploded hardware assembly
 * -------------------------------------------------------
 * The Hydro-Bayesian Kernel Mark II housing — an exploded 3D assembly with:
 *   · 1 central kernel housing cylinder (cyan)
 *   · 2 end caps (dim gray)
 *   · 4 sensor mounts (octahedrons, N=cyan / S=red / E=green / W=amber)
 *   · 2 PCB boards (green boxes)
 *   · 2 antennas (thin cyan cylinders)
 *   · 1 battery pack (amber box)
 *   · 1 display screen (green emissive plane)
 *
 * Controls (sidebar): Explode / Section / Half-Full / Grid-Wireframe /
 * Data Path / Auto-orbit, plus click-to-select a part with an annotation
 * overlay, plus a 13-row DRC table at the bottom (327k triangle total).
 *
 * Same Three.js setup pattern as src/components/evidence/hbk-viewport.tsx:
 * useEffect once-only init, useRef for canvas/scene/renderer, ResizeObserver
 * for responsive sizing, full cleanup on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Cpu,
  RotateCcw,
  Layers,
  Grid3x3,
  Eye,
  EyeOff,
  Zap,
  Orbit,
  Box,
  Camera,
} from 'lucide-react';

// ─── Part registry ─────────────────────────────────────────────────────

interface PartDef {
  id: number;
  name: string;
  hex: string; // color hex like '#00d4ff'
  triLabel: string; // '24k'
  triCount: number; // 24000
  status: 'PASS' | 'WARN' | 'PROCESS';
  notes: string;
  desc: string;
  basePos: [number, number, number];
  explodeDir: [number, number, number];
  geometry: 'cylinder' | 'octahedron' | 'box' | 'antenna' | 'screen';
  args: number[]; // geometry args
  halfHidden?: boolean; // hidden when "half" view active (Y < 0 parts)
}

const PARTS: PartDef[] = [
  {
    id: 1,
    name: 'Kernel Housing',
    hex: '#00d4ff',
    triLabel: '24k',
    triCount: 24000,
    status: 'PASS',
    notes: 'Machined aluminium · anodised cyan',
    desc: 'Central machined aluminium housing for the HBK Mark II assembly. Anodised cyan. Houses the posterior fusion core.',
    basePos: [0, 0, 0],
    explodeDir: [0, 0, 0],
    geometry: 'cylinder',
    args: [0.6, 0.6, 1.8, 32],
  },
  {
    id: 2,
    name: 'End Cap A',
    hex: '#5b7280',
    triLabel: '8k',
    triCount: 8000,
    status: 'PASS',
    notes: 'Top seal · O-ring gasket',
    desc: 'Upper end cap with O-ring gasket seal. Provides access to PCB Top and antenna mounts.',
    basePos: [0, 1.05, 0],
    explodeDir: [0, 1, 0],
    geometry: 'cylinder',
    args: [0.66, 0.66, 0.2, 32],
  },
  {
    id: 3,
    name: 'End Cap B',
    hex: '#5b7280',
    triLabel: '8k',
    triCount: 8000,
    status: 'PASS',
    notes: 'Bottom seal · battery access',
    desc: 'Lower end cap with battery pack access hatch. O-ring gasket seal.',
    basePos: [0, -1.05, 0],
    explodeDir: [0, -1, 0],
    geometry: 'cylinder',
    args: [0.66, 0.66, 0.2, 32],
    halfHidden: true,
  },
  {
    id: 4,
    name: 'Sensor Mount N',
    hex: '#00d4ff',
    triLabel: '12k',
    triCount: 12000,
    status: 'PASS',
    notes: 'North sensor · FLOW_001',
    desc: 'North-facing sensor mount — hosts the FLOW_001 SCADA flow probe.',
    basePos: [0, 0, 0.9],
    explodeDir: [0, 0, 1],
    geometry: 'octahedron',
    args: [0.28],
  },
  {
    id: 5,
    name: 'Sensor Mount S',
    hex: '#ff4d4d',
    triLabel: '12k',
    triCount: 12000,
    status: 'PASS',
    notes: 'South sensor · PRESS_002',
    desc: 'South-facing sensor mount — hosts the PRESS_002 SCADA pressure probe.',
    basePos: [0, 0, -0.9],
    explodeDir: [0, 0, -1],
    geometry: 'octahedron',
    args: [0.28],
  },
  {
    id: 6,
    name: 'Sensor Mount E',
    hex: '#00ff88',
    triLabel: '12k',
    triCount: 12000,
    status: 'PASS',
    notes: 'East sensor · BR_N_003',
    desc: 'East-facing sensor mount — hosts the BR_N_003 acoustic broadband node.',
    basePos: [0.9, 0, 0],
    explodeDir: [1, 0, 0],
    geometry: 'octahedron',
    args: [0.28],
  },
  {
    id: 7,
    name: 'Sensor Mount W',
    hex: '#ffb800',
    triLabel: '12k',
    triCount: 12000,
    status: 'WARN',
    notes: 'West sensor · BR_S_004 · CAL DUE',
    desc: 'West-facing sensor mount — hosts the BR_S_004 acoustic broadband node. Calibration overdue.',
    basePos: [-0.9, 0, 0],
    explodeDir: [-1, 0, 0],
    geometry: 'octahedron',
    args: [0.28],
  },
  {
    id: 8,
    name: 'PCB Top',
    hex: '#00ff88',
    triLabel: '45k',
    triCount: 45000,
    status: 'PASS',
    notes: 'Top board · posterior fusion SoC',
    desc: 'Top PCB — hosts the posterior fusion SoC and the BLE telemetry radio.',
    basePos: [0, 0.55, 0],
    explodeDir: [0, 1, 0],
    geometry: 'box',
    args: [1.2, 0.04, 0.8],
  },
  {
    id: 9,
    name: 'PCB Bottom',
    hex: '#00ff88',
    triLabel: '45k',
    triCount: 45000,
    status: 'PASS',
    notes: 'Bottom board · power conditioning',
    desc: 'Bottom PCB — power conditioning, battery management, and sensor ADC.',
    basePos: [0, -0.55, 0],
    explodeDir: [0, -1, 0],
    geometry: 'box',
    args: [1.2, 0.04, 0.8],
    halfHidden: true,
  },
  {
    id: 10,
    name: 'Antenna Primary',
    hex: '#00d4ff',
    triLabel: '6k',
    triCount: 6000,
    status: 'PASS',
    notes: 'LoRa · 868 MHz · primary',
    desc: 'Primary LoRa antenna — 868 MHz long-haul telemetry uplink.',
    basePos: [0.32, 1.25, 0],
    explodeDir: [0, 1, 0],
    geometry: 'antenna',
    args: [0.025, 0.025, 1.2, 8],
  },
  {
    id: 11,
    name: 'Antenna Secondary',
    hex: '#00d4ff',
    triLabel: '6k',
    triCount: 6000,
    status: 'PASS',
    notes: 'BLE · 2.4 GHz · secondary',
    desc: 'Secondary BLE antenna — 2.4 GHz short-range configuration uplink.',
    basePos: [-0.32, 1.25, 0],
    explodeDir: [0, 1, 0],
    geometry: 'antenna',
    args: [0.025, 0.025, 1.0, 8],
  },
  {
    id: 12,
    name: 'Battery Pack',
    hex: '#ffb800',
    triLabel: '18k',
    triCount: 18000,
    status: 'WARN',
    notes: 'Li-SOCl₂ · 78% SoH',
    desc: 'Lithium thionyl chloride battery pack — 78% state-of-health. Replace within 30 days.',
    basePos: [0, -1.2, 0],
    explodeDir: [0, -1, 0],
    geometry: 'box',
    args: [0.5, 0.3, 0.5],
    halfHidden: true,
  },
  {
    id: 13,
    name: 'Display Screen',
    hex: '#00ff88',
    triLabel: '31k',
    triCount: 31000,
    status: 'PROCESS',
    notes: 'E-ink · MAP overlay · firmware v0.9',
    desc: 'E-ink display panel — renders the MAP estimate and 95% credible radius overlay. Firmware pending GA.',
    basePos: [0, 1.4, 0.31],
    explodeDir: [0, 1, 0.2],
    geometry: 'screen',
    args: [0.7, 0.45],
  },
];

const TOTAL_TRIANGLE_TARGET = '327k';

// ─── Component ─────────────────────────────────────────────────────────

interface SelectedPart {
  id: number;
  name: string;
  desc: string;
  hex: string;
  triLabel: string;
  notes: string;
  status: 'PASS' | 'WARN' | 'PROCESS';
  screenX: number;
  screenY: number;
}

export default function HbkMkiiViewport() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);
  const partMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const partHighlightRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const dataPathGroupRef = useRef<THREE.Group | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const pointerRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animationRef = useRef<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  // Live control refs — read by animation loop without forcing re-init
  const explodeRef = useRef(0);
  const sectionRef = useRef(false);
  const halfRef = useRef(false);
  const wireframeRef = useRef(false);
  const dataPathRef = useRef(false);
  const autoOrbitRef = useRef(false);

  const [explode, setExplode] = useState(0);
  const [section, setSection] = useState(false);
  const [half, setHalf] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [dataPath, setDataPath] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [selected, setSelected] = useState<SelectedPart | null>(null);

  // ─── Mutators (read from refs, mutate the live scene) ────────────────

  const updateExplode = useCallback(() => {
    const group = partsGroupRef.current;
    if (!group) return;
    const amount = explodeRef.current / 100;
    const maxOffset = 2.2;
    partMeshesRef.current.forEach((mesh, id) => {
      const part = PARTS.find((p) => p.id === id);
      if (!part) return;
      const offset = amount * maxOffset;
      mesh.position.set(
        part.basePos[0] + part.explodeDir[0] * offset,
        part.basePos[1] + part.explodeDir[1] * offset,
        part.basePos[2] + part.explodeDir[2] * offset,
      );
    });
  }, []);

  const updateSectionClip = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (!renderer || !scene) return;
    if (sectionRef.current && clipPlaneRef.current) {
      renderer.localClippingEnabled = true;
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material;
          const apply = (m: THREE.Material) => {
            (m as THREE.MeshPhongMaterial).clippingPlanes = [clipPlaneRef.current!];
          };
          if (Array.isArray(mat)) mat.forEach(apply);
          else apply(mat);
        }
      });
    } else {
      renderer.localClippingEnabled = false;
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material;
          const apply = (m: THREE.Material) => {
            (m as THREE.MeshPhongMaterial).clippingPlanes = null;
          };
          if (Array.isArray(mat)) mat.forEach(apply);
          else apply(mat);
        }
      });
    }
  }, []);

  const updateHalfVisibility = useCallback(() => {
    partMeshesRef.current.forEach((mesh, id) => {
      const part = PARTS.find((p) => p.id === id);
      if (!part) return;
      mesh.visible = !(halfRef.current && part.halfHidden);
    });
  }, []);

  const updateWireframe = useCallback(() => {
    partMeshesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshPhongMaterial;
      mat.wireframe = wireframeRef.current;
    });
  }, []);

  // Sync state → refs (no scene re-init)
  useEffect(() => {
    explodeRef.current = explode;
    updateExplode();
  }, [explode, updateExplode]);
  useEffect(() => {
    sectionRef.current = section;
    updateSectionClip();
  }, [section, updateSectionClip]);
  useEffect(() => {
    halfRef.current = half;
    updateHalfVisibility();
  }, [half, updateHalfVisibility]);
  useEffect(() => {
    wireframeRef.current = wireframe;
    updateWireframe();
  }, [wireframe, updateWireframe]);
  useEffect(() => {
    dataPathRef.current = dataPath;
    if (dataPathGroupRef.current) {
      dataPathGroupRef.current.visible = dataPath;
    }
  }, [dataPath]);
  useEffect(() => {
    autoOrbitRef.current = autoOrbit;
  }, [autoOrbit]);


  // ─── Scene init (once) ──────────────────────────────────────────────

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a10);
    scene.fog = new THREE.Fog(0x060a10, 12, 36);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = false;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.5;
    controls.maxDistance = 14;
    controls.enablePan = false;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // Lighting — cool ambient + cyan/green accent rim
    scene.add(new THREE.AmbientLight(0x334455, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 8, 4);
    scene.add(dirLight);
    const cyanLight = new THREE.PointLight(0x00d4ff, 1.0, 14);
    cyanLight.position.set(-3, 2, 3);
    scene.add(cyanLight);
    const greenLight = new THREE.PointLight(0x00ff88, 0.6, 14);
    greenLight.position.set(3, -2, -3);
    scene.add(greenLight);

    // Ground grid
    const grid = new THREE.GridHelper(16, 16, 0x1a2732, 0x111a22);
    (grid.material as THREE.Material).opacity = 0.45;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = -2.5;
    scene.add(grid);

    // Clipping plane (for section view) — clips Y > 0
    clipPlaneRef.current = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

    // ─── Build the 13-part assembly ───────────────────────────────────
    const partsGroup = new THREE.Group();
    scene.add(partsGroup);
    partsGroupRef.current = partsGroup;

    PARTS.forEach((part) => {
      let geo: THREE.BufferGeometry;
      switch (part.geometry) {
        case 'cylinder':
          geo = new THREE.CylinderGeometry(part.args[0], part.args[1], part.args[2], part.args[3]);
          break;
        case 'octahedron':
          geo = new THREE.OctahedronGeometry(part.args[0], 0);
          break;
        case 'box':
          geo = new THREE.BoxGeometry(part.args[0], part.args[1], part.args[2]);
          break;
        case 'antenna':
          geo = new THREE.CylinderGeometry(part.args[0], part.args[1], part.args[2], part.args[3]);
          break;
        case 'screen': {
          geo = new THREE.PlaneGeometry(part.args[0], part.args[1]);
          break;
        }
        default:
          geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      }

      const colorHex = parseInt(part.hex.replace('#', ''), 16);
      const isScreen = part.geometry === 'screen';
      const mat = new THREE.MeshPhongMaterial({
        color: colorHex,
        emissive: isScreen ? colorHex : colorHex & 0x333333,
        emissiveIntensity: isScreen ? 0.7 : 0.25,
        shininess: 60,
        specular: 0x222222,
        side: THREE.DoubleSide,
        transparent: isScreen,
        opacity: isScreen ? 0.95 : 1.0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...part.basePos);
      if (isScreen) {
        // Orient screen to face upward (tilted)
        mesh.rotation.x = -Math.PI / 2.4;
      }
      mesh.userData = { partId: part.id, baseColor: colorHex };
      partsGroup.add(mesh);
      partMeshesRef.current.set(part.id, mesh);
    });

    // ─── Data-path particles ──────────────────────────────────────────
    // A looping path of cyan spheres that snake through the assembly:
    // battery → PCB bottom → housing core → PCB top → display.
    const dataPathGroup = new THREE.Group();
    dataPathGroup.visible = false;
    scene.add(dataPathGroup);
    dataPathGroupRef.current = dataPathGroup;

    const pathPoints = [
      new THREE.Vector3(0, -1.2, 0), // battery
      new THREE.Vector3(0, -0.55, 0), // PCB bottom
      new THREE.Vector3(0, 0, 0), // housing core
      new THREE.Vector3(0, 0.55, 0), // PCB top
      new THREE.Vector3(0, 1.4, 0.31), // display
    ];
    const pathCurve = new THREE.CatmullRomCurve3(pathPoints);
    const pathGeo = new THREE.TubeGeometry(pathCurve, 64, 0.015, 6, false);
    const pathMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.35,
    });
    const pathTube = new THREE.Mesh(pathGeo, pathMat);
    dataPathGroup.add(pathTube);

    const PARTICLE_COUNT = 12;
    const particleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.95,
    });
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      dataPathGroup.add(p);
    }

    // ─── Resize handler ───────────────────────────────────────────────
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // ─── Pointer + click → raycast → select part ─────────────────────
    const handlePointerDown = (event: PointerEvent) => {
      // Don't fire on drags — OrbitControls already grabs the pointer
      // We only handle short clicks (no drag distance)
      const rect = renderer.domElement.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      let moved = false;
      const onMove = (ev: PointerEvent) => {
        if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) {
          moved = true;
        }
      };
      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (moved) return;
        // Compute NDC pointer
        const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        pointerRef.current.set(x, y);
        raycasterRef.current.setFromCamera(pointerRef.current, camera);
        // Test against visible parts only
        const visibleMeshes: THREE.Mesh[] = [];
        partMeshesRef.current.forEach((m) => {
          if (m.visible) visibleMeshes.push(m);
        });
        const intersects = raycasterRef.current.intersectObjects(visibleMeshes, false);
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          const partId = hit.userData.partId as number;
          const part = PARTS.find((p) => p.id === partId);
          if (part) {
            selectedIdRef.current = partId;
            updateHighlight(partId);
            // Screen-space position from world-space hit point
            const worldPos = new THREE.Vector3();
            hit.getWorldPosition(worldPos);
            const projected = worldPos.clone().project(camera);
            const screenX = ((projected.x + 1) / 2) * rect.width;
            const screenY = ((-projected.y + 1) / 2) * rect.height;
            setSelected({
              id: part.id,
              name: part.name,
              desc: part.desc,
              hex: part.hex,
              triLabel: part.triLabel,
              notes: part.notes,
              status: part.status,
              screenX,
              screenY,
            });
          }
        } else {
          selectedIdRef.current = null;
          updateHighlight(null);
          setSelected(null);
        }
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Highlight helper — wraps selected part in an emissive wireframe outline
    const updateHighlight = (id: number | null) => {
      // Clear existing highlights
      partHighlightRef.current.forEach((m) => {
        partsGroupRef.current?.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      partHighlightRef.current.clear();
      if (id == null) return;
      const target = partMeshesRef.current.get(id);
      if (!target) return;
      const edges = new THREE.EdgesGeometry(target.geometry);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      });
      const lines = new THREE.LineSegments(edges, lineMat) as unknown as THREE.Mesh;
      lines.position.copy(target.position);
      lines.rotation.copy(target.rotation);
      lines.scale.setScalar(1.04);
      partsGroupRef.current?.add(lines);
      partHighlightRef.current.set(id, lines);
    };

    // ─── Animation loop ───────────────────────────────────────────────
    const clock = new THREE.Clock();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Move data-path particles along the curve
      if (dataPathGroupRef.current) {
        const children = dataPathGroupRef.current.children;
        for (let i = 1; i < children.length; i++) {
          const u = ((t * 0.15 + (i - 1) / (children.length - 1)) % 1);
          const point = pathCurve.getPoint(u);
          children[i].position.copy(point);
        }
      }

      // Auto-orbit camera (when enabled + user not actively dragging)
      if (autoOrbitRef.current && cameraRef.current && controlsRef.current) {
        const r = cameraRef.current.position.length();
        const angle = t * 0.25;
        const currentY = cameraRef.current.position.y;
        cameraRef.current.position.x = Math.cos(angle) * (r * 0.92);
        cameraRef.current.position.z = Math.sin(angle) * (r * 0.92);
        cameraRef.current.position.y = currentY;
        cameraRef.current.lookAt(0, 0, 0);
      }
      if (controlsRef.current) controlsRef.current.update();

      // Re-project selected part screen position
      if (selectedIdRef.current && cameraRef.current && rendererRef.current) {
        const mesh = partMeshesRef.current.get(selectedIdRef.current);
        if (mesh) {
          const worldPos = new THREE.Vector3();
          mesh.getWorldPosition(worldPos);
          const projected = worldPos.clone().project(cameraRef.current);
          const rect = rendererRef.current.domElement.getBoundingClientRect();
          const screenX = ((projected.x + 1) / 2) * rect.width;
          const screenY = ((-projected.y + 1) / 2) * rect.height;
          setSelected((prev) =>
            prev && (Math.abs(prev.screenX - screenX) > 1 || Math.abs(prev.screenY - screenY) > 1)
              ? { ...prev, screenX, screenY }
              : prev,
          );
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Apply initial state values from defaults
    setTimeout(() => {
      updateExplode();
      updateHalfVisibility();
      updateWireframe();
    }, 0);

    // ─── Cleanup ──────────────────────────────────────────────────────
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
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

  const handleReset = useCallback(() => {
    setExplode(0);
    setSection(false);
    setHalf(false);
    setWireframe(false);
    setDataPath(false);
    setAutoOrbit(true);
    setSelected(null);
    selectedIdRef.current = null;
    // Clear highlight ring
    partHighlightRef.current.forEach((m) => {
      partsGroupRef.current?.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    partHighlightRef.current.clear();
  }, []);

  const statusBadge = (status: 'PASS' | 'WARN' | 'PROCESS') => {
    switch (status) {
      case 'PASS':
        return <span className="k-badge k-badge-pass">PASS</span>;
      case 'WARN':
        return <span className="k-badge k-badge-warn">WARN</span>;
      case 'PROCESS':
        return <span className="k-badge k-badge-process">PROCESS</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-4 h-full">
      {/* 3D viewport */}
      <div className="flex flex-col gap-4 min-h-[600px]">
        <div className="relative k-card p-0 overflow-hidden flex-1 min-h-[400px] lg:min-h-[560px]">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <Cpu className="h-4 w-4 k-cyan" />
            <span className="text-xs k-card-title m-0">HBK MKII · 13 PARTS · 327k TRI</span>
          </div>
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
            <span className="k-badge k-badge-pass">EXISTS</span>
            <span className="k-badge k-badge-dim">RAYCAST ON</span>
          </div>

          {/* Click-to-select hint */}
          {!selected && (
            <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded bg-[var(--k-bg-elevated)]/85 border border-[var(--k-line)]">
              <span className="text-[10px] k-dim uppercase tracking-widest">
                Tip · click any part to inspect · drag to orbit · scroll to zoom
              </span>
            </div>
          )}

          {/* Selected part annotation overlay */}
          {selected && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${selected.screenX}px`,
                top: `${selected.screenY}px`,
                transform: 'translate(12px, -50%)',
                maxWidth: 'min(280px, calc(100% - 24px))',
              }}
            >
              <div
                className="k-card k-glow-cyan pointer-events-auto"
                style={{ borderColor: selected.hex }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: selected.hex,
                        boxShadow: `0 0 8px ${selected.hex}`,
                      }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: selected.hex }}
                    >
                      {selected.name}
                    </span>
                  </div>
                  {statusBadge(selected.status)}
                </div>
                <p className="text-[11px] k-fg leading-relaxed mb-1.5">{selected.desc}</p>
                <Separator className="my-1.5" />
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div>
                    <span className="k-dim uppercase tracking-wider">Triangles</span>
                    <div className="k-cyan font-bold">{selected.triLabel}</div>
                  </div>
                  <div>
                    <span className="k-dim uppercase tracking-wider">Notes</span>
                    <div className="k-fg-bright">{selected.notes}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    selectedIdRef.current = null;
                    setSelected(null);
                    partHighlightRef.current.forEach((m) => {
                      partsGroupRef.current?.remove(m);
                      m.geometry.dispose();
                      (m.material as THREE.Material).dispose();
                    });
                    partHighlightRef.current.clear();
                  }}
                  className="mt-2 text-[10px] k-dim hover:k-cyan uppercase tracking-wider"
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={mountRef} className="w-full h-full" style={{ minHeight: '400px' }} />
        </div>

        {/* DRC table */}
        <div className="k-card">
          <div className="k-card-title">
            <Camera className="h-4 w-4" /> DRC · PART REGISTRY (13 PARTS)
          </div>
          <ScrollArea className="max-h-72">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left k-dim border-b border-[var(--k-line)]">
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">#</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Part</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider text-right">Triangles</th>
                  <th className="py-2 px-2 font-semibold uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody>
                {PARTS.map((p) => {
                  const isSelected = selected?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        selectedIdRef.current = p.id;
                        // Force a synthetic click → re-project in next frame
                        const mesh = partMeshesRef.current.get(p.id);
                        if (mesh && cameraRef.current && rendererRef.current) {
                          const worldPos = new THREE.Vector3();
                          mesh.getWorldPosition(worldPos);
                          const projected = worldPos.clone().project(cameraRef.current);
                          const rect = rendererRef.current.domElement.getBoundingClientRect();
                          setSelected({
                            id: p.id,
                            name: p.name,
                            desc: p.desc,
                            hex: p.hex,
                            triLabel: p.triLabel,
                            notes: p.notes,
                            status: p.status,
                            screenX: ((projected.x + 1) / 2) * rect.width,
                            screenY: ((-projected.y + 1) / 2) * rect.height,
                          });
                          // Highlight ring
                          partHighlightRef.current.forEach((m) => {
                            partsGroupRef.current?.remove(m);
                            m.geometry.dispose();
                            (m.material as THREE.Material).dispose();
                          });
                          partHighlightRef.current.clear();
                          const edges = new THREE.EdgesGeometry(mesh.geometry);
                          const lineMat = new THREE.LineBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            opacity: 0.95,
                          });
                          const lines = new THREE.LineSegments(edges, lineMat) as unknown as THREE.Mesh;
                          lines.position.copy(mesh.position);
                          lines.rotation.copy(mesh.rotation);
                          lines.scale.setScalar(1.04);
                          partsGroupRef.current?.add(lines);
                          partHighlightRef.current.set(p.id, lines);
                        }
                      }}
                      className={`border-b border-[var(--k-line)]/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[rgba(0,212,255,0.08)]' : 'hover:bg-[var(--k-panel-2)]/40'
                      }`}
                    >
                      <td className="py-2 px-2 k-dim tabular-nums">{p.id.toString().padStart(2, '0')}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-sm"
                            style={{
                              backgroundColor: p.hex,
                              boxShadow: `0 0 6px ${p.hex}`,
                            }}
                          />
                          <span className="k-fg-bright font-semibold">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">{statusBadge(p.status)}</td>
                      <td className="py-2 px-2 text-right k-cyan font-bold tabular-nums">{p.triLabel}</td>
                      <td className="py-2 px-2 k-dim">{p.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--k-line-strong)]">
                  <td colSpan={3} className="py-2 px-2 text-right text-[10px] k-dim uppercase tracking-widest">
                    TOTAL
                  </td>
                  <td className="py-2 px-2 text-right k-pass font-bold tabular-nums">
                    {TOTAL_TRIANGLE_TARGET}
                  </td>
                  <td className="py-2 px-2 k-dim text-[10px] uppercase tracking-wider">
                    {PARTS.length} PARTS · 3 EIS-READY
                  </td>
                </tr>
              </tfoot>
            </table>
          </ScrollArea>
        </div>
      </div>

      {/* Controls sidebar */}
      <div className="flex flex-col gap-4">
        <div className="k-card">
          <div className="k-card-title">
            <Layers className="h-4 w-4" /> ASSEMBLY CONTROLS
          </div>

          {/* Explode */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between items-center">
              <Label className="text-xs k-dim uppercase tracking-wider">Explode</Label>
              <span className="text-xs k-cyan font-bold">{explode}%</span>
            </div>
            <Slider
              value={[explode]}
              onValueChange={(v) => setExplode(v[0] ?? 0)}
              min={0}
              max={100}
              step={1}
              aria-label="Explode amount"
            />
          </div>

          <Separator className="my-3" />

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <ToggleRow
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Section"
              hint="Clip at Y=0"
              checked={section}
              onCheckedChange={setSection}
            />
            <ToggleRow
              icon={half ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              label="Half / Full"
              hint={half ? 'Half-cut view' : 'Full assembly'}
              checked={half}
              onCheckedChange={setHalf}
            />
            <ToggleRow
              icon={<Grid3x3 className="h-3.5 w-3.5" />}
              label="Grid / Wireframe"
              hint={wireframe ? 'Wireframe' : 'Solid'}
              checked={wireframe}
              onCheckedChange={setWireframe}
            />
            <ToggleRow
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Data Path"
              hint={dataPath ? 'Particles ON' : 'Particles OFF'}
              checked={dataPath}
              onCheckedChange={setDataPath}
            />
            <ToggleRow
              icon={<Orbit className="h-3.5 w-3.5" />}
              label="Auto-orbit"
              hint={autoOrbit ? 'Camera orbiting' : 'Manual orbit'}
              checked={autoOrbit}
              onCheckedChange={setAutoOrbit}
            />
          </div>

          <Separator className="my-3" />

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full border-[var(--k-line-strong)] text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)]"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> RESET ALL
          </Button>
        </div>

        <div className="k-card">
          <div className="k-card-title">
            <Box className="h-4 w-4" /> INSPECTOR
          </div>
          {selected ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: selected.hex,
                    boxShadow: `0 0 6px ${selected.hex}`,
                  }}
                />
                <span className="k-fg-bright font-bold">{selected.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Field label="PART ID" value={`#${selected.id.toString().padStart(2, '0')}`} />
                <Field label="TRIANGLES" value={selected.triLabel} />
                <Field label="STATUS" value={selected.status} />
                <Field label="INSPECTOR" value="DRC-7" />
              </div>
              <Separator className="my-2" />
              <p className="k-dim leading-relaxed">{selected.desc}</p>
            </div>
          ) : (
            <div className="text-xs k-dim text-center py-4">
              No part selected. Click any part in the 3D viewport or DRC table to inspect.
            </div>
          )}
        </div>

        <Badge variant="outline" className="justify-center py-2 border-[var(--k-line-strong)] text-[var(--k-cyan-bright)]">
          PRIORITY · HBK MKII
        </Badge>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <Label className="text-xs k-fg-bright uppercase tracking-wider flex items-center gap-1.5">
          {icon} {label}
        </Label>
        <span className="text-[10px] k-dim">{hint}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] k-dim uppercase tracking-wider">{label}</div>
      <div className="k-cyan font-bold text-xs">{value}</div>
    </div>
  );
}
