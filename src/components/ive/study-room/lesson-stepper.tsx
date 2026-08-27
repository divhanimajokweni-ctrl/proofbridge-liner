'use client';

/**
 * Lesson Stepper · Study Room · VVU IVE
 * ------------------------------------
 * 9-step interactive lesson player covering the core VVU IVE
 * evidence-verification concepts: HOM sparse-sensor hypothesis, EIS v1.0
 * evidence states + independence scoring, anomaly signatures, the 11-field
 * provenance spine, Zero Fabrication Mandate, HBK localization, and the
 * 72-hour validation protocol.
 *
 * Initial state per DWS brief 03a: 3/9 complete, step 4 current.
 * Controls: Play (auto-advance every 4s), Pause, Step Forward, Step Back, Reset.
 *
 * Self-contained — accepts no props. Uses local state only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  GraduationCap,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface Lesson {
  id: number;
  title: string;
  body: string;
  takeaway: string;
  duration: string;
}

const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'Introduction to VVU IVE',
    body: 'The Venture Vision Ubuntu Immersive Virtual Environment is an evidence-verification layer for municipal water infrastructure observations. It sits between raw SCADA telemetry and municipal operational decisions, refusing to inflate evidence or fabricate missing data. The IVE is a demonstration surface for the AIR KERNEL — the deterministic engine that scores evidence independence and localizes candidate leak zones.',
    takeaway:
      'VVU IVE is a verification layer, not a control system — it tells engineers what they can and cannot yet conclude from sparse observations.',
    duration: '01:20',
  },
  {
    id: 2,
    title: 'HOM Sparse Sensor Hypothesis',
    body: 'The Hydraulic Observability Model (HOM, brief 02a) formalises a hard truth: sparse flow + pressure sensors can identify abnormal behaviour but cannot pinpoint leaks. Flow rising + pressure dropping is a signature, not a location. HOM defines the observability envelope — the set of fault hypotheses a given sensor placement can distinguish — and bounds the claims an engineer may make from any single observation.',
    takeaway:
      'Sparse sensors detect anomalies, never the leak — location always requires corroborating independent evidence.',
    duration: '02:05',
  },
  {
    id: 3,
    title: 'EIS v1.0 Evidence States',
    body: 'EIS v1.0 (spec 02c) classifies every observation into one of six states: VALID (passes physical bounds), MISSING (no reading), ANOMALOUS (exceeds deviation threshold), CORRELATED (shares sensor/time with another), INDEPENDENT (genuinely corroborates from a distinct source), INSUFFICIENT (cannot reach a verdict). The classification is deterministic — same input always yields the same state, satisfying the reproducibility requirement of the audit trail.',
    takeaway:
      'Six states, one verdict path — VALID is necessary but not sufficient; INDEPENDENT is what separates proof from echo.',
    duration: '02:40',
  },
  {
    id: 4,
    title: 'EIS Independence Scoring',
    body: 'The EIS score is a weighted sum: PRIMARY contributes 0.3, CORRELATED 0.2, INDEPENDENT 0.4, capped at 1.0. The verification threshold is 0.8 — below it the verdict is INSUFFICIENT_EVIDENCE; at or above it the verdict becomes VERIFIED_CANDIDATE. This weighting prevents evidence inflation: five sensors reading the same physical anomaly through correlated channels are scored as one PRIMARY plus one CORRELATED, not five independent proofs.',
    takeaway:
      'Score = 0.3·PRIMARY + 0.2·CORRELATED + 0.4·INDEPENDENT, threshold 0.8 — five agreeing sensors ≠ five independent proofs.',
    duration: '02:15',
  },
  {
    id: 5,
    title: 'Hydraulic Anomaly Signatures',
    body: 'The canonical leak signature is flow deviation up + pressure drop down versus the minimum night flow (MNF) baseline. EIS v1.0 rejects the false-positive case where a pump state change explains the same signature — the engine checks measurementType=PUMP_STATUS before scoring. Other signatures: sustained pressure loss without flow surplus (closed-valve hypothesis), acoustic correlation across a DMA boundary (independent corroboration).',
    takeaway:
      'Flow ↑ + Pressure ↓ = candidate; pump context change → REJECTED_FALSE_POSITIVE — the engine refuses to verify what it cannot isolate.',
    duration: '01:55',
  },
  {
    id: 6,
    title: '11-Field Provenance Spine',
    body: 'Every observation in the audit record carries an 11-field provenance spine: (1) sensorId, (2) firmwareVersion, (3) calibrationDate, (4) timestampUtc, (5) locationWgs84, (6) dmaId, (7) environmentContext, (8) processingChain, (9) attestationHash, (10) qualityFlag, (11) measurementType. The spine guarantees that any downstream claim can be traced back to the physical transducer, the firmware that interpreted its raw counts, and the calibration curve that translated them into engineering units.',
    takeaway:
      '11 fields per observation — every claim is traceable to a sensor, a firmware version, and a calibration date.',
    duration: '02:30',
  },
  {
    id: 7,
    title: 'Zero Fabrication Mandate',
    body: 'The Zero Fabrication Mandate is the inviolable rule of the IVE: missing data is never guessed, interpolated, or filled. A reading that does not arrive is preserved as UNDEFINED in the record. EIS v1.0 scores MISSING explicitly — it does not assume a value. This protects the audit trail from inference drift: a downstream analyst always knows whether a value was measured or absent.',
    takeaway:
      'Missing is never guessed — UNDEFINED is a first-class value, preserved verbatim in the audit record.',
    duration: '01:40',
  },
  {
    id: 8,
    title: 'HBK Sequential Bayesian Localization',
    body: 'The Hydro-Bayesian Kernel (HBK) refines the candidate leak zone via sequential Bayesian inference over a 32×32 grid. Each new observation updates the posterior; the MAP estimate locates the most likely cell, and the 95% credible radius bounds the search area. Mixture-noise handling widens σ during transient disturbances (e.g., mining blasts) instead of discarding samples — preserving the audit trail while filtering the transient.',
    takeaway:
      'Posterior over 32×32 grid → MAP cell + 95% credible radius — localization is a probability, not a point.',
    duration: '03:10',
  },
  {
    id: 9,
    title: '72-Hour Validation Protocol',
    body: 'The 72-hour validation protocol (brief 05a) runs in four phases: (1) ingestion — observations normalised and persisted with full provenance, (2) anomaly detection — EIS flags deviations versus MNF baseline, (3) evidence assessment — independence scoring + HBK localization + field verification request, (4) reporting — audit receipt exported with SHA-256 hash. Each phase has explicit entry and exit gates; the protocol ends either in a verified candidate or an explicit INSUFFICIENT_EVIDENCE verdict.',
    takeaway:
      'Ingestion → Anomaly → Evidence Assessment → Reporting — 72 hours, 4 phases, one auditable verdict.',
    duration: '02:50',
  },
];

const INITIAL_STEP = 4; // 3/9 done per 03a, step 4 current
const AUTO_ADVANCE_MS = 4000;

type StepStatus = 'DONE' | 'CURRENT' | 'UPCOMING';

function getStepStatus(stepId: number, currentStep: number): StepStatus {
  if (stepId < currentStep) return 'DONE';
  if (stepId === currentStep) return 'CURRENT';
  return 'UPCOMING';
}

export default function LessonStepper() {
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = LESSONS.length;
  const percent = useMemo(
    () => Math.round((currentStep / totalSteps) * 100),
    [currentStep, totalSteps],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.min(totalSteps, next));
      setCurrentStep(clamped);
      if (clamped >= totalSteps) {
        setPlaying(false);
        clearTimer();
      }
    },
    [totalSteps, clearTimer],
  );

  // ─── Auto-advance loop (4s) ────────────────────────────────────────
  // Effect is purely a timer scheduler — no synchronous setState in the
  // body (avoids the react-hooks/set-state-in-effect cascading-render
  // warning). When advance() reaches the end it calls setPlaying(false)
  // inside the async timer callback; togglePlay handles the replay case.
  useEffect(() => {
    if (!playing) return;
    if (currentStep >= totalSteps) return;
    timerRef.current = setTimeout(() => {
      advance(currentStep + 1);
    }, AUTO_ADVANCE_MS);
    return clearTimer;
  }, [playing, currentStep, totalSteps, advance, clearTimer]);

  const togglePlay = () => {
    if (currentStep >= totalSteps) {
      // Restart from step 1 if at the end
      setCurrentStep(1);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const stepBack = () => {
    setPlaying(false);
    advance(currentStep - 1);
  };

  const stepForward = () => {
    setPlaying(false);
    advance(currentStep + 1);
  };

  const reset = () => {
    setPlaying(false);
    clearTimer();
    setCurrentStep(INITIAL_STEP);
  };

  const current = LESSONS[currentStep - 1];

  return (
    <div className="flex flex-col lg:flex-row min-h-0 h-full bg-[var(--k-bg)]">
      {/* ─── Step list (left on desktop, top scroller on mobile) ─── */}
      <aside className="lg:w-72 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--k-line)] bg-[var(--k-panel)]">
        <div className="hidden lg:flex items-center gap-2 px-4 py-3 border-b border-[var(--k-line)]">
          <GraduationCap className="h-4 w-4 k-cyan" />
          <span className="text-xs font-bold k-fg-bright uppercase tracking-wider">
            Lesson Track
          </span>
          <span className="ml-auto k-badge k-badge-dim">9 STEPS</span>
        </div>

        {/* Mobile: horizontal scroller. Desktop: vertical list */}
        <div className="flex lg:flex-col gap-1.5 px-2 py-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-180px)]">
          {LESSONS.map((lesson) => {
            const status = getStepStatus(lesson.id, currentStep);
            const Icon =
              status === 'DONE'
                ? CheckCircle2
                : status === 'CURRENT'
                  ? CircleDot
                  : Circle;
            return (
              <button
                key={lesson.id}
                onClick={() => {
                  setPlaying(false);
                  setCurrentStep(lesson.id);
                }}
                className={`group flex items-start gap-2 px-2.5 py-2 rounded-md border text-left transition-all min-w-[200px] lg:min-w-0 lg:w-full ${
                  status === 'CURRENT'
                    ? 'border-[var(--k-cyan-bright)] bg-[rgba(0,212,255,0.06)] k-glow-cyan'
                    : status === 'DONE'
                      ? 'border-[var(--k-line)] bg-[var(--k-bg-elevated)] hover:border-[var(--k-green-bright)]/40'
                      : 'border-[var(--k-line)] bg-transparent hover:bg-[var(--k-bg-elevated)]'
                }`}
                aria-current={status === 'CURRENT' ? 'step' : undefined}
              >
                <Icon
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    status === 'DONE'
                      ? 'k-pass'
                      : status === 'CURRENT'
                        ? 'k-cyan'
                        : 'k-dim'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] uppercase tracking-widest font-bold ${
                        status === 'DONE'
                          ? 'k-pass'
                          : status === 'CURRENT'
                            ? 'k-cyan'
                            : 'k-dim'
                      }`}
                    >
                      {String(lesson.id).padStart(2, '0')}
                    </span>
                    {status === 'DONE' && (
                      <span className="text-[8px] k-pass uppercase tracking-widest">
                        · DONE
                      </span>
                    )}
                    {status === 'CURRENT' && (
                      <span className="text-[8px] k-cyan uppercase tracking-widest animate-pulse">
                        · LIVE
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] leading-tight mt-0.5 truncate ${
                      status === 'UPCOMING' ? 'k-dim' : 'k-fg-bright'
                    }`}
                  >
                    {lesson.title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ─── Main content area ─── */}
      <main className="flex-1 min-h-0 flex flex-col k-grid-bg">
        {/* Progress bar header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[var(--k-line)] bg-[var(--k-panel)]/60 backdrop-blur">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-4 w-4 k-cyan" />
            <span className="text-xs k-dim uppercase tracking-widest">
              Step
            </span>
            <span className="text-sm k-cyan font-bold">
              {String(currentStep).padStart(2, '0')}
              <span className="k-dim">/</span>
              {String(totalSteps).padStart(2, '0')}
            </span>
            <Separator
              orientation="vertical"
              className="h-4 bg-[var(--k-line-strong)]"
            />
            <span className="text-xs k-dim uppercase tracking-widest">
              {percent}% COMPLETE
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              {playing ? (
                <span className="k-badge k-badge-process">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--k-cyan-bright)] animate-pulse" />
                  PLAYING
                </span>
              ) : (
                <span className="k-badge k-badge-dim">PAUSED</span>
              )}
              <span className="k-badge k-badge-dim hidden sm:inline-flex">
                {current.duration}
              </span>
            </span>
          </div>
          <Progress value={percent} className="h-1.5 bg-[var(--k-bg-elevated)]" />
        </div>

        {/* Lesson content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <article className="max-w-3xl mx-auto">
            <header className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] k-dim uppercase tracking-widest">
                  LESSON
                </span>
                <span className="text-[10px] k-cyan font-bold">
                  {String(current.id).padStart(2, '0')} / 09
                </span>
                <span className="k-dim text-[10px]">·</span>
                <span className="text-[10px] k-dim uppercase tracking-widest">
                  {current.duration}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold k-fg-bright uppercase tracking-wide leading-tight">
                <span className="k-cursor">{current.title}</span>
              </h1>
            </header>

            <p className="text-sm sm:text-base k-fg leading-relaxed mb-6 font-mono">
              {current.body}
            </p>

            {/* Key takeaway */}
            <div className="rounded-md border border-[var(--k-green-bright)]/40 bg-[rgba(0,255,136,0.04)] px-4 py-3 k-glow-green">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 k-pass shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest k-pass font-bold mb-1">
                    Key Takeaway
                  </div>
                  <p className="text-sm k-pass leading-relaxed font-mono">
                    {current.takeaway}
                  </p>
                </div>
              </div>
            </div>

            {/* Doc reference */}
            <div className="mt-6 flex items-center gap-2 text-[10px] k-dim uppercase tracking-widest">
              <span>REF:</span>
              <span className="k-cyan">
                {current.id === 1
                  ? '01a EXECUTIVE BRIEF'
                  : current.id === 2
                    ? '02a HOM'
                    : current.id === 3 || current.id === 4
                      ? '02c EIS v1.0'
                      : current.id === 5
                        ? '04a VALIDATION BRIEF'
                        : current.id === 6 || current.id === 7
                          ? '02c EIS v1.0'
                          : current.id === 8
                            ? 'HBK REFERENCE'
                            : '05a 72-HOUR PROTOCOL'}
              </span>
            </div>
          </article>
        </div>

        {/* Controls */}
        <footer className="px-4 sm:px-6 lg:px-8 py-3 border-t border-[var(--k-line)] bg-[var(--k-panel)]">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={stepBack}
              disabled={currentStep <= 1}
              className="border-[var(--k-line-strong)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline uppercase tracking-wider text-xs font-bold">
                Back
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={togglePlay}
              className={`min-w-[120px] border-[var(--k-cyan-bright)] text-[var(--k-cyan-bright)] hover:bg-[var(--k-cyan-bright)]/15 hover:text-[var(--k-cyan-bright)] ${
                playing
                  ? 'bg-[var(--k-cyan-bright)]/10'
                  : 'bg-[rgba(0,212,255,0.04)]'
              } shadow-[0_0_12px_rgba(0,212,255,0.15)]`}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span className="ml-1.5 uppercase tracking-wider text-xs font-bold">
                    Pause
                  </span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span className="ml-1.5 uppercase tracking-wider text-xs font-bold">
                    {currentStep >= totalSteps ? 'Replay' : 'Play'}
                  </span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={stepForward}
              disabled={currentStep >= totalSteps}
              className="border-[var(--k-line-strong)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-cyan-bright)] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next step"
            >
              <span className="mr-1 hidden sm:inline uppercase tracking-wider text-xs font-bold">
                Next
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Separator
              orientation="vertical"
              className="h-6 bg-[var(--k-line-strong)] mx-1 hidden sm:block"
            />

            <Button
              variant="outline"
              onClick={reset}
              className="border-[var(--k-line-strong)] text-[var(--k-fg)] hover:bg-[var(--k-panel-2)] hover:text-[var(--k-red-bright)]"
              aria-label="Reset to step 4"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline uppercase tracking-wider text-xs font-bold">
                Reset
              </span>
            </Button>
          </div>
          <p className="text-center text-[10px] k-dim uppercase tracking-widest mt-2">
            Auto-advance every 4s when playing · reset returns to step 04
            (3/9 done per DWS 03a)
          </p>
        </footer>
      </main>
    </div>
  );
}
