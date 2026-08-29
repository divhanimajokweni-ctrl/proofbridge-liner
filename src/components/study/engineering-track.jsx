"use client";
import { jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EIS_HEX } from "@/lib/study/artifacts";
function EngineeringTrack({
  artifact,
  verifications,
  verifying,
  selected,
  onSelect
}) {
  const mountRef = useRef(null);
  const meshByIdRef = useRef(/* @__PURE__ */ new Map());
  const stateRef = useRef({
    verifications: /* @__PURE__ */ new Map(),
    selected: null
  });
  useEffect(() => {
    stateRef.current.verifications = verifications;
    for (const [id, cm] of meshByIdRef.current) {
      const state = verifications.get(id);
      const targetColor = state ? new THREE.Color(EIS_HEX[state]) : cm.baseColor.clone();
      cm.mesh.userData.targetColor = targetColor;
    }
  }, [verifications]);
  useEffect(() => {
    stateRef.current.selected = selected;
    for (const [id, cm] of meshByIdRef.current) {
      const isSelected = id === selected;
      const mat = cm.mesh.material;
      mat.emissive.setHex(isSelected ? 959977 : 0);
      mat.emissiveIntensity = isSelected ? 0.4 : 0;
    }
  }, [selected]);
  useEffect(() => {
    var _a, _b, _c, _d, _e, _f;
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(725536);
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
    const ambient = new THREE.AmbientLight(16777215, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(16777215, 0.8);
    sun.position.set(8, 12, 6);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(8965375, 0.25);
    fill.position.set(-6, 4, -4);
    scene.add(fill);
    const grid = new THREE.GridHelper(20, 20, 1976635, 1976635);
    grid.material.transparent = true;
    grid.material.opacity = 0.4;
    scene.add(grid);
    const group = new THREE.Group();
    scene.add(group);
    meshByIdRef.current = /* @__PURE__ */ new Map();
    for (const c of artifact.components) {
      const geo = new THREE.BoxGeometry(
        (_b = (_a = c.base.scale) == null ? void 0 : _a[0]) != null ? _b : 1,
        (_d = (_c = c.base.scale) == null ? void 0 : _c[1]) != null ? _d : 1,
        (_f = (_e = c.base.scale) == null ? void 0 : _e[2]) != null ? _f : 1
      );
      const baseColor = new THREE.Color(c.base.color);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        roughness: 0.85,
        metalness: c.kind === "beam" ? 0.4 : 0.1
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
        anomaly: c.anomaly
      });
    }
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
    const onDown = (e) => {
      var _a2, _b2;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (_b2 = (_a2 = e.target).setPointerCapture) == null ? void 0 : _b2.call(_a2, e.pointerId);
    };
    const onMove = (e) => {
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
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.max(4, Math.min(30, radius + e.deltaY * 0.02));
      updateCamera();
    };
    const onClick = (e) => {
      if (isDragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        (e.clientX - rect.left) / rect.width * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(group.children, false);
      if (hits[0]) {
        const id = hits[0].object.userData.componentId;
        if (id) onSelect(id);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);
    let raf = 0;
    const animate = () => {
      const t = performance.now();
      for (const [, cm] of meshByIdRef.current) {
        const mat = cm.mesh.material;
        const target = cm.mesh.userData.targetColor;
        if (target) {
          mat.color.lerp(target, 0.08);
        }
        if (cm.anomaly) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 5e-3);
          mat.emissiveIntensity = (stateRef.current.selected === cm.componentId ? 0.4 : 0) + pulse * 0.25;
          const state = stateRef.current.verifications.get(cm.componentId);
          const pulseColor = state ? new THREE.Color(EIS_HEX[state]) : new THREE.Color(15680580);
          mat.emissive.lerp(pulseColor, 0.08);
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
  return /* @__PURE__ */ jsx("div", { ref: mountRef, className: "w-full h-full" });
}
export {
  EngineeringTrack
};
