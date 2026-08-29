import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Menu, Minimize2, Pickaxe } from "lucide-react";
import type { Pipe } from "./lib/engine";
import {
  computeStats,
  createNetwork,
  findLeakPipe,
  MAX_CYCLES,
  resetPipes,
  SEED,
  SeededRandom,
  STEP_INTERVAL_MS,
  step,
} from "./lib/engine";
import type { SimStatus } from "./lib/sim";
import { sha256Hex } from "./lib/hash";
import MapView, { type MapViewHandle } from "./components/MapView";
import SubsurfaceView, { type SubsurfaceHandle } from "./components/SubsurfaceView";
import TopBar from "./components/TopBar";
import ExportBar from "./components/ExportBar";
import Sidebar from "./components/Sidebar";

export default function App() {
  // Deterministic network, created once.
  const pipesRef = useRef<Pipe[] | null>(null);
  if (pipesRef.current === null) pipesRef.current = createNetwork(SEED);
  const pipes = pipesRef.current;

  const rngRef = useRef<SeededRandom>(new SeededRandom(SEED));
  const cycleRef = useRef(0);
  const selectedIdRef = useRef<string | null>(null);
  const statusRef = useRef<SimStatus>("ready");

  const [status, setStatusState] = useState<SimStatus>("ready");
  const [cycle, setCycle] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [protocol72, setProtocol72] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subsurfaceOpen, setSubsurfaceOpen] = useState(false);
  const [auditHash, setAuditHash] = useState("");

  const mapRef = useRef<MapViewHandle>(null);
  const threeRef = useRef<SubsurfaceHandle>(null);
  const rafRef = useRef<number | null>(null);
  const accRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);

  const setStatus = useCallback((s: SimStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const syncViews = useCallback(() => {
    mapRef.current?.updatePipes(pipes, selectedIdRef.current);
    threeRef.current?.updatePipes(pipes, selectedIdRef.current);
  }, [pipes]);

  const advance = useCallback(() => {
    const c = cycleRef.current + 1;
    step(pipes, c, rngRef.current);
    cycleRef.current = c;
    setCycle(c);
    setVersion((v) => v + 1);
    syncViews();
  }, [pipes, syncViews]);

  const finish = useCallback(() => {
    setStatus("complete");
    syncViews();
    setVersion((v) => v + 1);
  }, [setStatus, syncViews]);

  const frame = useCallback(
    (now: number) => {
      if (statusRef.current !== "running") return;
      if (lastTsRef.current == null) lastTsRef.current = now;
      const dt = now - lastTsRef.current;
      lastTsRef.current = now;
      accRef.current += dt;
      let guard = 0;
      while (accRef.current >= STEP_INTERVAL_MS) {
        accRef.current -= STEP_INTERVAL_MS;
        advance();
        guard++;
        if (cycleRef.current >= MAX_CYCLES) {
          finish();
          return;
        }
        if (guard > MAX_CYCLES) break;
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    [advance, finish],
  );

  const start = useCallback(() => {
    resetPipes(pipes);
    rngRef.current = new SeededRandom(SEED);
    cycleRef.current = 0;
    setCycle(0);
    setStatus("running");
    accRef.current = 0;
    lastTsRef.current = null;
    syncViews();
    setVersion((v) => v + 1);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
  }, [pipes, frame, setStatus, syncViews]);

  const pause = useCallback(() => setStatus("paused"), [setStatus]);

  const resume = useCallback(() => {
    setStatus("running");
    lastTsRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
  }, [frame, setStatus]);

  const resetSim = useCallback(() => {
    resetPipes(pipes);
    rngRef.current = new SeededRandom(SEED);
    cycleRef.current = 0;
    setCycle(0);
    setStatus("ready");
    syncViews();
    setVersion((v) => v + 1);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, [pipes, setStatus, syncViews]);

  const onPrimary = useCallback(() => {
    if (statusRef.current === "running") pause();
    else if (statusRef.current === "paused") resume();
    else start();
  }, [pause, resume, start]);

  const onSelect = useCallback(
    (id: string) => {
      selectedIdRef.current = id;
      setSelectedId(id);
      syncViews();
    },
    [syncViews],
  );

  const onResetView = useCallback(() => {
    mapRef.current?.resetView();
    threeRef.current?.resetView();
  }, []);

  // Poll until the map style has loaded, then push the initial pipe layer.
  useEffect(() => {
    let attempts = 0;
    const t = window.setInterval(() => {
      attempts++;
      const ok = mapRef.current?.updatePipes(pipes, selectedIdRef.current) ?? true;
      if (ok || attempts > 80) window.clearInterval(t);
    }, 250);
    return () => window.clearInterval(t);
  }, [pipes]);

  // Unmount safety: stop the rAF loop.
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // Live audit hash (real SHA-256 of the current state), refreshed each step.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leak = findLeakPipe(pipes);
      const payload = JSON.stringify({
        seed: SEED,
        cycle: cycleRef.current,
        leak: leak.id,
        pipes: pipes.map((p) => [p.id, Number(p.posterior.toFixed(4)), p.category, p.obs]),
      });
      const h = await sha256Hex(payload);
      if (!cancelled) setAuditHash(h);
    })();
    return () => {
      cancelled = true;
    };
  }, [version, pipes]);

  const stats = useMemo(() => computeStats(pipes), [version, pipes]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <MapView ref={mapRef} onSelect={onSelect} />

      {/* Subsurface 3D panel */}
      <div className="absolute bottom-3 right-3 z-10 sm:bottom-4 sm:right-4">
        <div
          className={`flex flex-col overflow-hidden rounded-xl border border-edge bg-surface/90 shadow-xl backdrop-blur-md transition-all duration-300 ${
            subsurfaceOpen
              ? "h-[300px] w-[440px] max-w-[92vw] sm:h-[380px] sm:w-[560px]"
              : "h-[150px] w-[200px] max-w-[46vw] sm:h-[210px] sm:w-[300px]"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-edge px-2.5 py-1.5 sm:px-3">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-[11px]">
              <Pickaxe className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Subsurface View
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-[10px] text-muted/70 lg:inline">
                drag to orbit · depth ×3
              </span>
              <button
                type="button"
                onClick={() => setSubsurfaceOpen((v) => !v)}
                aria-pressed={subsurfaceOpen}
                aria-label={subsurfaceOpen ? "Collapse subsurface view" : "Expand subsurface view"}
                className="grid h-6 w-6 cursor-pointer place-items-center rounded text-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                {subsurfaceOpen ? (
                  <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <SubsurfaceView ref={threeRef} />
          </div>
        </div>
      </div>

      <TopBar
        status={status}
        cycle={cycle}
        hash={auditHash}
        protocol72={protocol72}
        onToggleProtocol={() => setProtocol72((v) => !v)}
        onResetView={onResetView}
        onPrimary={onPrimary}
      />

      <ExportBar pipes={pipes} cycle={cycle} />

      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open analysis panel"
        className="fixed left-3 top-3 z-[15] grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-edge bg-surface/85 text-foreground shadow-lg backdrop-blur-md transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pipes={pipes}
        selectedId={selectedId}
        onSelect={onSelect}
        status={status}
        protocol72={protocol72}
        stats={stats}
        onReset={resetSim}
      />
    </div>
  );
}
