'use client';

/**
 * 3D Mechanics — 4-body kinematic scene
 * -------------------------------------
 * Four coloured spheres (cyan / green / amber / red) connected by line joints.
 * Controls: Explode / Yaw / Pitch / Zoom sliders, Auto-orbit toggle,
 * OrbitControls always-on for free rotate/zoom.
 *
 * Same Three.js setup pattern as src/components/evidence/hbk-viewport.tsx:
 * useEffect once-only init, useRef for canvas/scene/renderer, ResizeObserver
 * for responsive sizing, full cleanup on unmount.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Boxes, Orbit } from 'lucide-react';

interface BodyDef {
  name: string;
  color: number;
  emissive: number;
  pos: [number, number, number];
  radius: number;
}

const BODIES: BodyDef[] = [
  { name: 'Body α', color: 0x00d4ff, emissive: 0x004d66, pos: [-1.4, 0, 0], radius: 0.45 },
  { name: 'Body β', color: 0x00ff88, emissive: 0x004d33, pos: [1.4, 0, 0], radius: 0.45 },
  { name: 'Body γ', color: 0xffb800, emissive: 0x4d3300, pos: [0, 1.2, 1.0], radius: 0.4 },
  { name: 'Body δ', color: 0xff4d4d, emissive: 0x4d0000, pos: [0, -1.2, -1.0], radius: 0.4 },
];

// Joint edges — pairs of body indices
const JOINTS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

export default function Mechanics3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Live control state — refs are read by the animation loop without
  // forcing re-init of the Three.js scene.
  const explodeRef = useRef(0);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const zoomRef = useRef(1);
  const autoOrbitRef = useRef(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const assemblyRef = useRef<THREE.Group | null>(null);
  const jointsRef = useRef<THREE.Line[]>([]);
  const animationRef = useRef<number | null>(null);

  const [explode, setExplode] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [autoOrbit, setAutoOrbit] = useState(false);

  useEffect(() => {
    explodeRef.current = explode;
  }, [explode]);
  useEffect(() => {
    yawRef.current = yaw;
  }, [yaw]);
  useEffect(() => {
    pitchRef.current = pitch;
  }, [pitch]);
  useEffect(() => {
    zoomRef.current = zoom / 100;
  }, [zoom]);
  useEffect(() => {
    autoOrbitRef.current = autoOrbit;
  }, [autoOrbit]);

  // Scene init — runs once on mount
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a10);
    sceneRef.current = scene;

    // Fog for depth perception
    scene.fog = new THREE.Fog(0x060a10, 8, 22);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(5, 3.5, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // OrbitControls — always on for rotate/zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 18;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0x334455, 0.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 8, 4);
    scene.add(dirLight);
    const cyanLight = new THREE.PointLight(0x00d4ff, 1.0, 15);
    cyanLight.position.set(-4, 2, 4);
    scene.add(cyanLight);
    const greenLight = new THREE.PointLight(0x00ff88, 0.7, 15);
    greenLight.position.set(4, -2, -4);
    scene.add(greenLight);

    // Ground grid
    const grid = new THREE.GridHelper(20, 20, 0x1a2732, 0x111a22);
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Assembly group — holds the 4 spheres; exploded/rotated as a unit
    const assembly = new THREE.Group();
    scene.add(assembly);
    assemblyRef.current = assembly;

    // Spheres
    BODIES.forEach((body) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(body.radius, 32, 24),
        new THREE.MeshPhongMaterial({
          color: body.color,
          emissive: body.emissive,
          shininess: 60,
          specular: 0xffffff,
        }),
      );
      sphere.position.set(...body.pos);
      sphere.userData = { basePos: new THREE.Vector3(...body.pos), name: body.name };
      assembly.add(sphere);
    });

    // Joints — line segments connecting sphere centers
    const jointPositions: number[] = [];
    JOINTS.forEach(([a, b]) => {
      const pa = new THREE.Vector3(...BODIES[a].pos);
      const pb = new THREE.Vector3(...BODIES[b].pos);
      jointPositions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    });
    const jointGeo = new THREE.BufferGeometry();
    jointGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(jointPositions, 3),
    );
    const jointMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.55,
    });
    const joints = new THREE.LineSegments(jointGeo, jointMat) as unknown as THREE.Line;
    assembly.add(joints);
    jointsRef.current = [joints];

    // Resize handler
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const _t = clock.getElapsedTime();

      // Apply explode — push each sphere outward from assembly centroid
      const assembly2 = assemblyRef.current;
      if (assembly2) {
        assembly2.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.userData?.basePos) {
            const base = child.userData.basePos as THREE.Vector3;
            const factor = 1 + explodeRef.current * 0.012;
            child.position.set(
              base.x * factor,
              base.y * factor,
              base.z * factor,
            );
          }
        });

        // Rebuild joint positions from current sphere positions
        const spheres = assembly2.children.filter(
          (c): c is THREE.Mesh => c instanceof THREE.Mesh && !!c.userData?.basePos,
        );
        const positions: number[] = [];
        JOINTS.forEach(([a, b]) => {
          const pa = spheres[a]?.position;
          const pb = spheres[b]?.position;
          if (pa && pb) {
            positions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
          }
        });
        const line = jointsRef.current[0];
        if (line) {
          const geo = line.geometry as THREE.BufferGeometry;
          const attr = geo.getAttribute('position') as THREE.BufferAttribute;
          for (let i = 0; i < positions.length; i++) {
            attr.setX(i, positions[i * 3] ?? 0);
            attr.setY(i, positions[i * 3 + 1] ?? 0);
            attr.setZ(i, positions[i * 3 + 2] ?? 0);
          }
          // Safer: assign all at once
          for (let i = 0; i < positions.length; i += 3) {
            attr.setXYZ(i / 3, positions[i], positions[i + 1], positions[i + 2]);
          }
          attr.needsUpdate = true;
        }

        // Apply yaw / pitch / zoom to assembly
        const yawRad = THREE.MathUtils.degToRad(yawRef.current);
        const pitchRad = THREE.MathUtils.degToRad(pitchRef.current);
        assembly2.rotation.y = yawRad;
        assembly2.rotation.x = pitchRad;
        const z = zoomRef.current;
        assembly2.scale.setScalar(z);
      }

      // Auto-orbit — moves the camera around the origin on the XZ plane
      if (autoOrbitRef.current && cameraRef.current && controlsRef.current) {
        const r = cameraRef.current.position.length();
        const angle = clock.getElapsedTime() * 0.4;
        cameraRef.current.position.x = Math.cos(angle) * r;
        cameraRef.current.position.z = Math.sin(angle) * r;
        cameraRef.current.position.y = r * 0.45;
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.update();
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

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

  const handleReset = () => {
    setExplode(0);
    setYaw(0);
    setPitch(0);
    setZoom(100);
    setAutoOrbit(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-4 h-full">
      {/* 3D viewport */}
      <div className="relative k-card p-0 overflow-hidden min-h-[400px] lg:min-h-[520px]">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <Boxes className="h-4 w-4 k-cyan" />
          <span className="text-xs k-card-title m-0">4-BODY MECHANICS</span>
        </div>
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
          <span className="k-badge k-badge-process">BODIES: 4</span>
          <span className="k-badge k-badge-dim">JOINTS: 6</span>
        </div>
        <div ref={mountRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      </div>

      {/* Controls sidebar */}
      <div className="flex flex-col gap-4">
        <div className="k-card">
          <div className="k-card-title">
            <Orbit className="h-4 w-4" /> KINEMATIC CONTROLS
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
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
                aria-label="Explode"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs k-dim uppercase tracking-wider">Yaw</Label>
                <span className="text-xs k-cyan font-bold">{yaw}°</span>
              </div>
              <Slider
                value={[yaw]}
                onValueChange={(v) => setYaw(v[0] ?? 0)}
                min={-180}
                max={180}
                step={1}
                aria-label="Yaw"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs k-dim uppercase tracking-wider">Pitch</Label>
                <span className="text-xs k-cyan font-bold">{pitch}°</span>
              </div>
              <Slider
                value={[pitch]}
                onValueChange={(v) => setPitch(v[0] ?? 0)}
                min={-180}
                max={180}
                step={1}
                aria-label="Pitch"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs k-dim uppercase tracking-wider">Zoom</Label>
                <span className="text-xs k-cyan font-bold">{zoom}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0] ?? 100)}
                min={50}
                max={200}
                step={1}
                aria-label="Zoom"
              />
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <Label className="text-xs k-dim uppercase tracking-wider flex items-center gap-2">
              <Orbit className="h-3.5 w-3.5" /> Auto-orbit
            </Label>
            <Switch checked={autoOrbit} onCheckedChange={setAutoOrbit} />
          </div>

          <Separator className="my-3" />

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full border-[var(--k-line-strong)] text-[var(--k-fg-bright)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)]"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> RESET
          </Button>
        </div>

        <div className="k-card">
          <div className="k-card-title">BODY REGISTRY</div>
          <div className="flex flex-col gap-2 text-xs">
            {BODIES.map((b, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: `#${b.color.toString(16).padStart(6, '0')}`,
                      boxShadow: `0 0 6px #${b.color.toString(16).padStart(6, '0')}`,
                    }}
                  />
                  <span className="k-fg-bright font-semibold">{b.name}</span>
                </div>
                <span className="k-dim">
                  ({b.pos[0]}, {b.pos[1]}, {b.pos[2]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
