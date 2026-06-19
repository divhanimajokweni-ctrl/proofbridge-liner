import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';


const HUB_LOCATIONS = [
  { id: 'JHB', name: 'Johannesburg (ZA)', lat: -26.2041, lon: 28.0473, isAlert: true, ip: '102.14.88.24', ping: '12ms' },
  { id: 'CPT', name: 'Cape Town (ZA)', lat: -33.9249, lon: 18.4241, isAlert: true, ip: '102.14.90.11', ping: '14ms' },
  { id: 'PLZ', name: 'Gqeberha (ZA)', lat: -33.9608, lon: 25.6022, isAlert: true, ip: '196.22.41.105', ping: '19ms' },
  { id: 'NY', name: 'New York (US)', lat: 40.7128, lon: -74.0060, isAlert: false, ip: '216.58.217.46', ping: '164ms' },
  { id: 'LDN', name: 'London (UK)', lat: 51.5074, lon: -0.1278, isAlert: false, ip: '195.154.122.1', ping: '92ms' }
];

const TELEMETRY_ROUTES = [
  { source: 'JHB', target: 'LDN' },
  { source: 'CPT', target: 'NY' },
  { source: 'PLZ', target: 'LDN' },
  { source: 'JHB', target: 'PLZ' },
  { source: 'JHB', target: 'CPT' }
];

