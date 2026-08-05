"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, TerminalSquare } from "lucide-react";
import { useIveStore } from "@/store/useIveStore";
import { PanelFrame, SectionLabel, StatusPill } from "../primitives";

const ACCENT = "#3dffb0";

interface ReplayLine {
  cmd: string;
  output: string;
  level: "info" | "warn" | "error" | "success";
}

/**
 * Deterministic replay sequence. Read-only — no interactive execution.
 * Every line is a fixed engineering record of the IVE boot + release flow.
 */
const REPLAY_SEQUENCE: ReplayLine[] = [
  {
    cmd: "boot",
    output: "IVE runtime initialized. Engineering Release: BLOCKED.",
    level: "info",
  },
  {
    cmd: "load hbk-mkii",
    output: "HBK MK-II Hydro-Gateway loaded. Geometry: hydroGatewayMain.kcl",
    level: "success",
  },
  {
    cmd: "generate obligations",
    output: "0 obligations evaluated. Solver not linked.",
    level: "warn",
  },
  {
    cmd: "run solver",
    output: "BLOCKED_MISSING_INPUT. SMT solver (Z3) not linked.",
    level: "error",
  },
  {
    cmd: "write ledger",
    output: "Ledger written. Append-only. Single run initialized.",
    level: "success",
  },
  {
    cmd: "release status",
    output: "ENGINEERING RELEASE: BLOCKED. Missing engineering evidence.",
    level: "error",
  },
];

const LINE_INTERVAL_MS = 760;

const LEVEL_COLOR: Record<ReplayLine["level"], string> = {
  info: "#8b949e",
  warn: "#CC7722",
  error: "var(--ive-blocked)",
  success: "var(--ive-proven)",
};

/**
 * ReplayBody — owns the typing animation. The parent remounts this component
 * (via `key={replayNonce}`) on each Replay click, so the animation starts
 * fresh from 0 revealed lines without needing setState-in-effect.
 */
