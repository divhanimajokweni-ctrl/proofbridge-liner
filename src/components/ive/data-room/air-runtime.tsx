'use client';

/**
 * AIR Runtime — Data Room · VVU IVE
 * ----------------------------------
 * "AIR" = Audit Integrity Runtime. A live event stream + evidence decay
 * tracker. Shows the real-time observation feed from the AIR KERNEL with
 * explicit "half-life" freshness indicators per evidence item.
 *
 * Panels:
 *   1. Runtime Stats header  — events/sec, total events, active evidence,
 *                              avg trust score
 *   2. Live Event Stream     — scrolling list of observations (newest first)
 *                              with color-coded levels + timestamps
 *   3. Evidence Decay Tracker — per-item age (seconds) + decay bar
 *                               (green <30s / amber 30-60s / red >60s) +
 *                               half-life: 60s label
 *
 * All observations are SIMULATION — VVU-generated. No real telemetry.
 */

import { useEffect, useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Radio,
  Clock,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Eye,
  XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

type EventLevel = 'OBS' | 'ALERT' | 'EIS' | 'ERROR';

interface AirEvent {
  id: number;
  level: EventLevel;
  text: string;
  ts: number;
}

interface EvidenceItem {
  id: string;
  label: string;
  receivedAt: number;
  trust: number;
}

// ─── Mock event generator ─────────────────────────────────────────────

const EVENT_TEMPLATES: Array<{ level: EventLevel; text: string; trust?: number }> = [
  { level: 'OBS', text: 'FLOW-DMA07-INLET 111.0 L/s VALID', trust: 0.95 },
  { level: 'OBS', text: 'PRESS-DMA07-P14 46.1 m VALID', trust: 0.92 },
  { level: 'OBS', text: 'PRESS-DMA07-P14 46.3 m VALID', trust: 0.92 },
  { level: 'ALERT', text: 'Flow deviation +14.4% above baseline', trust: 0.7 },
  { level: 'OBS', text: 'FLOW-DMA07-INLET 109.8 L/s VALID', trust: 0.95 },
  { level: 'OBS', text: 'FIELD-REPORT segment S-142 moisture detected', trust: 0.85 },
  { level: 'EIS', text: 'Trust score updated: 1.00 VERIFIED', trust: 1.0 },
  { level: 'OBS', text: 'ACOUSTIC-07 anomalous signal at S-142', trust: 0.78 },
  { level: 'OBS', text: 'PUMP-07 status unchanged (no false positive)', trust: 0.88 },
  { level: 'OBS', text: 'VALVE-V-08 position NORMAL', trust: 0.9 },
  { level: 'ALERT', text: 'Pressure drop -2.1 m at P14 (within threshold)', trust: 0.6 },
  { level: 'OBS', text: 'MNF-DMA07 baseline 97.0 L/s (median)', trust: 0.93 },
  { level: 'EIS', text: 'PRIMARY observation flagged: FLOW-DMA07-INLET', trust: 1.0 },
  { level: 'OBS', text: 'FIELD-REPORT segment S-143 no anomaly', trust: 0.82 },
  { level: 'OBS', text: 'FLOW-DMA07-INLET 110.2 L/s VALID', trust: 0.95 },
  { level: 'ALERT', text: 'Correlation window opened (5 min, 7 sensors)', trust: 0.65 },
  { level: 'OBS', text: 'ACOUSTIC-07 amplitude 0.42 (within normal)', trust: 0.8 },
  { level: 'EIS', text: 'INDEPENDENT observation added: ACOUSTIC-07', trust: 1.0 },
  { level: 'OBS', text: 'PRESS-DMA07-P15 47.9 m VALID', trust: 0.91 },
  { level: 'ERROR', text: 'Sensor FLOW-DMA07-P16 timeout (17 min)', trust: 0.0 },
];

const LEVEL_META: Record<
  EventLevel,
  { color: string; badge: string; icon: typeof Radio }
> = {
  OBS: { color: 'k-cyan', badge: 'k-badge-process', icon: Radio },
  ALERT: { color: 'k-warn', badge: 'k-badge-warn', icon: AlertTriangle },
  EIS: { color: 'k-pass', badge: 'k-badge-pass', icon: CheckCircle2 },
  ERROR: { color: 'k-danger', badge: 'k-badge-danger', icon: XCircle },
};

// Evidence item pool — shown in the decay tracker
const EVIDENCE_POOL: Array<{ id: string; label: string; trust: number }> = [
  { id: 'EV-001', label: 'FLOW-DMA07-INLET', trust: 0.95 },
  { id: 'EV-002', label: 'PRESS-DMA07-P14', trust: 0.92 },
  { id: 'EV-003', label: 'FIELD-S142-MOISTURE', trust: 0.85 },
  { id: 'EV-004', label: 'ACOUSTIC-07-ANOMALY', trust: 0.78 },
  { id: 'EV-005', label: 'PUMP-07-STATUS', trust: 0.88 },
];

// ─── Component ────────────────────────────────────────────────────────

export default function AirRuntime() {
  const [events, setEvents] = useState<AirEvent[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(() =>
    EVIDENCE_POOL.map((e, i) => ({
      ...e,
      receivedAt: Date.now() - i * 7000,
    })),
  );
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsLastSec, setEventsLastSec] = useState(0);
  const [, setTick] = useState(0); // forces re-render for age display
  const eventIdRef = useRef(1);
  const eventsInLastSecRef = useRef<number[]>([]);

  // Live event stream — push a new event every 2s
  useEffect(() => {
    let mounted = true;

    const pushEvent = () => {
      if (!mounted) return;
      const template =
        EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      const newEvent: AirEvent = {
        id: eventIdRef.current++,
        level: template.level,
        text: template.text,
        ts: Date.now(),
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
      setTotalEvents((prev) => prev + 1);
      eventsInLastSecRef.current.push(Date.now());

      // If this event has a trust value, rotate one of the evidence items
      // (oldest first) so the decay tracker keeps flowing.
      if (template.trust !== undefined) {
        setEvidence((prev) => {
          if (prev.length === 0) return prev;
          const sorted = [...prev].sort(
            (a, b) => a.receivedAt - b.receivedAt,
          );
          const oldest = sorted[0];
          const pool =
            EVIDENCE_POOL[Math.floor(Math.random() * EVIDENCE_POOL.length)];
          return prev.map((e) =>
            e.id === oldest.id
              ? {
                  ...e,
                  label: pool.label,
                  trust: template.trust ?? e.trust,
                  receivedAt: Date.now(),
                }
              : e,
          );
        });
      }
    };

    // Seed initial events so the panel isn't empty on mount
    if (events.length === 0) {
      for (let i = 0; i < 6; i++) {
        const t =
          EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
        setEvents((prev) =>
          [
            {
              id: eventIdRef.current++,
              level: t.level,
              text: t.text,
              ts: Date.now() - (6 - i) * 1800,
            },
            ...prev,
          ].slice(0, 20),
        );
        setTotalEvents((prev) => prev + 1);
      }
    }

    const eventInterval = setInterval(pushEvent, 2000);
    return () => {
      mounted = false;
      clearInterval(eventInterval);
    };
  }, []);

  // Tick every second so age displays update + decay bar refreshes
  useEffect(() => {
    const ageInterval = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
      // Prune events older than 1s for the events/sec metric
      const now = Date.now();
      eventsInLastSecRef.current = eventsInLastSecRef.current.filter(
        (ts) => now - ts < 1000,
      );
      setEventsLastSec(eventsInLastSecRef.current.length);
    }, 1000);
    return () => clearInterval(ageInterval);
  }, []);

  const avgTrust =
    evidence.length > 0
      ? evidence.reduce((sum, e) => sum + e.trust, 0) / evidence.length
      : 0;

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Runtime stats header */}
      <div className="k-card k-glow-cyan">
        <div className="k-card-title">
          <Activity className="h-4 w-4" /> RUNTIME STATS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile
            icon={Zap}
            label="EVENTS/SEC"
            value={eventsLastSec.toFixed(0)}
            color="k-cyan"
          />
          <StatTile
            icon={Activity}
            label="TOTAL EVENTS"
            value={totalEvents.toString()}
            color="k-fg-bright"
          />
          <StatTile
            icon={Eye}
            label="ACTIVE EVIDENCE"
            value={evidence.length.toString()}
            color="k-pass"
          />
          <StatTile
            icon={Gauge}
            label="AVG TRUST"
            value={avgTrust.toFixed(2)}
            color={avgTrust >= 0.8 ? 'k-pass' : 'k-warn'}
          />
        </div>
      </div>

      {/* Main grid: event stream + decay tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 flex-1 min-h-0">
        {/* Live event stream */}
        <div className="k-card flex flex-col min-h-[500px]">
          <div className="k-card-title">
            <Radio className="h-4 w-4" /> LIVE EVENT STREAM
            <span className="ml-auto flex items-center gap-1.5 normal-case tracking-normal text-[10px] k-pass">
              <span className="w-2 h-2 rounded-full bg-[var(--k-green-bright)] animate-pulse" />
              STREAMING
            </span>
          </div>
          <Separator className="mb-2" />
          <ScrollArea className="flex-1 max-h-[560px]">
            <div className="font-mono text-xs leading-relaxed space-y-0.5">
              {events.length === 0 ? (
                <p className="k-dim text-center py-6">
                  Awaiting first observation…
                </p>
              ) : (
                events.map((evt) => {
                  const meta = LEVEL_META[evt.level];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={evt.id}
                      className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-[var(--k-panel-2)]/40 border-b border-[var(--k-line)]/20"
                    >
                      <span className="k-dim select-none shrink-0 text-[10px] pt-0.5">
                        {new Date(evt.ts).toISOString().slice(11, 19)}
                      </span>
                      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                      <span className={`k-badge ${meta.badge} text-[9px] shrink-0`}>
                        {evt.level}
                      </span>
                      <span className={`${meta.color} flex-1 min-w-0 break-words`}>
                        {evt.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Evidence decay tracker */}
        <div className="k-card flex flex-col min-h-[500px]">
          <div className="k-card-title">
            <Clock className="h-4 w-4" /> EVIDENCE DECAY TRACKER
            <span className="ml-auto k-badge k-badge-process normal-case tracking-normal text-[9px]">
              HALF-LIFE · 60s
            </span>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-3 flex-1 overflow-y-auto">
            {evidence.map((item) => {
              const ageSec = Math.max(
                0,
                Math.floor((Date.now() - item.receivedAt) / 1000),
              );
              const freshness = Math.max(0, 1 - ageSec / 60);
              const decayColor =
                ageSec < 30
                  ? 'k-pass'
                  : ageSec < 60
                    ? 'k-warn'
                    : 'k-danger';
              const decayBarColor =
                ageSec < 30
                  ? 'var(--k-green-bright)'
                  : ageSec < 60
                    ? 'var(--k-amber-bright)'
                    : 'var(--k-red-bright)';
              return (
                <div
                  key={item.id}
                  className="border border-[var(--k-line)] rounded-md p-2.5 bg-[var(--k-bg-elevated)]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold k-cyan">{item.id}</span>
                    <span className={`text-[10px] ${decayColor} font-bold tabular-nums`}>
                      {ageSec}s old
                    </span>
                  </div>
                  <p className="text-[10px] k-fg mb-1.5 truncate">{item.label}</p>
                  {/* Decay bar */}
                  <div className="h-2 bg-[var(--k-bg)] border border-[var(--k-line)] rounded overflow-hidden mb-1.5">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, freshness * 100)}%`,
                        background: decayBarColor,
                        boxShadow: `0 0 8px ${decayBarColor}`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] k-dim">
                    <span>HALF-LIFE · 60s</span>
                    <span className={decayColor}>
                      {ageSec < 60
                        ? `${(freshness * 100).toFixed(0)}% FRESH`
                        : 'STALE · RE-FETCH'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Separator className="my-3" />
          <p className="text-[10px] k-dim uppercase tracking-widest text-center">
            Evidence freshness decays linearly to zero at 60s · SIMULATION
            STREAM · NOT REAL TELEMETRY
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-start justify-center py-2 px-2 rounded border border-[var(--k-line)] bg-[var(--k-bg-elevated)]">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className="text-[10px] uppercase tracking-widest k-dim">
          {label}
        </span>
      </div>
      <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