export default function AdvancedGlobeTelemetry() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<typeof HUB_LOCATIONS[0] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(130, 80, 160);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 80;
    controls.maxDistance = 300;
    controls.enablePan = false;

    scene.add(new THREE.AmbientLight(0x0e1622, 2.0));
    const dirLight = new THREE.DirectionalLight(0x5ca2e6, 1.5);
    dirLight.position.set(150, 150, 100);
    scene.add(dirLight);

    const globeRadius = 60;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com');

    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      color: 0x121b26,
      roughness: 0.7,
      metalness: 0.3,
      transparent: true,
      opacity: 0.95
    });
    const globeGroup = new THREE.Group();
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);
    scene.add(globeGroup);

    const atmosphericRing = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius + 1.2, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0x1d3d54, wireframe: true, transparent: true, opacity: 0.05 })
    );
    globeGroup.add(atmosphericRing);

    function convertLatLngToVector3(lat: number, lon: number, radius: number) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.sin(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
    }

    const markerGroup = new THREE.Group();
    const hitBoxObjects: THREE.Object3D[] = [];
    const pulseRingsArray: THREE.Mesh[] = [];

    HUB_LOCATIONS.forEach(loc => {
      const pos = convertLatLngToVector3(loc.lat, loc.lon, globeRadius);
      const nodeMarkerGroup = new THREE.Group();
      nodeMarkerGroup.position.copy(pos);

      const coreMarker = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({
          color: loc.isAlert ? 0xff3333 : 0x00e5ff,
          emissive: loc.isAlert ? 0xff1111 : 0x00a8cc,
          emissiveIntensity: 1.8,
        })
      );
      nodeMarkerGroup.add(coreMarker);

      if (loc.isAlert) {
        const pulseRing = new THREE.Mesh(
          new THREE.SphereGeometry(1.0, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.6, wireframe: true })
        );
        nodeMarkerGroup.add(pulseRing);
        pulseRingsArray.push(pulseRing);
      }

      const hitBox = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.userData = { nodeData: loc };
      nodeMarkerGroup.add(hitBox);
      hitBoxObjects.push(hitBox);

      markerGroup.add(nodeMarkerGroup);
    });
    globeGroup.add(markerGroup);

    TELEMETRY_ROUTES.forEach(route => {
      const srcNode = HUB_LOCATIONS.find(n => n.id === route.source);
      const tgtNode = HUB_LOCATIONS.find(n => n.id === route.target);
      if (!srcNode || !tgtNode) return;

      const pStart = convertLatLngToVector3(srcNode.lat, srcNode.lon, globeRadius);
      const pEnd = convertLatLngToVector3(tgtNode.lat, tgtNode.lon, globeRadius);

      const dist = pStart.distanceTo(pEnd);
      const pMid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
      const altitudeScale = dist * 0.28;
      pMid.normalize().multiplyScalar(globeRadius + altitudeScale);

      const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
      const points = curve.getPoints(40);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: srcNode.isAlert ? 0xff5555 : 0x4aa3a5,
        transparent: true,
        opacity: srcNode.isAlert ? 0.35 : 0.15,
        blending: THREE.AdditiveBlending
      });

      const lineMesh = new THREE.Line(curveGeo, curveMat);
      globeGroup.add(lineMesh);
    });

    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse2D.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse2D.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse2D, camera);
      const intersections = raycaster.intersectObjects(hitBoxObjects);

      if (intersections.length > 0) {
        const targetedObj = intersections[0].object;
        const data = targetedObj.userData.nodeData as typeof HUB_LOCATIONS[0];
        setHoveredNode(data);
        setTooltipPos({
          x: event.clientX - rect.left + 15,
          y: event.clientY - rect.top + 15
        });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }
    };

    container.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const _delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      globeGroup.rotation.y = elapsed * 0.05;

      controls.update();

      pulseRingsArray.forEach((ring, idx) => {
        const offset = idx * 0.5;
        const scaleVal = 1.0 + Math.abs(Math.sin(elapsed * 4.0 + offset)) * 3.5;
        ring.scale.set(scaleVal, scaleVal, scaleVal);
        if (!Array.isArray(ring.material) && ring.material) {
          ring.material.opacity = 0.6 * (1.0 - (scaleVal / 4.5));
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section style={{ backgroundColor: '#05070B', border: '1px solid #141B25', borderRadius: '6px', padding: '1.25rem', marginTop: '1.5rem', fontFamily: 'monospace', color: '#8F9CAE', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #141B25', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <span style={{ color: '#00E5FF', fontWeight: 'bold' }}>NETWORK_INTERCEPT_MAP // </span>
          <span style={{ color: '#FFF' }}>3D FLIGHT ARCS ACTIVE</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#526660' }}>DRAG TO ROTATE • SCROLL TO ZOOM</div>
      </div>

      <div
        ref={containerRef}
        style={{ width: '100%', height: '550px', backgroundColor: '#020305', borderRadius: '4px', position: 'relative', overflow: 'hidden', border: '1px solid #0B1118' }}
      />

      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            backgroundColor: 'rgba(5, 9, 15, 0.95)',
            border: hoveredNode.isAlert ? '1px solid #FF3333' : '1px solid #00E5FF',
            boxShadow: hoveredNode.isAlert ? '0 0 10px rgba(255,51,51,0.2)' : '0 0 10px rgba(0,229,255,0.2)',
            borderRadius: '3px',
            padding: '0.6rem 0.8rem',
            color: '#FFF',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 100,
            minWidth: '180px'
          }}
        >
          <div style={{ fontWeight: 'bold', color: hoveredNode.isAlert ? '#FF3333' : '#00E5FF', marginBottom: '0.25rem', borderBottom: '1px solid #223142', paddingBottom: '0.2rem' }}>
            {hoveredNode.isAlert ? '⚠️ DEFCON_BREACH' : '🌐 NODE_NOMINAL'}
          </div>
          <div>STATION: <span style={{ color: '#FFF' }}>{hoveredNode.name}</span></div>
          <div>IP_ADDR: <span style={{ color: '#A0B2C6' }}>{hoveredNode.ip}</span></div>
          <div>LAT/LON: <span style={{ color: '#A0B2C6' }}>{hoveredNode.lat.toFixed(2)}, {hoveredNode.lon.toFixed(2)}</span></div>
          <div style={{ marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
            PING: <span style={{ color: hoveredNode.isAlert ? '#FF8080' : '#00FF66' }}>{hoveredNode.ping}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.75rem', borderTop: '1px dashed #141B25', paddingTop: '0.75rem' }}>
        <div>ZA BACKHAUL EDGE: <span style={{ color: '#FF3333' }}>JHB → CPT → Gqeberha</span></div>
        <div>TRANSATLANTIC LINKS: <span style={{ color: '#00E5FF' }}>UK_BACKBONE (LDN) / US_EAST (NY)</span></div>
        <div>INTERCEPT SHIFT STATUS: <span style={{ color: '#FFF' }}>RAYCAST_LISTENER_ARMED</span></div>
      </div>
    </section>
  );
}
