'use client';

/**
 * HBK Viewport — Three.js 3D scene
 * --------------------------------
 * Renders the DMA-7 pipe network, sensor nodes, DMA boundary, flow particles,
 * leak particles, and a 32×32 Bayesian posterior heatmap as an InstancedMesh.
 *
 * Reference: vvu_hbk_bayesian.html (Three.js Setup section).
 *
 * The viewport is a pure renderer — all simulation state lives in the parent
 * HBKPanel and is passed in as props. This keeps the Three.js scene decoupled
 * from the React state machine and avoids re-initializing WebGL on every
 * React render.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  GRID_N,
  CELL_SIZE,
  SENSOR_NODES,
  type HBKState,
  posteriorToColor,
} from '@/lib/evidence/HydroBayesianKernel';

interface HBKViewportProps {
  state: HBKState;
  posterior: Float64Array;
  tiltEnabled: boolean;
  className?: string;
}

export default function HBKViewport({
  state,
  posterior,
  tiltEnabled,
  className,
}: HBKViewportProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const heatMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const leakGroupRef = useRef<THREE.Group | null>(null);
  const flowParticlesRef = useRef<THREE.Mesh[]>([]);
  const leakMarkerRef = useRef<THREE.Mesh | null>(null);
  const flowSensorRef = useRef<THREE.Mesh | null>(null);
  const pressureSensorRef = useRef<THREE.Mesh | null>(null);
  const valveWheelRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const tiltTargetRef = useRef({ x: 0, y: 0 });
  const tiltCurrentRef = useRef({ x: 0, y: 0 });

  // Initialize scene once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020508);
    sceneRef.current = scene;

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsVertices: number[] = [];
    for (let i = 0; i < 1000; i++) {
      starsVertices.push(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
      );
    }
    starsGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3),
    );
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0x1a2732, size: 0.03 }),
    );
    scene.add(stars);

    // Camera
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.set(12, 10, 16);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 4;
    controls.maxDistance = 30;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0x334455, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(8, 12, 6);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const cyanLight = new THREE.PointLight(0x00d4ff, 1.2, 20);
    cyanLight.position.set(-5, 2, 4);
    scene.add(cyanLight);
    const greenLight = new THREE.PointLight(0x00ff88, 0.8, 15);
    greenLight.position.set(5, 2, -4);
    scene.add(greenLight);

    // Ground grid
    const grid = new THREE.GridHelper(20, 20, 0x1a2732, 0x111a22);
    scene.add(grid);

    // Pipe network
    const pipeMat = new THREE.MeshPhongMaterial({
      color: 0x2a3d5c,
      specular: 0x00d4ff,
      shininess: 30,
      transparent: true,
      opacity: 0.85,
    });
    const pipeGroup = new THREE.Group();
    scene.add(pipeGroup);

    const createPipe = (points: number[][], radius = 0.15) => {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => new THREE.Vector3(...p)),
      );
      const geo = new THREE.TubeGeometry(curve, 48, radius, 8, false);
      const mesh = new THREE.Mesh(geo, pipeMat);
      mesh.castShadow = true;
      pipeGroup.add(mesh);
      return mesh;
    };

    // Main trunk
    createPipe([[-5, 0, 0], [-2, 0, 0], [0, 0, 0], [2, 0, 0], [5, 0, 0]], 0.2);
    // DMA branches
    createPipe([[0, 0, 0], [0, 0, 2], [0, 0, 4]], 0.15);
    createPipe([[0, 0, 0], [0, 0, -2], [0, 0, -4]], 0.15);
    createPipe([[-2, 0, 0], [-2, 0, 1.5], [-2, 0, 3]], 0.12);
    createPipe([[2, 0, 0], [2, 0, -1.5], [2, 0, -3]], 0.12);

    // Valve
    const valveBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12),
      new THREE.MeshPhongMaterial({
        color: 0xffb800,
      }),
    );
    valveBody.position.set(0, 0, 0);
    scene.add(valveBody);

    const valveWheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.04, 8, 12),
      new THREE.MeshPhongMaterial({ color: 0x444444 }),
    );
    valveWheel.rotation.x = Math.PI / 2;
    valveWheel.position.y = 0.4;
    scene.add(valveWheel);
    valveWheelRef.current = valveWheel;

    // Sensors (octahedrons at sensor node positions)
    const sensorGeo = new THREE.OctahedronGeometry(0.25);
    const flowSensor = new THREE.Mesh(
      sensorGeo,
      new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x004d66,
      }),
    );
    flowSensor.position.set(SENSOR_NODES[0].x, 0.6, SENSOR_NODES[0].z);
    scene.add(flowSensor);
    flowSensorRef.current = flowSensor;

    const pressureSensor = new THREE.Mesh(
      sensorGeo,
      new THREE.MeshPhongMaterial({
        color: 0xff4d4d,
        emissive: 0x4d0000,
      }),
    );
    pressureSensor.position.set(SENSOR_NODES[1].x, 0.6, SENSOR_NODES[1].z);
    scene.add(pressureSensor);
    pressureSensorRef.current = pressureSensor;

    // Leak particles
    const leakGroup = new THREE.Group();
    leakGroup.visible = false;
    for (let i = 0; i < 30; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshPhongMaterial({
          color: 0x00ff88,
          emissive: 0x004d33,
          transparent: true,
          opacity: 0.8,
        }),
      );
      leakGroup.add(particle);
    }
    leakGroup.position.set(1, 0.2, 0);
    scene.add(leakGroup);
    leakGroupRef.current = leakGroup;

    // Flow particles
    const flowParticles: THREE.Mesh[] = [];
    const flowParticleGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const flowParticleMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6,
    });
    for (let i = 0; i < 20; i++) {
      const particle = new THREE.Mesh(flowParticleGeo, flowParticleMat);
      particle.position.set(-5 + i * 0.5, 0, 0);
      flowParticles.push(particle);
      scene.add(particle);
    }
    flowParticlesRef.current = flowParticles;

    // DMA boundary
    const dmaBoundary = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4, 0, -4),
        new THREE.Vector3(-4, 0, 4),
        new THREE.Vector3(4, 0, 4),
        new THREE.Vector3(4, 0, -4),
      ]),
      new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.3,
      }),
    );
    scene.add(dmaBoundary);

    // Posterior heatmap (InstancedMesh — 32×32 = 1024 cells)
    const heatGeo = new THREE.PlaneGeometry(CELL_SIZE * 0.92, CELL_SIZE * 0.92);
    heatGeo.rotateX(-Math.PI / 2);
    const heatMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const heatMesh = new THREE.InstancedMesh(heatGeo, heatMat, GRID_N * GRID_N);
    heatMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(GRID_N * GRID_N * 3),
      3,
    );
    scene.add(heatMesh);

    // Initialize cell positions + black color
    const dummy = new THREE.Object3D();
    let hi = 0;
    const cellCenter = (i: number, j: number) => ({
      x: -4 + (i + 0.5) * CELL_SIZE,
      z: -4 + (j + 0.5) * CELL_SIZE,
    });
    for (let i = 0; i < GRID_N; i++) {
      for (let j = 0; j < GRID_N; j++) {
        const c = cellCenter(i, j);
        dummy.position.set(c.x, 0.01, c.z);
        dummy.updateMatrix();
        heatMesh.setMatrixAt(hi, dummy.matrix);
        heatMesh.setColorAt(hi, new THREE.Color(0x000000));
        hi++;
      }
    }
    heatMesh.instanceMatrix.needsUpdate = true;
    if (heatMesh.instanceColor) heatMesh.instanceColor.needsUpdate = true;
    heatMeshRef.current = heatMesh;

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
      const time = clock.getElapsedTime();

      // Flow particles drift along +x
      const fps = flowParticlesRef.current;
      fps.forEach((particle, i) => {
        particle.position.x = -5 + ((i * 0.5 + time * 2.5) % 10);
        particle.position.z = Math.sin(time * 1.5 + i) * 0.08;
      });

      // Leak particles
      const lg = leakGroupRef.current;
      if (lg) {
        if (state.leakActive) {
          lg.children.forEach((particle, i) => {
            const y = (i * 0.12 + time * 1.8) % 1.5;
            particle.position.y = y;
            particle.position.x =
              Math.sin(time * 2.5 + i) * 0.2 * (1 - y / 1.5);
            particle.position.z =
              Math.cos(time * 2.5 + i) * 0.2 * (1 - y / 1.5);
            const mat = particle.material as THREE.MeshPhongMaterial;
            mat.opacity = 0.8 * (1 - y / 1.5);
          });
          lg.visible = true;
        } else {
          lg.visible = false;
        }
      }

      // Rotating sensors
      if (flowSensorRef.current) flowSensorRef.current.rotation.y += 0.02;
      if (pressureSensorRef.current)
        pressureSensorRef.current.rotation.y += 0.02;
      if (valveWheelRef.current) valveWheelRef.current.rotation.z += 0.01;

      // Sensor color states
      const fs = flowSensorRef.current;
      if (fs) {
        if (state.currentFlow > state.baselineFlow * 1.1) {
          fs.material = new THREE.MeshPhongMaterial({
            color: 0xffb800,
            emissive: 0x4d3300,
          });
        } else if (state.currentFlow < 0) {
          fs.material = new THREE.MeshPhongMaterial({
            color: 0xff4d4d,
            emissive: 0x4d0000,
          });
        } else {
          fs.material = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            emissive: 0x004d66,
          });
        }
      }

      // Tilt mode → camera orbits via device orientation
      if (tiltEnabled && cameraRef.current) {
        tiltCurrentRef.current.x +=
          (tiltTargetRef.current.x - tiltCurrentRef.current.x) * 0.1;
        tiltCurrentRef.current.y +=
          (tiltTargetRef.current.y - tiltCurrentRef.current.y) * 0.1;
        const cx = tiltCurrentRef.current.x;
        const cy = tiltCurrentRef.current.y;
        cameraRef.current.position.x = 12 * Math.sin(cy) * Math.cos(cx);
        cameraRef.current.position.y = 12 * Math.sin(cx) * 0.5;
        cameraRef.current.position.z = 12 * Math.cos(cy) * Math.cos(cx);
        cameraRef.current.lookAt(0, 0, 0);
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Device orientation handler
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!tiltEnabled) return;
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      tiltTargetRef.current.x = THREE.MathUtils.degToRad(beta - 90);
      tiltTargetRef.current.y = THREE.MathUtils.degToRad(gamma);
    };
    if (tiltEnabled) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // Cleanup
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('deviceorientation', handleOrientation);
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    };
  }, [tiltEnabled]);

  // Update heatmap colors when posterior changes
  useEffect(() => {
    const heatMesh = heatMeshRef.current;
    if (!heatMesh) return;
    let maxP = 0;
    for (let k = 0; k < posterior.length; k++) {
      if (posterior[k] > maxP) maxP = posterior[k];
    }
    const color = new THREE.Color();
    let hi = 0;
    for (let i = 0; i < GRID_N; i++) {
      for (let j = 0; j < GRID_N; j++) {
        const norm = maxP > 0 ? posterior[hi] / maxP : 0;
        const { h, s, l } = posteriorToColor(norm);
        color.setHSL(h, s, l);
        heatMesh.setColorAt(hi, color);
        hi++;
      }
    }
    if (heatMesh.instanceColor) heatMesh.instanceColor.needsUpdate = true;
  }, [posterior]);

  // Update leak particle position when trueLeak changes
  useEffect(() => {
    const lg = leakGroupRef.current;
    if (!lg || !state.trueLeak) return;
    lg.position.set(state.trueLeak.x, 0.2, state.trueLeak.z);
  }, [state.trueLeak]);

  // Reveal leak marker on verification
  useEffect(() => {
    if (!state.verified || !state.trueLeak || !sceneRef.current) return;
    // Remove existing marker
    if (leakMarkerRef.current) {
      sceneRef.current.remove(leakMarkerRef.current);
      leakMarkerRef.current.geometry.dispose();
      (leakMarkerRef.current.material as THREE.Material).dispose();
    }
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshPhongMaterial({
        color: 0xff4d4d,
        emissive: 0x660000,
      }),
    );
    marker.position.set(state.mapCell.x, 0.3, state.mapCell.z);
    sceneRef.current.add(marker);
    leakMarkerRef.current = marker;
  }, [state.verified, state.mapCell, state.trueLeak]);

  return (
    <div
      ref={mountRef}
      className={className ?? 'w-full h-full'}
      style={{
        position: 'relative',
        background: '#020508',
        minHeight: '320px',
      }}
    />
  );
}