function ReplayBody({ circuitBreaker }: { circuitBreaker: string }) {
  const [revealed, setRevealed] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const id = window.setInterval(() => {
      if (!mounted) return;
      setRevealed((prev) => {
        if (prev >= REPLAY_SEQUENCE.length) {
          window.clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, LINE_INTERVAL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  // Auto-scroll to bottom whenever revealed changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [revealed]);

  const allDone = revealed >= REPLAY_SEQUENCE.length;
  const visibleLines = useMemo(
    () => REPLAY_SEQUENCE.slice(0, revealed),
    [revealed],
  );

  const cbAccent =
    circuitBreaker === "NORMAL"
      ? "var(--ive-proven)"
      : circuitBreaker === "DEGRADED"
        ? "#CC7722"
        : "var(--ive-blocked)";

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#06060b]">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--ive-blocked)]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#CC7722]/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--ive-proven)]/60" />
          <span className="ive-mono ml-2 text-[10px] text-muted-foreground/70">
            ive@proofbridge-liner: ~/ive-output
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill
            state={circuitBreaker}
            accent={cbAccent}
            pulse={circuitBreaker !== "NORMAL"}
          />
          <span className="ive-mono text-[9px] text-muted-foreground/50">
            {revealed}/{REPLAY_SEQUENCE.length} lines
          </span>
        </div>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="ive-scroll max-h-[420px] min-h-[260px] overflow-y-auto px-4 py-3"
      >
        {visibleLines.length === 0 && (
          <div className="ive-mono text-[12px] text-muted-foreground/50">
            <span style={{ color: ACCENT }}>ive&gt;</span> awaiting replay…{" "}
            <span className="ive-blink" style={{ color: ACCENT }}>
              _
            </span>
          </div>
        )}

        {visibleLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-2.5"
          >
            <div className="ive-mono flex items-center gap-2 text-[12.5px]">
              <span style={{ color: ACCENT }}>ive&gt;</span>
              <span className="text-foreground">{line.cmd}</span>
            </div>
            <div
              className="ive-mono ml-4 mt-0.5 border-l border-white/[0.06] pl-3 text-[11.5px] leading-relaxed"
              style={{ color: LEVEL_COLOR[line.level] }}
            >
              {line.output}
            </div>
          </motion.div>
        ))}

        {/* Trailing blinking cursor when fully replayed */}
        {allDone && (
          <div className="ive-mono mt-1 flex items-center gap-2 text-[12.5px]">
            <span style={{ color: ACCENT }}>ive&gt;</span>
            <span
              className="ive-blink inline-block h-3.5 w-2"
              style={{ background: ACCENT }}
            />
          </div>
        )}
      </div>

      {/* Read-only input line */}
      <div className="border-t border-white/[0.06] bg-white/[0.015] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="ive-mono text-[12.5px] font-semibold"
            style={{ color: ACCENT }}
          >
            ive&gt;
          </span>
          <input
            type="text"
            disabled
            value=""
            aria-label="read-only replay terminal — input disabled"
            placeholder="read-only · replay terminal"
            className="ive-mono flex-1 border-none bg-transparent text-[12px] text-muted-foreground/60 outline-none placeholder:text-muted-foreground/40"
          />
          <span className="ive-mono rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-muted-foreground/60">
            input disabled
          </span>
        </div>
      </div>
    </div>
  );
}

export function TerminalPanel() {
  const circuitBreaker = useIveStore((s) => s.circuitBreaker);
  const [replayNonce, setReplayNonce] = useState(0);

  const handleReplay = () => setReplayNonce((n) => n + 1);

  return (
    <PanelFrame
      title="Engineering Terminal"
      tag="TTY"
      accent={ACCENT}
      mission="Engineering command terminal — deterministic, read-only replay."
      actions={
        <div className="flex items-center gap-2">
          <span className="ive-mono rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            REPLAY
          </span>
          <button
            onClick={handleReplay}
            className="ive-mono inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Replay
          </button>
        </div>
      }
    >
      {/* Banner */}
      <div className="ive-surface flex items-start gap-3 rounded-lg border border-white/[0.06] p-4">
        <TerminalSquare className="mt-0.5 h-4 w-4 flex-none" style={{ color: ACCENT }} />
        <div>
          <div className="text-[12px] font-semibold text-foreground">
            Deterministic replay terminal.
          </div>
          <p className="ive-mono mt-1 text-[10px] leading-relaxed text-muted-foreground/70">
            No interactive command execution. Output is a fixed record of the IVE release
            flow. Cursor is decorative — input below is read-only.
          </p>
        </div>
      </div>

      {/* Terminal body — keyed by replayNonce so it remounts fresh on replay */}
      <ReplayBody key={replayNonce} circuitBreaker={circuitBreaker} />

      {/* Sequence manifest */}
      <div className="mt-6">
        <SectionLabel>Replay Sequence Manifest</SectionLabel>
        <div className="ive-surface overflow-hidden rounded-lg border border-white/[0.06]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="ive-mono px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  #
                </th>
                <th className="ive-mono px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  command
                </th>
                <th className="ive-mono px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  output
                </th>
                <th className="ive-mono px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  level
                </th>
              </tr>
            </thead>
            <tbody>
              {REPLAY_SEQUENCE.map((line, i) => (
                <tr
                  key={line.cmd}
                  className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="ive-mono px-3 py-2 text-[11px] text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="ive-mono px-3 py-2 text-[11px] text-foreground/90">
                    <span style={{ color: ACCENT }}>ive&gt;</span> {line.cmd}
                  </td>
                  <td
                    className="ive-mono px-3 py-2 text-[11px]"
                    style={{ color: LEVEL_COLOR[line.level] }}
                  >
                    {line.output}
                  </td>
                  <td className="ive-mono px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {line.level}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6">
        <div className="ive-surface flex items-start gap-3 rounded-lg border border-white/[0.06] p-4">
          <TerminalSquare className="mt-0.5 h-4 w-4 flex-none" style={{ color: ACCENT }} />
          <p className="ive-mono text-[10px] leading-relaxed text-muted-foreground/70">
            Replay is bounded and deterministic: 6 commands, fixed outputs, fixed
            cadence. No state mutates from this terminal. Engineering Release remains{" "}
            <span className="text-[var(--ive-blocked)]">BLOCKED</span> — the final line is
            the authoritative assertion.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}
