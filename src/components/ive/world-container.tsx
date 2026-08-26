"use client";

import { useState, useCallback } from "react";
import { ROOMS, type RoomId, type ActivityDef } from "@/lib/ive/world-architecture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Lock,
  ChevronRight,
  Globe,
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import { type UserRole, ROLE_TIERS } from "@/lib/ive/architecture";
import { ParticleField } from "./particle-field";

// ─── Existing tab components (reused as Activities, NOT rewritten) ───
import { OverviewTab } from "./tabs/overview-tab";
import { HbkTab } from "./tabs/hbk-tab";
import { FacilitatorTab } from "./tabs/facilitator-tab";
import { IntegrationTab } from "./tabs/integration-tab";
import { AirTab } from "./tabs/air-tab";
import { CryptoTab } from "./tabs/crypto-tab";
import { SandboxTab } from "./tabs/sandbox-tab";
import { CanvasTab } from "./tabs/canvas-tab";
import { AerospaceTab } from "./tabs/aerospace-tab";
import { SearmTab } from "./tabs/searm-tab";
import { FieldTab } from "./tabs/field-tab";
import { DevSdkTab } from "./tabs/dev-sdk-tab";
import { AntpayTab } from "./tabs/antpay-tab";
import { PoolsTab } from "./tabs/pools-tab";
import { IntegrationsTab } from "./tabs/integrations-tab";
import { StudioTab } from "./tabs/studio-tab";

/**
 * World container — the spatial runtime for VRES v1.0.
 *
 * This is NOT a state toggle. It is a genuine spatial environment:
 * - World view shows 6 selectable Rooms
 * - Entering a Room replaces the World view with the Room's working viewport
 * - The Room's Activity owns the full working area
 * - Room navigation remains available (back to World, switch activities)
 * - Guest restrictions apply (locked rooms are dimmed)
 *
 * Existing tab components are reused as Activities — their internals are NOT changed.
 * Only their containment changes (from dashboard tab → Room activity).
 */
export function WorldContainer({
  role,
  onUpgrade,
}: {
  role: UserRole;
  onUpgrade: () => void;
}) {
  const [activeRoom, setActiveRoom] = useState<RoomId | null>(null);
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  const enterRoom = useCallback((roomId: RoomId) => {
    const room = ROOMS.find((r) => r.id === roomId);
    if (!room) return;
    // Guests can only access guest-accessible rooms
    if (!room.guestAccessible && role === "guest") return;
    setActiveRoom(roomId);
    // Auto-select first activity
    if (room.activities.length > 0) {
      setActiveActivity(room.activities[0].id);
    }
  }, [role]);

  const exitToWorld = useCallback(() => {
    setActiveRoom(null);
    setActiveActivity(null);
  }, []);

  // ─── WORLD VIEW (no room entered) ───
  if (!activeRoom) {
    return <WorldView role={role} onEnterRoom={enterRoom} onUpgrade={onUpgrade} />;
  }

  // ─── ROOM VIEW (room entered, activity owns viewport) ───
  const room = ROOMS.find((r) => r.id === activeRoom);
  if (!room) return null;

  const activity = room.activities.find((a) => a.id === activeActivity) ?? room.activities[0];

  return (
    <RoomView
      room={room}
      activity={activity}
      onExitToWorld={exitToWorld}
      onSwitchActivity={setActiveActivity}
      role={role}
    />
  );
}

// ─── World View — the spatial landing with 6 rooms ───

