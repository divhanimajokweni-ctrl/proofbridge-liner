"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useWorkspace } from "@/lib/workspace";
import {
  useTheoremStore,
  stageForWorkspace,
  stageForCockpit
} from "@/lib/theorem/theorem-store";
const NODE_COUNT = 650;
const STAGE_CONFIG = [
  { text: "0. GLOBAL SPHERE", color: "#7c8bf5" },
  { text: "1. ANT MASCOT (ANTONE)", color: "#c07a40" },
  { text: "2. KINETIC WEB SPIDER", color: "#e67e22" },
  { text: "3. MILES SPIDER-MAN", color: "#e74c3c" }
];
const WORKSPACE_RANGE = {
  studi: [0, 1],
  ive: [2, 3]
};
function rand(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}
function getSpherePos(i) {
  const phi = Math.acos(-1 + 2 * i / NODE_COUNT);
  const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
  return new THREE.Vector3(
    Math.cos(theta) * Math.sin(phi) * 1.1,
    Math.sin(theta) * Math.sin(phi) * 1.1,
    Math.cos(phi) * 1.1
  );
}
function getAntPos(i) {
  const ratio = i / NODE_COUNT;
  let x = 0, y = 0, z = (rand(i + 5) - 0.5) * 0.05;
  if (ratio < 0.25) {
    const a = rand(i + 1) * Math.PI * 2;
    const dist = Math.sqrt(rand(i + 2)) * 0.35;
    x = -0.6 + dist * Math.cos(a) * 1.2;
    y = -0.15 + dist * Math.sin(a);
  } else if (ratio < 0.45) {
    const a = rand(i + 1) * Math.PI * 2;
    const dist = Math.sqrt(rand(i + 2)) * 0.18;
    x = -0.1 + dist * Math.cos(a);
    y = 0.05 + dist * Math.sin(a);
  } else if (ratio < 0.65) {
    const a = rand(i + 1) * Math.PI * 2;
    const dist = Math.sqrt(rand(i + 2)) * 0.18;
    x = 0.35 + dist * Math.cos(a);
    y = 0.25 + dist * Math.sin(a);
  } else {
    const leg = i % 6;
    const p = rand(i + 3);
    if (leg === 0) {
      x = -0.2 - p * 0.3;
      y = 0.05 + p * 0.4;
    }
    if (leg === 1) {
      x = -0.1 - p * 0.4;
      y = 0.05 - p * 0.2;
    }
    if (leg === 2) {
      x = 0 - p * 0.2;
      y = 0 - p * 0.5;
    }
    if (leg === 3) {
      x = -0.1 + p * 0.3;
      y = 0.05 + p * 0.5;
    }
    if (leg === 4) {
      x = 0 + p * 0.4;
      y = 0.05 - p * 0.1;
    }
    if (leg === 5) {
      x = 0.1 + p * 0.2;
      y = 0 - p * 0.5;
    }
  }
  return new THREE.Vector3(x, y, z);
}
function getWebSpiderPos(i) {
  const ratio = i / NODE_COUNT;
  let x = 0, y = 0, z = 0;
  if (ratio < 0.3) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.22;
    x = r * Math.cos(a);
    y = r * Math.sin(a) * 1.3;
  } else if (ratio < 0.45) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.1;
    x = r * Math.cos(a);
    y = 0.28 + r * Math.sin(a);
  } else {
    const leg = i % 8;
    const p = rand(i + 2);
    const angle = leg * Math.PI / 4 + 0.2;
    x = Math.cos(angle) * (0.2 + p * 0.6);
    y = Math.sin(angle) * (0.25 + p * 0.6) * 1.2;
  }
  return new THREE.Vector3(x, y - 0.2, z);
}
function getSpideyPos(i) {
  const ratio = i / NODE_COUNT;
  let x = 0, y = 0, z = 0;
  let isRed = false;
  if (ratio < 0.12) {
    isRed = true;
    const p = rand(i);
    const leg = i % 8;
    const a = leg * Math.PI / 4 + rand(i + 1) * 0.1;
    x = Math.cos(a) * (p * 0.3);
    y = 0.2 + Math.sin(a) * (p * 0.28);
  } else if (ratio < 0.18) {
    isRed = true;
    const side = i % 2 === 0 ? 1 : -1;
    const p = rand(i);
    x = 0.12 * side + (rand(i + 1) - 0.5) * 0.08 + p * 0.05 * side;
    y = 0.65 + p * 0.15;
  } else if (ratio < 0.4) {
    const p = rand(i);
    x = -0.15 - p * 0.75;
    y = 0.45 - Math.sin(p * Math.PI * 0.6) * 0.25;
  } else if (ratio < 0.65) {
    const a = rand(i) * Math.PI * 2;
    const r = Math.sqrt(rand(i + 1)) * 0.28;
    x = 0.2 + r * Math.cos(a) * 1.2;
    y = 0.3 + r * Math.sin(a);
  } else if (ratio < 0.82) {
    const p = rand(i);
    x = -0.7 + p * 0.6;
    y = -0.3 - Math.sin(p * Math.PI * 0.5) * 0.3;
  } else {
    const p = rand(i);
    x = 0.1 + p * 0.8;
    y = 0.1 - p * 0.6;
  }
  return { pos: new THREE.Vector3(x * 1.4, (y - 0.1) * 1.4, z), isRed };
}
function buildNodeCache() {
  const cache = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const spideyData = getSpideyPos(i);
    cache.push({
      s0: getSpherePos(i),
      s1: getAntPos(i),
      s2: getWebSpiderPos(i),
      s3: spideyData.pos,
      isRed: spideyData.isRed
    });
  }
  return cache;
}
function EvolutionMatrix({
  mode = "full",
  className,
  stageRange,
  dataDriven = false,
  combinedStage = false,
  ghostBufferEnabled = true,
  onGhostRender
}) {
  const { workspace } = useWorkspace();
  const containerRef = useRef(null);
  const sliderRef = useRef(null);
  const labelRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [smokeEnabled, setSmokeEnabled] = useState(false);
  const targetStage = useTheoremStore((s) => {
    if (!dataDriven) return null;
    return combinedStage ? stageForCockpit(s) : stageForWorkspace(workspace, s);
  });
  const breakerTripped = useTheoremStore((s) => s.breaker === "TRIPPED");
  const iveVerdict = useTheoremStore((s) => s.iveVerdict);
  const studiVerdict = useTheoremStore((s) => s.studiVerdict);
  const confidence = useTheoremStore((s) => s.confidence);
  const isPlayingRef = useRef(isPlaying);
  const smokeEnabledRef = useRef(smokeEnabled);
  const workspaceRef = useRef(workspace);
  const dataDrivenRef = useRef(dataDriven);
  const targetStageRef = useRef(targetStage);
  const breakerTrippedRef = useRef(breakerTripped);
  const playDirectionRef = useRef(1);
  const phaseRef = useRef(
    stageRange ? stageRange[0] : WORKSPACE_RANGE[workspace][0]
  );
  const rangeRef = useRef(stageRange != null ? stageRange : WORKSPACE_RANGE[workspace]);
  const ghostTargetRef = useRef(null);
  const ghostScoreRef = useRef(0);
  const workerRef = useRef(null);
  const ghostBufferEnabledRef = useRef(ghostBufferEnabled);
  const onGhostRenderRef = useRef(onGhostRender);
  const studiVerdictRef = useRef(studiVerdict);
  const iveVerdictRef = useRef(iveVerdict);
  const confidenceRef = useRef(confidence);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    smokeEnabledRef.current = smokeEnabled;
  }, [smokeEnabled]);
  useEffect(() => {
    targetStageRef.current = targetStage;
  }, [targetStage]);
  useEffect(() => {
    breakerTrippedRef.current = breakerTripped;
  }, [breakerTripped]);
  useEffect(() => {
    dataDrivenRef.current = dataDriven;
  }, [dataDriven]);
  useEffect(() => {
    ghostBufferEnabledRef.current = ghostBufferEnabled;
  }, [ghostBufferEnabled]);
  useEffect(() => {
    onGhostRenderRef.current = onGhostRender;
  }, [onGhostRender]);
  useEffect(() => {
    studiVerdictRef.current = studiVerdict;
  }, [studiVerdict]);
  useEffect(() => {
    iveVerdictRef.current = iveVerdict;
  }, [iveVerdict]);
  useEffect(() => {
    confidenceRef.current = confidence;
  }, [confidence]);
  useEffect(() => {
    workspaceRef.current = workspace;
    if (!dataDriven && !stageRange) {
      rangeRef.current = WORKSPACE_RANGE[workspace];
    }
  }, [workspace, stageRange, dataDriven]);
  useEffect(() => {
    if (!ghostBufferEnabled) return;
    if (typeof Worker === "undefined") return;
    let worker;
    try {
      worker = new Worker("/intentWorker.js");
    } catch (e) {
      return;
    }
    workerRef.current = worker;
    worker.onmessage = (ev) => {
      var _a;
      const data = ev.data || {};
      if (data.type === "ALLOW") {
        const stage = typeof data.stage === "number" ? data.stage : null;
        if (stage === null) return;
        if (breakerTrippedRef.current && stage > 2) return;
        ghostTargetRef.current = stage;
        ghostScoreRef.current = typeof data.score === "number" ? data.score : 0;
        (_a = onGhostRenderRef.current) == null ? void 0 : _a.call(onGhostRenderRef, `stage_${stage}`, ghostScoreRef.current);
      } else if (data.type === "DENY") {
        ghostTargetRef.current = null;
      }
    };
    let lastSend = 0;
    const sendVector = () => {
      if (!workerRef.current) return;
      const now = performance.now();
      if (now - lastSend < 50) return;
      lastSend = now;
      const score = Math.min(
        1,
        confidenceRef.current * 0.7 + 0.3 + (Math.random() * 0.05 - 0.025)
      );
      const studiGatesMet = studiVerdictRef.current === "PROVEN" ? 1 : 0;
      const iveClaimsAuth = iveVerdictRef.current === "PROVEN" ? 1 : iveVerdictRef.current === "INCONCLUSIVE" ? 0.3 : 0;
      const conjuncts = iveVerdictRef.current === "PROVEN" ? { C: true, E: true, I: true, S: true, R: true } : { C: false, E: false, I: false, S: false, R: false };
      workerRef.current.postMessage({
        type: "VECTOR",
        sessionId: "evolution-matrix",
        input: {
          score,
          breakerTripped: breakerTrippedRef.current,
          studiGatesMet,
          iveClaimsAuth,
          conjuncts
        }
      });
    };
    const interval = window.setInterval(sendVector, 200);
    const sendImmediate = () => sendVector();
    window.addEventListener("mousemove", sendImmediate, { passive: true });
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("mousemove", sendImmediate);
      worker.terminate();
      workerRef.current = null;
    };
  }, [ghostBufferEnabled]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 0, 4.5);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const dotGeometry = new THREE.CircleGeometry(0.015, 8);
    const instancedMesh = new THREE.InstancedMesh(
      dotGeometry,
      new THREE.MeshBasicMaterial({
        color: 16777215,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92
      }),
      NODE_COUNT
    );
    scene.add(instancedMesh);
    const ghostGeometry = new THREE.CircleGeometry(0.015, 8);
    const ghostMesh = new THREE.InstancedMesh(
      ghostGeometry,
      new THREE.MeshBasicMaterial({
        color: 16777215,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
        // invisible — just a pre-render cache
      }),
      NODE_COUNT
    );
    ghostMesh.visible = false;
    scene.add(ghostMesh);
    const white = new THREE.Color(16777215);
    const spiderRed = new THREE.Color(16720435);
    const cache = buildNodeCache();
    const dummy = new THREE.Object3D();
    const ghostDummy = new THREE.Object3D();
    const stageConfig = STAGE_CONFIG;
    function updateGhostBuffer(stage) {
      const s = Math.max(0, Math.min(3, Math.floor(stage)));
      for (let i = 0; i < NODE_COUNT; i++) {
        const node = cache[i];
        let pos;
        if (s === 0) pos = node.s0;
        else if (s === 1) pos = node.s1;
        else if (s === 2) pos = node.s2;
        else pos = node.s3;
        ghostDummy.position.copy(pos);
        const scale = s === 3 ? node.isRed ? 1.6 : 1.1 : 1;
        ghostDummy.scale.set(scale, scale, scale);
        ghostDummy.updateMatrix();
        ghostMesh.setMatrixAt(i, ghostDummy.matrix);
      }
      ghostMesh.instanceMatrix.needsUpdate = true;
    }
    function updateNodes(val, pulseRed) {
      const stage = Math.floor(val);
      const frac = val - stage;
      const idx = Math.min(stage, 3);
      if (labelRef.current) {
        labelRef.current.innerText = stageConfig[idx].text;
        labelRef.current.style.color = stageConfig[idx].color;
        labelRef.current.setAttribute("data-stage", idx.toString());
        labelRef.current.setAttribute(
          "data-breaker",
          breakerTrippedRef.current ? "TRIPPED" : "NORMAL"
        );
      }
      const pulseT = Date.now() * 15e-4;
      const pulseScale = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(pulseT * Math.PI));
      for (let i = 0; i < NODE_COUNT; i++) {
        const node = cache[i];
        let fromPos;
        let toPos;
        if (stage === 0) {
          fromPos = node.s0;
          toPos = node.s1;
        } else if (stage === 1) {
          fromPos = node.s1;
          toPos = node.s2;
        } else {
          fromPos = node.s2;
          toPos = node.s3;
        }
        const ease = frac * frac * (3 - 2 * frac);
        dummy.position.lerpVectors(fromPos, toPos, ease);
        if (smokeEnabledRef.current && stage >= 2) {
          const strength = stage === 2 ? ease * 0.3 : 0.3;
          dummy.position.x += (rand(i * 10) - 0.5) * strength;
          dummy.position.y += (rand(i * 20) - 0.5) * strength;
          dummy.position.z += (rand(i * 30) - 0.5) * strength;
        }
        let scale = 1;
        if (stage === 0) {
          const time = Date.now() * 1e-3;
          const pseudoRotZ = Math.sin(node.s0.x + time) * 0.5;
          scale = (pseudoRotZ + 1.2) * 1.1;
        } else if (stage === 3) {
          scale = node.isRed ? 1.6 : 1.1;
        }
        dummy.scale.set(scale, scale, scale);
        if (stage >= 2) {
          const colorEase = stage === 2 ? ease : 1;
          const finalColor = node.isRed ? spiderRed : white;
          const baseColor = new THREE.Color().lerpColors(
            white,
            finalColor,
            colorEase
          );
          if (pulseRed && node.isRed) {
            baseColor.multiplyScalar(0.55 + 0.45 * pulseScale);
          }
          instancedMesh.setColorAt(i, baseColor);
        } else {
          instancedMesh.setColorAt(i, white);
        }
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    }
    let animationFrameId;
    let lastGhostTarget = null;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const pulseRed = breakerTrippedRef.current && Math.abs(phaseRef.current - 2) < 0.6;
      const gt = ghostTargetRef.current;
      if (gt !== null && gt !== lastGhostTarget) {
        updateGhostBuffer(gt);
        lastGhostTarget = gt;
      }
      if (dataDrivenRef.current) {
        let target = null;
        if (ghostTargetRef.current !== null && (targetStageRef.current === null || ghostTargetRef.current !== targetStageRef.current)) {
          target = ghostTargetRef.current;
        } else if (targetStageRef.current !== null) {
          target = targetStageRef.current;
        }
        if (target !== null) {
          const cur = phaseRef.current;
          const speed = mode === "hero" ? 0.012 : 0.02;
          const delta = target - cur;
          if (Math.abs(delta) < 1e-3) {
            phaseRef.current = target;
          } else {
            phaseRef.current = cur + delta * Math.min(1, speed * 1.5);
          }
          if (sliderRef.current) {
            sliderRef.current.value = phaseRef.current.toString();
          }
        }
      } else if (isPlayingRef.current) {
        const [lo, hi] = rangeRef.current;
        let val = phaseRef.current;
        const step = mode === "hero" ? 25e-4 : 5e-3;
        val += step * playDirectionRef.current;
        if (val >= hi) {
          val = hi;
          playDirectionRef.current = -1;
        }
        if (val <= lo) {
          val = lo;
          playDirectionRef.current = 1;
        }
        phaseRef.current = val;
        if (sliderRef.current) {
          sliderRef.current.value = val.toString();
        }
      }
      if (phaseRef.current < 0.1) {
        instancedMesh.rotation.y += 3e-3;
      } else {
        instancedMesh.rotation.y *= 0.99;
      }
      updateNodes(phaseRef.current, pulseRed);
      renderer.render(scene, camera);
    };
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      renderer.dispose();
      dotGeometry.dispose();
      ghostGeometry.dispose();
      instancedMesh.material.dispose();
      ghostMesh.material.dispose();
      instancedMesh.dispose();
      ghostMesh.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);
  if (mode === "hero") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: containerRef,
        className,
        "data-test": "evolution-matrix",
        "data-workspace": workspace,
        "data-stage": Math.floor(targetStage != null ? targetStage : phaseRef.current),
        "data-breaker": breakerTripped ? "TRIPPED" : "NORMAL",
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.55,
          mixBlendMode: "screen"
        },
        "aria-hidden": true
      }
    );
  }
  const startStage = dataDriven ? targetStage != null ? targetStage : phaseRef.current : phaseRef.current;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className,
      "data-test": "evolution-matrix",
      "data-workspace": workspace,
      "data-stage": Math.floor(startStage),
      "data-breaker": breakerTripped ? "TRIPPED" : "NORMAL",
      "data-ghost-target": ghostTargetRef.current !== null ? String(ghostTargetRef.current) : "none",
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 480,
        background: "radial-gradient(circle at 50% 45%, #0a0a0a 0%, #050505 70%, #020202 100%)",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #222"
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: containerRef,
            style: { position: "absolute", inset: 0, width: "100%", height: "100%" }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: labelRef,
            "data-stage": Math.floor(startStage),
            "data-breaker": breakerTripped ? "TRIPPED" : "NORMAL",
            style: {
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: 14,
              color: STAGE_CONFIG[0].color,
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              fontFamily: "var(--font-geist-mono, monospace)",
              background: "rgba(15,15,15,0.6)",
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #2a2a2a",
              backdropFilter: "blur(8px)"
            },
            children: STAGE_CONFIG[Math.floor(startStage)].text
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 20,
              left: 20,
              zIndex: 10,
              color: "#888",
              fontSize: 10,
              letterSpacing: 1.5,
              fontFamily: "var(--font-geist-mono, monospace)",
              textTransform: "uppercase"
            },
            children: [
              "VVU \xB7 ",
              combinedStage ? "COCKPIT" : workspace.toUpperCase(),
              /* @__PURE__ */ jsx("span", { style: { color: "#444", margin: "0 6px" }, children: "\xB7" }),
              /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    color: breakerTripped ? "#e74c3c" : combinedStage ? "#e67e22" : workspace === "studi" ? "#7c8bf5" : "#e74c3c"
                  },
                  children: breakerTripped ? "BREAKER TRIPPED" : "BREAKER NORMAL"
                }
              ),
              ghostTargetRef.current !== null && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { style: { color: "#444", margin: "0 6px" }, children: "\xB7" }),
                /* @__PURE__ */ jsxs("span", { style: { color: "#10b981" }, children: [
                  "GHOST \xB7 stage_",
                  ghostTargetRef.current
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              background: "rgba(15,15,15,0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid #333",
              borderRadius: 999,
              padding: "10px 20px",
              display: "flex",
              gap: 16,
              alignItems: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.7)"
            },
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: sliderRef,
                  type: "range",
                  min: "0",
                  max: "3",
                  step: "0.001",
                  defaultValue: startStage.toString(),
                  "aria-label": "Evolution stage",
                  style: {
                    WebkitAppearance: "none",
                    appearance: "none",
                    width: 260,
                    height: 6,
                    background: "linear-gradient(90deg, #4a90e2, #c07a40, #e67e22, #e74c3c)",
                    borderRadius: 3,
                    outline: "none",
                    cursor: "pointer"
                  },
                  onChange: (e) => {
                    phaseRef.current = parseFloat(e.target.value);
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setIsPlaying((p) => !p),
                  style: {
                    background: "#222",
                    border: "1px solid #444",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "var(--font-geist-mono, monospace)"
                  },
                  children: isPlaying ? "\u23F8 Pause" : "\u25B6 Play"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSmokeEnabled((s) => !s),
                  style: {
                    background: smokeEnabled ? "#444" : "#222",
                    border: smokeEnabled ? "1px solid #666" : "1px solid #444",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "var(--font-geist-mono, monospace)"
                  },
                  children: smokeEnabled ? "\u{1F4A8} Smoke: ON" : "\u{1F4A8} Smoke"
                }
              )
            ]
          }
        )
      ]
    }
  );
}
export {
  EvolutionMatrix
};
