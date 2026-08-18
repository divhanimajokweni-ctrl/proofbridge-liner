"use client";

/**
 * VVU Study Mode — Dual-Render Pipeline
 * =======================================
 *
 * Three tracks (Research / Engineering / Sports) share one pipeline:
 *
 *   LOAD FILE → PARSE → STUDY ARTIFACT
 *                        │
 *                        ▼
 *                  ┌─────────────┐
 *                  │  RENDERER   │  ◄── Port A: geometry/base (immediate)
 *                  │  (immediate)│
 *                  └──────┬──────┘
 *                         │
 *                         ▼
 *                  ┌─────────────┐
 *                  │  IVE CORE   │  ◄── runs EIS verification
 *                  │  (~3s)      │
 *                  └──────┬──────┘
 *                         │
 *                         ▼
 *                  ┌─────────────┐
 *                  │  RENDERER   │  ◄── Port B: epistemic overlay (eventual)
 *                  │  (overlay)  │      VERIFIED=green, INCONCLUSIVE=orange,
 *                  └─────────────┘     FALSIFIED=red, UNTESTED=slate
 *
 * The UI MUST stay interactive during the ~3s verification window — the
 * user can rotate the 3D building, scrub the sports timeline, or hover
 * citation graph nodes the entire time. That is the VVU-native interaction
 * model: visualization is the interface to understanding; verification
 * is the overlay to trust. Neither exists without the other.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TRACKS,
  type StudyArtifact,
  type Track,
  runVerification,
  EIS_HEX,
} from "@/lib/study/artifacts";
import type { VerificationState } from "@/lib/eis/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ResearchTrack } from "@/components/study/research-track";
import { EngineeringTrack } from "@/components/study/engineering-track";
import { SportsTrack } from "@/components/study/sports-track";

type VerificationMap = Map<string, VerificationState>;

export function StudyWorkspace() {
  const [trackId, setTrackId] = useState<Track>("engineering");
  const [artifact, setArtifact] = useState<StudyArtifact>(() =>
    TRACKS[1].generator()
  );
  const [verifying, setVerifying] = useState(false);
  const [verifications, setVerifications] = useState<VerificationMap>(new Map());
  const [selected, setSelected] = useState<string | null>(null);

  // The current track object (label, generator)
  const current = useMemo(
    () => TRACKS.find((t) => t.id === trackId)!,
    [trackId]
  );

  // Switching tracks = reset artifact + clear verifications
  const switchTrack = useCallback((id: Track) => {
    const t = TRACKS.find((t) => t.id === id)!;
    setTrackId(id);
    setArtifact(t.generator());
    setVerifications(new Map());
    setSelected(null);
  }, []);

  // RESET STUDY — regenerate the same track's synthetic data + clear verifications
  const resetStudy = useCallback(() => {
    setArtifact(current.generator());
    setVerifications(new Map());
    setSelected(null);
  }, [current]);

  // RUN IVE — kicks off the verification with a 3s simulated delay
  const runIve = useCallback(() => {
    setVerifying(true);
    setVerifications(new Map());
    runVerification(artifact, 3000).then((map) => {
      setVerifications(map);
      setVerifying(false);
    });
  }, [artifact]);

  // When the artifact changes, clear verifications (they no longer match)
  useEffect(() => {
    setVerifications(new Map());
  }, [artifact]);

  // Counts for the summary header
  const counts = useMemo(() => {
    const total = artifact.components.length;
    const verified = Array.from(verifications.values()).filter((s) =>
      ["PROVEN", "VERIFIED", "SUPPORTED"].includes(s)
    ).length;
    const inconclusive = Array.from(verifications.values()).filter(
      (s) => s === "INCONCLUSIVE"
    ).length;
    const falsified = Array.from(verifications.values()).filter(
      (s) => s === "FALSIFIED"
    ).length;
    const unverified = total - verified - inconclusive - falsified;
    return { total, verified, inconclusive, falsified, unverified };
  }, [artifact, verifications]);

  const selectedComponent = selected
    ? artifact.components.find((c) => c.id === selected) ?? null
    : null;
  const selectedState = selected ? verifications.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{artifact.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                {artifact.description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetStudy}>
                Reset Study
              </Button>
              <Button
                onClick={runIve}
                disabled={verifying}
                className="min-w-32"
              >
                {verifying ? "IVE verifying…" : "Run IVE Verification"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <Stat label="Components" value={counts.total} />
            <Stat
              label="Verified"
              value={counts.verified}
              color="#22c55e"
            />
            <Stat
              label="Inconclusive"
              value={counts.inconclusive}
              color="#f97316"
            />
            <Stat
              label="Falsified"
              value={counts.falsified}
              color="#ef4444"
            />
            <Stat
              label="Unverified"
              value={counts.unverified}
              color="#64748b"
            />
            <div className="ml-auto flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Pipeline:</div>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                PARSE → RENDER(A) → IVE → OVERLAY(B)
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={trackId}
        onValueChange={(v) => switchTrack(v as Track)}
        className="w-full"
      >
        <TabsList>
          {TRACKS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={trackId} className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            {/* Renderer (left, grows) */}
            <Card className="min-h-[480px]">
              <CardContent className="p-0 h-[480px] relative overflow-hidden rounded-lg">
                {trackId === "research" && (
                  <ResearchTrack
                    artifact={artifact}
                    verifications={verifications}
                    verifying={verifying}
                    onSelect={setSelected}
                    selected={selected}
                  />
                )}
                {trackId === "engineering" && (
                  <EngineeringTrack
                    artifact={artifact}
                    verifications={verifications}
                    verifying={verifying}
                    onSelect={setSelected}
                    selected={selected}
                  />
                )}
                {trackId === "sports" && (
                  <SportsTrack
                    artifact={artifact}
                    verifications={verifications}
                    verifying={verifying}
                    onSelect={setSelected}
                    selected={selected}
                  />
                )}
                {/* Verifying badge — top-right floating */}
                {verifying && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-xs border">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    IVE running — UI remains interactive
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inspector (right, fixed) */}
            <Card className="h-[480px] overflow-auto">
              <CardHeader>
                <CardTitle className="text-sm">Inspector</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {selectedComponent ? (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">Label</div>
                      <div className="font-mono">{selectedComponent.label}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">ID</div>
                      <div className="font-mono text-xs">{selectedComponent.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Kind</div>
                      <div className="font-mono">{selectedComponent.kind}</div>
                    </div>
                    {selectedComponent.anomaly && (
                      <div className="rounded border border-red-500/40 bg-red-500/5 p-2">
                        <div className="text-xs font-semibold text-red-500">
                          Anomaly: {selectedComponent.anomaly.kind}
                        </div>
                        <div className="text-xs mt-1">
                          {selectedComponent.anomaly.description}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">
                        IVE verdict
                      </div>
                      {selectedState ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ background: EIS_HEX[selectedState] }}
                          />
                          <span className="font-mono">{selectedState}</span>
                        </div>
                      ) : verifying ? (
                        <span className="text-xs text-amber-500">
                          Verifying…
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not yet verified — click Run IVE
                        </span>
                      )}
                    </div>
                    {selectedComponent.base.meta && (
                      <div>
                        <div className="text-xs text-muted-foreground">Meta</div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(selectedComponent.base.meta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Click any component in the renderer to inspect it.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
        />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