function WorldView({
  role,
  onEnterRoom,
  onUpgrade,
}: {
  role: UserRole;
  onEnterRoom: (roomId: RoomId) => void;
  onUpgrade: () => void;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <ParticleField density={35} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        {/* World header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-wide">
              <span className="ive-text-gold">VVU</span> World
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Spatial container · 6 Rooms · select a Room to enter its working viewport
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
              Role: {ROLE_TIERS[role].label}
            </Badge>
            {role === "guest" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUpgrade}
                className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
              >
                <Lock className="h-3 w-3" />
                Unlock Rooms
              </Button>
            )}
          </div>
        </div>

        {/* Room grid — 6 rooms as spatial zones */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROOMS.map((room) => {
            const locked = !room.guestAccessible && role === "guest";
            const existingCount = room.activities.filter((a) => a.status === "exists").length;
            const partialCount = room.activities.filter((a) => a.status === "partial").length;
            const missingCount = room.activities.filter((a) => a.status === "missing").length;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => !locked && onEnterRoom(room.id)}
                disabled={locked}
                className={`group relative overflow-hidden rounded-xl border p-6 text-left transition-all ${
                  locked
                    ? "cursor-not-allowed border-border/20 opacity-40"
                    : "border-border/40 bg-secondary/20 hover:border-[oklch(0.82_0.16_75/40%)] hover:bg-secondary/40"
                }`}
              >
                {/* Room icon */}
                <div className="mb-3 text-4xl">{room.icon}</div>

                {/* Room name */}
                <div className="font-mono text-lg font-bold">{room.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{room.description}</div>

                {/* Activity count */}
                <div className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" />
                    {existingCount} ready
                  </span>
                  {partialCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <MinusCircle className="h-3 w-3" />
                      {partialCount} partial
                    </span>
                  )}
                  {missingCount > 0 && (
                    <span className="flex items-center gap-1 text-rose-500">
                      <AlertTriangle className="h-3 w-3" />
                      {missingCount} missing
                    </span>
                  )}
                </div>

                {/* Lock overlay for guests */}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Unlock to enter
                      </span>
                    </div>
                  </div>
                )}

                {/* Enter chevron */}
                {!locked && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronRight className="h-6 w-6 ive-text-gold" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* World footer — overview metrics */}
        <Card className="mt-6 ive-glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 ive-text-gold" />
              <span className="font-mono uppercase tracking-widest">
                World · {ROOMS.length} rooms · {ROOMS.reduce((s, r) => s + r.activities.length, 0)} activities · {ROLE_TIERS[role].visibleTabs.length} accessible
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Room View — the room's working viewport with activity mounted ───

function RoomView({
  room,
  activity,
  onExitToWorld,
  onSwitchActivity,
  role: _role,
}: {
  room: typeof ROOMS[number];
  activity: ActivityDef;
  onExitToWorld: () => void;
  onSwitchActivity: (id: string) => void;
  role: UserRole;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Room header — navigation bar */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Left: back to World + room name */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExitToWorld}
              className="gap-1.5 font-mono text-xs uppercase tracking-widest"
            >
              <ArrowLeft className="h-4 w-4" />
              World
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono text-sm font-bold">
              {room.icon} {room.name}
            </span>
          </div>

          {/* Right: activity switcher within room */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {room.activities.map((a) => {
              const isActive = a.id === activity.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSwitchActivity(a.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <span>{a.icon}</span>
                  {a.name}
                  {a.status === "missing" && (
                    <AlertTriangle className="h-3 w-3 text-rose-500" />
                  )}
                  {a.status === "partial" && (
                    <MinusCircle className="h-3 w-3 text-amber-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity viewport — owns the full working area */}
      <div className="flex-1">
        <ActivityViewport activity={activity} />
      </div>
    </div>
  );
}

// ─── Activity Viewport — mounts the existing tab component as the activity ───

function ActivityViewport({ activity }: { activity: ActivityDef }) {
  // Map sourceTab → existing component
  // These are REUSED, not rewritten. Their internals are unchanged.

  if (activity.status === "missing") {
    return <MissingActivity activity={activity} />;
  }

  switch (activity.sourceTab) {
    case "hbk":
      return <HbkTab />;
    case "facilitator":
      return <FacilitatorTab />;
    case "integration":
      return <IntegrationTab />;
    case "air":
      return <AirTab />;
    case "crypto":
      return <CryptoTab />;
    case "sandbox":
      return <SandboxTab />;
    case "canvas":
      return <CanvasTab />;
    case "aerospace":
      return <AerospaceTab />;
    case "drone":
      return (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <iframe
            src="/vvu-drone-simulator.html"
            title="VVU 3D Drone Simulator"
            className="h-[760px] w-full"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    case "searm":
      return <SearmTab />;
    case "field":
      return <FieldTab />;
    case "devsdk":
      return <DevSdkTab />;
    case "antpay":
      return <AntpayTab />;
    case "pools":
      return <PoolsTab />;
    case "integrations":
      return <IntegrationsTab />;
    case "studio":
      return <StudioTab />;
    case "overview":
      return <OverviewTab onJump={() => {}} />;
    default:
      return <MissingActivity activity={activity} />;
  }
}

// ─── Missing Activity — honest placeholder for things that don't exist ───

function MissingActivity({ activity }: { activity: ActivityDef }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">{activity.icon}</div>
      <h2 className="font-mono text-xl font-bold">{activity.name}</h2>
      <div className="max-w-md space-y-2">
        <Badge variant="outline" className="border-[oklch(0.65_0.21_22/40%)] text-rose-500">
          {activity.status === "missing" ? "DOES NOT EXIST" : "PARTIAL"}
        </Badge>
        <p className="text-sm text-muted-foreground">{activity.statusNote}</p>
      </div>
      <div className="rounded-lg border border-border/40 bg-secondary/20 p-4 font-mono text-xs text-muted-foreground">
        <div className="mb-2 uppercase tracking-widest">Phase 6-7 / 11 Requirement</div>
        <div>
          This activity requires new implementation. It is not a reuse of
          an existing component. The inventory at{" "}
          <code>/download/VRES_V1_INVENTORY.md</code> documents what exists
          and what must be built.
        </div>
      </div>
    </div>
  );
}
