'use client';

/**
 * HBK Panel — Hydro-Bayesian Kernel control + telemetry
 * ----------------------------------------------------
 * Drives the sequential Bayesian localization simulation:
 *   - Inject blind leak (random hidden ground truth)
 *   - Run Bayesian ticks at 400ms cadence
 *   - Mining-blast mixture-noise stress test
 *   - β-Binomial decision layer (risk analysis)
 *   - Deploy attestation (when verified)
 *
 * Renders the 3D viewport in the center and the control/stats panels on
 * either side, mirroring the mobile-landscape 3-column grid from the
 * reference HTML.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Crosshair,
  Download,
  Fingerprint,
  Gauge,
  Layers3,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Terminal,
  Waves,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import HBKViewport from './hbk-viewport';
import {
  type HBKState,
  createInitialState,
  injectBlindLeak,
  bayesTick,
  activateBlast,
  deactivateBlast,
  uniformPrior,
  INITIAL_RADIUS_M,
  VERIFICATION_TARGET_RADIUS_M,
  GRID_N,
  type TrueLeak,
} from '@/lib/evidence/HydroBayesianKernel';
import {
  runRiskAnalysis,
  classifyRisk,
  DEFAULT_PARAMS,
  type DecisionResult,
} from '@/lib/evidence/BetaBinomialDecision';
import { RNG } from '@/lib/evidence/HydroBayesianKernel';

interface LogEntry {
  id: number;
  time: string;
  level: 'INFO' | 'ALERT' | 'CRITICAL' | 'SUCCESS' | 'BAYES' | 'ERROR';
  message: string;
}

interface EvidenceItem {
  id: string;
  type: string;
  value: string;
  attestation: string;
}

const MAX_LOG = 30;

function shortHash(len = 10): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('') +
    '...'
  );
}

export default function HBKPanel() {
  const [state, setState] = useState<HBKState>(createInitialState);
  const [posterior, setPosterior] = useState<Float64Array>(uniformPrior);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 0,
      time: nowTime(),
      level: 'INFO',
      message: 'AIR KERNEL booted · HBK module loaded',
    },
  ]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [deployed, setDeployed] = useState(false);
  const [signing, setSigning] = useState(false);

  const logIdRef = useRef(1);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rngRef = useRef<RNG>(new RNG());
  const stateRef = useRef<HBKState>(state);
  const posteriorRef = useRef<Float64Array>(posterior);
  // Blast state is tracked via a synchronous ref because setState is async —
  // the tick interval (400ms) can fire before React commits the blast state
  // update, causing the tick loop to read stale blastActive=false. The ref is
  // updated synchronously in handleBlast, so the tick loop always sees the
  // current blast state immediately.
  const blastActiveRef = useRef(false);

  // Keep refs in sync with state so the interval callback sees latest values
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    posteriorRef.current = posterior;
  }, [posterior]);

  const addLog = useCallback(
    (level: LogEntry['level'], message: string) => {
      setLogs((prev) => {
        const entry: LogEntry = {
          id: logIdRef.current++,
          time: nowTime(),
          level,
          message,
        };
        const next = [entry, ...prev];
        return next.length > MAX_LOG ? next.slice(0, MAX_LOG) : next;
      });
    },
    [],
  );

  const addEvidence = useCallback(
    (items: Array<{ type: string; id: string; value: string }>) => {
      setEvidence((prev) => {
        const additions: EvidenceItem[] = items.map((e) => ({
          ...e,
          attestation: shortHash(),
        }));
        return [...prev, ...additions];
      });
    },
    [],
  );

  // ─── Inject blind leak ───────────────────────────────────────────────
  const handleInjectLeak = useCallback(() => {
    if (stateRef.current.leakActive) return;
    const rng = rngRef.current;
    const { state: next, trueLeak } = injectBlindLeak(stateRef.current, rng);
    setState(next);
    setPosterior(uniformPrior());
    setEvidence([]);
    setDecision(null);
    setDeployed(false);
    addLog(
      'ALERT',
      `Blind leak injected. Prior search radius: ${Math.round(INITIAL_RADIUS_M)}m`,
    );
    addLog(
      'BAYES',
      `Ground truth sealed — algorithm sees only sensor amplitudes. q=${trueLeak.q.toFixed(2)}`,
    );
    // Auto-start the tick loop
    setRunning(true);
  }, [addLog]);

  // ─── Tick loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }
    tickIntervalRef.current = setInterval(() => {
      const current = stateRef.current;
      const post = posteriorRef.current;
      if (!current.leakActive || current.verified) {
        setRunning(false);
        return;
      }
      // Merge synchronous blast state from ref — prevents the tick loop from
      // reading stale blastActive when setState hasn't committed yet.
      const stateWithBlast: HBKState = {
        ...current,
        blastActive: blastActiveRef.current,
      };
      const result = bayesTick(post, stateWithBlast, rngRef.current);
      setPosterior(result.posterior);
      setState(result.state);
      for (const line of result.logLines) {
        addLog(line.level as LogEntry['level'], line.message);
      }
      if (result.evidence.length > 0) {
        addEvidence(result.evidence);
      }
      if (result.verified || result.state.ticks > 150) {
        setRunning(false);
      }
    }, 400);
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [running, addLog, addEvidence]);

  // ─── Mining blast (transient, 3.5s) ───────────────────────────────────
  const handleBlast = useCallback(() => {
    // Set ref synchronously so the next tick (within 400ms) sees blastActive=true
    blastActiveRef.current = true;
    setState((s) => activateBlast(s));
    addLog('ALERT', 'Mining blast transient injected (Poisson impulse train)');
    setTimeout(() => {
      blastActiveRef.current = false;
      setState((s) => deactivateBlast(s));
      addLog(
        'SUCCESS',
        'Blast transient decayed — mixture likelihood restored to nominal σ',
      );
    }, 3500);
  }, [addLog]);

  // ─── Reset ────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setRunning(false);
    blastActiveRef.current = false;
    const fresh = createInitialState();
    setState(fresh);
    setPosterior(uniformPrior());
    setEvidence([]);
    setDecision(null);
    setDeployed(false);
    setSigning(false);
    addLog('INFO', 'System reset to baseline. Posterior reset to uniform prior.');
  }, [addLog]);

  // ─── Decision layer ──────────────────────────────────────────────────
  const handleRiskAnalysis = useCallback(() => {
    const result = runRiskAnalysis(
      DEFAULT_PARAMS,
      state.posteriorPeak,
      GRID_N * GRID_N,
      rngRef.current,
    );
    setDecision(result);
    const tier = classifyRisk(result.relativeRisk);
    addLog(
      'BAYES',
      `Risk analysis: RR=${result.relativeRisk.toFixed(2)}x, RD=${result.riskDifferencePct.toFixed(1)}%, tier=${tier}`,
    );
  }, [state.posteriorPeak, addLog]);

  // ─── Deploy attestation ──────────────────────────────────────────────
  const handleDeploy = useCallback(() => {
    if (!state.leakActive || state.trustScore < 0.7) {
      addLog('ERROR', 'No verified evidence to deploy — trust score too low');
      return;
    }
    setSigning(true);
    addLog('INFO', 'ATECC608B attestation signing...');
    setTimeout(() => {
      const signature = shortHash(8);
      addLog('SUCCESS', `ATTESTATION DEPLOYED · ${signature}`);
      setDeployed(true);
      setSigning(false);
    }, 2000);
  }, [state.leakActive, state.trustScore, addLog]);

  // ─── Tilt mode (DeviceOrientation) ───────────────────────────────────
  const handleTiltToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        // iOS permission
        if (
          typeof DeviceOrientationEvent !== 'undefined' &&
          typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown })
            .requestPermission === 'function'
        ) {
          try {
            const permission = await (
              DeviceOrientationEvent as unknown as {
                requestPermission: () => Promise<string>;
              }
            ).requestPermission();
            if (permission === 'granted') {
              setTiltEnabled(true);
              addLog('SUCCESS', 'Tilt mode activated — gyroscope access granted');
            } else {
              setTiltEnabled(false);
              addLog('ALERT', 'Motion permission denied by user');
            }
          } catch {
            addLog('ERROR', 'Permission request failed');
            setTiltEnabled(false);
          }
        } else {
          setTiltEnabled(true);
          addLog('SUCCESS', 'Tilt mode activated');
        }
      } else {
        setTiltEnabled(false);
        addLog('INFO', 'Tilt mode deactivated — mouse controls enabled');
      }
    },
    [addLog],
  );

  const trustScore = computeTrust(state);
  const verdict = verdictFrom(state, trustScore);
  const trueLeak: TrueLeak | null = state.trueLeak;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* LEFT: Controls + Event log */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <Terminal className="w-4 h-4" />
              Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={handleInjectLeak}
              disabled={state.leakActive || signing}
              className="w-full bg-[var(--k-amber-bright)] text-black hover:bg-[var(--k-amber)] font-bold tracking-wider text-xs"
            >
              <Zap className="w-3.5 h-3.5" /> INJECT LEAK
            </Button>
            <Button
              onClick={handleBlast}
              disabled={!state.leakActive || state.verified}
              variant="outline"
              className="w-full border-[var(--k-red-bright)] text-[var(--k-red-bright)] hover:bg-[rgba(255,77,77,0.1)] font-bold tracking-wider text-xs"
            >
              <Activity className="w-3.5 h-3.5" /> MINING BLAST
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-[var(--k-line)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] font-bold tracking-wider text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={!state.verified || signing || deployed}
              className="w-full bg-[var(--k-green-bright)] text-black hover:bg-[var(--k-green)] font-bold tracking-wider text-xs disabled:opacity-40"
            >
              {signing ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> SIGNING...
                </>
              ) : deployed ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> DEPLOYED
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" /> DEPLOY
                </>
              )}
            </Button>

            <Separator className="bg-[var(--k-line)] my-2" />

            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-[var(--k-fg)] flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-[var(--k-amber-bright)]" />
                TILT MODE
              </Label>
              <Switch checked={tiltEnabled} onCheckedChange={handleTiltToggle} />
            </div>
            <div className="text-[10px] text-[var(--k-dim)] leading-snug">
              Uses DeviceOrientation API. Requires HTTPS / localhost.
              iOS will prompt for motion permission.
            </div>

            <Separator className="bg-[var(--k-line)] my-2" />

            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-[var(--k-fg)] flex items-center gap-1.5">
                {running ? (
                  <Pause className="w-3 h-3 text-[var(--k-amber-bright)]" />
                ) : (
                  <Play className="w-3 h-3 text-[var(--k-green-bright)]" />
                )}
                BAYES LOOP
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRunning((r) => !r)}
                disabled={!state.leakActive || state.verified}
                className="border-[var(--k-line)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] h-7 text-[10px]"
              >
                {running ? 'PAUSE' : 'RUN'}
              </Button>
            </div>
            <div className="text-[10px] text-[var(--k-dim)]">
              Tick {state.ticks}/{150} · cadence 400ms
            </div>
          </CardContent>
        </Card>

        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <Terminal className="w-4 h-4 text-[var(--k-green-bright)]" />
              Event Log
              <Badge className="k-badge k-badge-pass ml-auto">LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px] pr-2">
              <div className="space-y-0.5 text-[10px] font-mono">
                {logs.map((l) => (
                  <LogRow key={l.id} entry={l} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* CENTER: 3D Viewport + HUD overlay */}
      <div className="lg:col-span-6">
        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)] overflow-hidden p-0">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <Crosshair className="w-4 h-4" />
              3D Viewport · DMA-7 Network + Posterior Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative">
            <div className="relative w-full h-[460px] sm:h-[520px]">
              <HBKViewport state={state} posterior={posterior} tiltEnabled={tiltEnabled} />

              {/* HUD overlay — live telemetry */}
              <div className="absolute top-3 left-3 bg-[rgba(4,8,13,0.85)] border border-[var(--k-cyan-bright)] border-l-2 p-2.5 backdrop-blur-sm z-10 min-w-[160px] pointer-events-none">
                <div className="text-[9px] tracking-widest uppercase text-[var(--k-cyan-bright)] mb-1.5">
                  Live Telemetry
                </div>
                <HudRow label="Flow" value={`${state.currentFlow.toFixed(1)} L/s`} tone={flowTone(state)} />
                <HudRow label="Press" value={`${state.currentPressure.toFixed(1)} m`} tone={pressureTone(state)} />
                <HudRow label="Status" value={statusText(state)} tone={statusTone(state)} />
              </div>

              {/* Tilt indicator */}
              {tiltEnabled && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--k-amber-bright)] text-black px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest z-20 pointer-events-none">
                  📱 TILT MODE ACTIVE
                </div>
              )}

              {/* Verified badge */}
              {state.verified && (
                <div className="absolute top-3 right-3 bg-[rgba(0,255,136,0.15)] border border-[var(--k-green-bright)] px-3 py-1.5 rounded text-[10px] font-bold text-[var(--k-green-bright)] tracking-widest z-20">
                  ✓ VERIFIED
                </div>
              )}
            </div>

            {/* Posterior color legend */}
            <div className="px-3 py-2 border-t border-[var(--k-line)] flex items-center gap-3 text-[9px] text-[var(--k-dim)]">
              <span>Posterior</span>
              <div className="flex-1 h-2 rounded-sm"
                style={{
                  background:
                    'linear-gradient(90deg, hsl(270,100%,12%), hsl(180,100%,30%), hsl(120,100%,47%))',
                }}
              />
              <span>low → MAP</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: HBK stats + Trust + Decision + Evidence */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <Gauge className="w-4 h-4" />
              Hydro-Bayesian Posterior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <HudRow
              label="Posterior Peak"
              value={`${(state.posteriorPeak * 100).toFixed(2)}%`}
              tone={state.posteriorPeak > 0.04 ? 'pass' : 'dim'}
            />
            <HudRow
              label="95% Credible Radius"
              value={`${Math.round(state.credibleRadiusM).toLocaleString()}m`}
              tone={
                state.credibleRadiusM <= VERIFICATION_TARGET_RADIUS_M
                  ? 'pass'
                  : 'warn'
              }
            />
            <HudRow
              label="Blast Samples Filtered"
              value={String(state.blastFiltered)}
              tone={state.blastFiltered > 0 ? 'warn' : 'dim'}
            />
            <HudRow
              label="MAP Cell (x, z)"
              value={`${state.mapCell.x.toFixed(2)}, ${state.mapCell.z.toFixed(2)}`}
              tone="cyan"
            />
            {state.localizationErrorM !== null && (
              <HudRow
                label="Localization Error"
                value={`${state.localizationErrorM.toLocaleString()}m`}
                tone="pass"
              />
            )}
            {trueLeak && (
              <div className="pt-1.5 mt-1.5 border-t border-[var(--k-line)] text-[10px] text-[var(--k-dim)]">
                Ground truth (sealed):
                <br />
                <span className="font-mono text-[var(--k-amber-bright)]">
                  ({trueLeak.x.toFixed(2)}, {trueLeak.z.toFixed(2)}) q={trueLeak.q.toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust gauge (mirrors EIS-style 3-segment bar) */}
        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <ShieldCheck className="w-4 h-4" />
              Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="k-trust-bar">
              <div
                className="k-trust-bar-fill"
                style={{ width: `${Math.round(trustScore * 100)}%` }}
              />
              <div
                className="k-trust-bar-threshold"
                style={{ left: '70%' }}
                title="Verification threshold 0.70"
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--k-fg-bright)]">
                {trustScore.toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-[var(--k-dim)]">
              <span>0.00</span>
              <span className="text-[var(--k-amber-bright)]">▲ 0.70</span>
              <span>1.00</span>
            </div>
            <div
              className={`text-center text-xs font-bold tracking-widest pt-1 ${verdictColor(verdict)}`}
            >
              {verdict}
            </div>
          </CardContent>
        </Card>

        {/* β-Binomial decision layer */}
        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <Layers3 className="w-4 h-4" />
              Decision Layer · β-Binomial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={handleRiskAnalysis}
              variant="outline"
              className="w-full border-[var(--k-cyan-bright)] text-[var(--k-cyan-bright)] hover:bg-[rgba(0,212,255,0.1)] text-xs"
            >
              <Waves className="w-3.5 h-3.5" /> RUN RISK ANALYSIS
            </Button>
            {decision ? (
              <div className="space-y-1.5 text-[11px]">
                <DecRow
                  label="Relative Risk"
                  value={`${decision.relativeRisk.toFixed(2)}x`}
                  tone="warn"
                />
                <DecRow
                  label="Risk Difference"
                  value={`${decision.riskDifferencePct >= 0 ? '+' : ''}${decision.riskDifferencePct.toFixed(1)}%`}
                  tone={decision.riskDifferencePct >= 0 ? 'danger' : 'pass'}
                />
                <DecRow
                  label="Information Density"
                  value={`${decision.informationDensity.toFixed(1)}/100`}
                  tone="cyan"
                />
                <DecRow
                  label="Risk Tier"
                  value={classifyRisk(decision.relativeRisk)}
                  tone={
                    classifyRisk(decision.relativeRisk) === 'CRITICAL'
                      ? 'danger'
                      : classifyRisk(decision.relativeRisk) === 'HIGH'
                        ? 'warn'
                        : 'pass'
                  }
                />
                <div className="text-[9px] text-[var(--k-dim)] pt-1 border-t border-[var(--k-line)]">
                  μ={decision.params.mu}, ρ={decision.params.rho} · {decision.nSegments}×{decision.trials} trials
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-[var(--k-dim)] italic">
                Not yet run. Inject a leak, then run risk analysis.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence list */}
        <Card className="k-card border-[var(--k-line)] bg-[var(--k-panel)]">
          <CardHeader className="pb-2">
            <CardTitle className="k-card-title">
              <Fingerprint className="w-4 h-4" />
              Evidence ({evidence.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[180px] pr-2">
              <div className="space-y-1.5">
                {evidence.length === 0 && (
                  <div className="text-[10px] text-[var(--k-dim)] italic text-center py-4">
                    No evidence yet
                  </div>
                )}
                {evidence.map((e) => (
                  <div
                    key={e.id + e.attestation}
                    className="border border-[rgba(0,255,136,0.2)] bg-[rgba(0,255,136,0.04)] rounded p-1.5"
                  >
                    <div className="text-[9px] font-bold text-[var(--k-cyan-bright)]">
                      [{e.type}] {e.id}
                    </div>
                    <div className="text-[9px] text-[var(--k-fg)]">{e.value}</div>
                    <div className="text-[7px] text-[var(--k-dim)] font-mono break-all border-t border-dashed border-[var(--k-line)] pt-1 mt-1">
                      {e.attestation}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function nowTime(): string {
  return new Date().toISOString().substring(11, 19);
}

function computeTrust(state: HBKState): number {
  const flowDev =
    (state.currentFlow - state.baselineFlow) / state.baselineFlow * 100;
  const pressureDrop = state.baselinePressure - state.currentPressure;
  let trust = 0;
  if (flowDev > 10) trust += 0.3;
  if (pressureDrop > 0.5 && state.currentPressure < 47.0) trust += 0.2;
  if (state.verified) trust += 0.5;
  return Math.round(trust * 100) / 100;
}

function verdictFrom(state: HBKState, trust: number): string {
  if (state.verified) return 'VERIFIED';
  if (trust > 0 && state.leakActive) return 'INSUFFICIENT';
  return 'AWAITING';
}

function verdictColor(verdict: string): string {
  if (verdict === 'VERIFIED') return 'k-pass';
  if (verdict === 'INSUFFICIENT') return 'k-warn';
  return 'k-dim';
}

function flowTone(state: HBKState): 'pass' | 'warn' | 'danger' | 'dim' {
  if (state.currentFlow < 0) return 'danger';
  if (state.currentFlow > state.baselineFlow * 1.1) return 'warn';
  if (state.leakActive) return 'dim';
  return 'pass';
}

function pressureTone(state: HBKState): 'pass' | 'warn' | 'danger' | 'dim' {
  if (state.currentPressure < 47.0 && state.leakActive) return 'warn';
  return 'pass';
}

function statusText(state: HBKState): string {
  if (state.currentFlow < 0) return 'IMPOSSIBLE';
  if (state.currentFlow > state.baselineFlow * 1.1) return 'ANOMALY';
  if (state.leakActive) return 'SEARCHING';
  return 'NOMINAL';
}

function statusTone(state: HBKState): 'pass' | 'warn' | 'danger' | 'dim' {
  if (state.currentFlow < 0) return 'danger';
  if (state.currentFlow > state.baselineFlow * 1.1) return 'warn';
  if (state.leakActive) return 'dim';
  return 'pass';
}

// ─── Sub-components ──────────────────────────────────────────────────────

function HudRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'pass' | 'warn' | 'danger' | 'dim' | 'cyan';
}) {
  const cls =
    tone === 'pass'
      ? 'k-pass'
      : tone === 'warn'
        ? 'k-warn'
        : tone === 'danger'
          ? 'k-danger'
          : tone === 'cyan'
            ? 'k-cyan'
            : 'k-dim';
  return (
    <div className="flex justify-between gap-3 text-[11px] my-0.5">
      <span className="text-[var(--k-dim)]">{label}:</span>
      <span className={`font-bold text-xs ${cls}`}>{value}</span>
    </div>
  );
}

function DecRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'pass' | 'warn' | 'danger' | 'dim' | 'cyan';
}) {
  const cls =
    tone === 'pass'
      ? 'k-pass'
      : tone === 'warn'
        ? 'k-warn'
        : tone === 'danger'
          ? 'k-danger'
          : tone === 'cyan'
            ? 'k-cyan'
            : 'k-dim';
  return (
    <div className="flex justify-between">
      <span className="text-[var(--k-dim)]">{label}</span>
      <span className={`font-bold ${cls}`}>{value}</span>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const levelClass =
    entry.level === 'INFO'
      ? 'k-cyan'
      : entry.level === 'ALERT'
        ? 'k-warn'
        : entry.level === 'CRITICAL'
          ? 'k-danger'
          : entry.level === 'SUCCESS'
            ? 'k-pass'
            : entry.level === 'BAYES'
              ? 'k-cyan'
              : 'k-danger';
  return (
    <div className="flex gap-2 items-baseline border-b border-[var(--k-line)]/40 py-0.5">
      <span className="text-[var(--k-dim)] shrink-0">[{entry.time}]</span>
      <span className={`font-bold shrink-0 w-14 ${levelClass}`}>{entry.level}</span>
      <span className="text-[var(--k-fg)] truncate">{entry.message}</span>
    </div>
  );
}
