"use client";
import { jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { EIS_HEX } from "@/lib/study/artifacts";
function ResearchTrack({
  artifact,
  verifications,
  verifying,
  selected,
  onSelect
}) {
  const canvasRef = useRef(null);
  const hoverRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    let raf = 0;
    const draw = () => {
      var _a, _b;
      const W = rect.width;
      const H = rect.height;
      const cx = W / 2;
      const cy = H / 2;
      const scale = Math.min(W, H) / 12;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      const project = (p) => ({
        x: cx + p[0] * scale,
        y: cy - p[1] * scale
      });
      for (const e of artifact.edges) {
        const from = artifact.components.find((c) => c.id === e.from);
        const to = artifact.components.find((c) => c.id === e.to);
        if (!from || !to) continue;
        const pa = project(from.base.position);
        const pb = project(to.base.position);
        const cycleEdge = ((_a = from.anomaly) == null ? void 0 : _a.kind) === "circular-citation" && ((_b = to.anomaly) == null ? void 0 : _b.kind) === "circular-citation";
        ctx.strokeStyle = cycleEdge ? verifications.size ? "#ef4444" : "#f87171" : "#475569";
        ctx.lineWidth = cycleEdge ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        const angle = Math.atan2(pb.y - pa.y, pb.x - pa.x);
        const arrowSize = 6;
        ctx.beginPath();
        ctx.moveTo(pb.x, pb.y);
        ctx.lineTo(
          pb.x - arrowSize * Math.cos(angle - Math.PI / 6),
          pb.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          pb.x - arrowSize * Math.cos(angle + Math.PI / 6),
          pb.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = cycleEdge ? "#ef4444" : "#475569";
        ctx.fill();
      }
      for (const c of artifact.components) {
        if (c.kind !== "node") continue;
        const p = project(c.base.position);
        const r = 14;
        const state = verifications.get(c.id);
        const isHover = hoverRef.current === c.id;
        const isSelected = selected === c.id;
        if (c.anomaly) {
          const t = Date.now() % 1500 / 1500;
          const pulseR = r + 6 + 4 * Math.sin(t * Math.PI * 2);
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = verifications.size ? EIS_HEX[state != null ? state : "UNTESTED"] : "#f87171";
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = state ? EIS_HEX[state] : c.base.color;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : isHover ? 2 : 1;
        ctx.strokeStyle = isSelected ? "#0ea5e9" : isHover ? "#7dd3fc" : "#1e293b";
        ctx.stroke();
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(c.label, p.x, p.y - r - 4);
      }
      if (verifying) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
        ctx.fillRect(8, 8, 180, 22);
        ctx.fillStyle = "#0f172a";
        ctx.font = "11px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.fillText("IVE verifying\u2026 (UI interactive)", 14, 23);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [artifact, verifications, verifying, selected]);
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref: canvasRef,
      className: "w-full h-full",
      onMouseMove: (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const scale = Math.min(rect.width, rect.height) / 12;
        let foundId = null;
        for (const c of artifact.components) {
          if (c.kind !== "node") continue;
          const px = cx + c.base.position[0] * scale;
          const py = cy - c.base.position[1] * scale;
          const dx = mx - px;
          const dy = my - py;
          if (dx * dx + dy * dy < 16 * 16) {
            foundId = c.id;
            break;
          }
        }
        hoverRef.current = foundId;
        canvas.style.cursor = foundId ? "pointer" : "default";
      },
      onClick: () => {
        if (hoverRef.current) onSelect(hoverRef.current);
      }
    }
  );
}
export {
  ResearchTrack
};
