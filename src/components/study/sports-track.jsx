"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EIS_HEX } from "@/lib/study/artifacts";
function SportsTrack({
  artifact,
  verifications,
  verifying,
  selected,
  onSelect
}) {
  var _a;
  const mountRef = useRef(null);
  const meshByIdRef = useRef(/* @__PURE__ */ new Map());
  const [timeSeconds, setTimeSeconds] = useState(0);
  const timeRef = useRef(0);
  const stateRef = useRef({
    verifications: /* @__PURE__ */ new Map(),
    selected: null,
    time: 0
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
  }, [selected]);
  useEffect(() => {
    stateRef.current.time = timeSeconds;
  }, [timeSeconds]);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(339478);
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
    const ambient = new THREE.AmbientLight(16777215, 0.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(16777215, 0.5);
    sun.position.set(8, 16, 8);
    scene.add(sun);
    const pitchGeo = new THREE.PlaneGeometry(20, 12);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 1467700,
      roughness: 1
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(20, 0.01, 12)),
      new THREE.LineBasicMaterial({ color: 16777215 })
    );
    border.position.y = 0.02;
    scene.add(border);
    const centerLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 12),
      new THREE.MeshBasicMaterial({ color: 16777215 })
    );
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.021;
    scene.add(centerLine);
    const group = new THREE.Group();
    scene.add(group);
    meshByIdRef.current = /* @__PURE__ */ new Map();
    for (const c of artifact.components) {
      const isPlayer = c.kind === "player";
      const isEvent = c.kind === "event";
      if (!isPlayer && !isEvent) continue;
      const radius2 = isPlayer ? 0.4 : 0.15;
      const geo = new THREE.SphereGeometry(radius2, 16, 12);
      const baseColor = new THREE.Color(c.base.color);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        emissive: 0,
        emissiveIntensity: 0,
        roughness: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...c.base.position);
      mesh.userData.componentId = c.id;
      mesh.userData.targetColor = baseColor.clone();
      mesh.userData.visible = !isEvent;
      mesh.visible = mesh.userData.visible;
      group.add(mesh);
      meshByIdRef.current.set(c.id, {
        mesh,
        baseColor,
        componentId: c.id,
        anomaly: c.anomaly
      });
    }
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
    const onDown = (e) => {
      var _a2, _b;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (_b = (_a2 = e.target).setPointerCapture) == null ? void 0 : _b.call(_a2, e.pointerId);
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      theta -= dx * 8e-3;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - dy * 8e-3));
      updateCamera();
    };
    const onUp = () => {
      isDragging = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      radius = Math.max(8, Math.min(40, radius + e.deltaY * 0.03));
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
      var _a2;
      const t = performance.now();
      const currentT = stateRef.current.time;
      for (const [id, cm] of meshByIdRef.current) {
        const meta = (_a2 = artifact.components.find((c) => c.id === id)) == null ? void 0 : _a2.base.meta;
        if ((meta == null ? void 0 : meta.t) !== void 0) {
          const visible = Math.abs(meta.t - currentT) < 2;
          cm.mesh.visible = visible;
          if (visible) {
            const closeness = 1 - Math.abs(meta.t - currentT) / 2;
            cm.mesh.scale.setScalar(0.5 + closeness * 1.5);
          }
        }
        const mat = cm.mesh.material;
        const target = cm.mesh.userData.targetColor;
        if (target) mat.color.lerp(target, 0.08);
        if (cm.anomaly) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 5e-3);
          const baseEm = stateRef.current.selected === id ? 0.4 : 0;
          mat.emissiveIntensity = baseEm + pulse * 0.25;
          const state = stateRef.current.verifications.get(id);
          const pulseColor = state ? new THREE.Color(EIS_HEX[state]) : new THREE.Color(15680580);
          mat.emissive.lerp(pulseColor, 0.08);
        } else if (stateRef.current.selected === id) {
          mat.emissiveIntensity = 0.4;
          mat.emissive.lerp(new THREE.Color(959977), 0.1);
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
  const duration = (_a = artifact.durationSeconds) != null ? _a : 5400;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsx("div", { ref: mountRef, className: "flex-1 min-h-[400px]" }),
    /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-t bg-background/95", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-muted-foreground", children: [
          Math.floor(timeSeconds / 60),
          ":",
          String(Math.floor(timeSeconds) % 60).padStart(2, "0")
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: 0,
            max: duration,
            step: 1,
            value: timeSeconds,
            onChange: (e) => setTimeSeconds(parseInt(e.target.value)),
            className: "flex-1 accent-emerald-500"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-muted-foreground", children: [
          Math.floor(duration / 60),
          ":00"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "text-xs px-2 py-1 rounded border",
            onClick: () => setTimeSeconds(0),
            children: "Reset"
          }
        )
      ] }),
      (() => {
        var _a2;
        const current = (_a2 = artifact.timeline) == null ? void 0 : _a2.find(
          (e) => Math.abs(e.t - timeSeconds) < 2
        );
        if (!current) return null;
        return /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Event at ",
          Math.floor(current.t / 60),
          ":",
          String(current.t % 60).padStart(2, "0"),
          " \u2014 ",
          current.label
        ] });
      })()
    ] })
  ] });
}
export {
  SportsTrack
};
