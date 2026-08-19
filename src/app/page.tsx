"use client";

/**
 * VVU Dashboard — single-page orchestrator for the dual-workspace shell.
 *
 * The dashboard has TWO states:
 *   - VVU STUDI  — corporate governance & academic instruction
 *   - VVU IVE    — industrial verification & engineering release
 *
 * The active workspace is held in localStorage via `WorkspaceProvider`.
 * The shell (sidebar nav, header, switcher, footer) is provided by
 * `<AppShell>`. The main content area renders the section selected in
 * the sidebar.
 *
 * The Webhook Delivery Subsystem is a registered plugin in the IVE Plugin
 * Registry. Clicking it opens `<WebhookPluginDetail>` which surfaces the
 * live subsystem state from the existing /api/v1/webhooks routes.
 *
 * ─── Interest Inception gate (Charter Article XII §12.4) ──────────────────
 * The dashboard is GATED on the Interest Inception modal. First-time
 * visitors see `<InterestInceptionModal>` with a blurred dashboard behind
 * it. Returning visitors (with `vvu-interest-inception` in localStorage)
 * see the dashboard directly. This is the immutable curiosity-first entry
 * point — no user ever sees a 'project' or 'claim' or 'evidence' field
 * before they've answered one question: "What are you interested in?"
 *
 * ─── Challenge Mode (auto-enabled) ──────────────────────────────────────────
 * A "Challenge Mode" section is registered in the STUDI sidebar. It is
 * auto-enabled for all users with a small explanatory badge:
 *   "This system challenges assumptions to improve accuracy."
 * Locked as the core UX principle for the Study Release.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace";
import { AppShell } from "@/components/vvu/app-shell";

// Interest Inception + Challenge Mode (auto-enabled)
import { InterestInceptionModal } from "@/components/studi/interest-inception-modal";
import { ChallengeMode } from "@/components/studi/challenge-mode";
import {
  loadInterestInception,
  type InterestInceptionState,
} from "@/lib/studi/interest-inception-state";

// STUDI views
import { StudiOverview } from "@/components/studi/studi-overview";
import { GateRoadmap } from "@/components/studi/gate-roadmap";
import { DocCertificate } from "@/components/studi/doc-certificate";
import { GoverningDocs } from "@/components/studi/governing-docs";

// IVE views
import { IveOverview } from "@/components/ive-workspace/ive-overview";
import {
  PluginRegistry,
  type PluginEntry,
} from "@/components/ive-workspace/plugin-registry";
import { WebhookPluginDetail } from "@/components/ive-workspace/webhook-plugin-detail";
import { IveClaimsPipeline } from "@/components/ive-workspace/ive-claims-pipeline";

// Shared VVU views
import { EvolutionMatrixPage } from "@/components/vvu/evolution-matrix-page";
import { ValveCockpit } from "@/components/vvu/valve-cockpit";

// Theorem-state watchdog poller — hydrates the global store every 5s.
// Mounted once at the dashboard root so the Evolution Matrix, hero
// backdrops, and any future status surface always read live state.
import { useTheoremPoller } from "@/lib/theorem/use-theorem-poller";

// Shared small views
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircuitBoard, HelpCircle, Sparkles } from "lucide-react";

// ─── Section metadata ──────────────────────────────────────────────────────

interface SectionMeta {
  title: string;
  abbr: string;
  breadcrumb: string[];
  /** Right-side status strip content for the sub-header */
  statusStrip?: React.ReactNode;
}

const SECTION_META: Record<string, SectionMeta> = {
  // STUDI sections
  "studi-overview": {
    title: "Overview",
    abbr: "OV",
    breadcrumb: ["STUDI", "Overview"],
  },
  "studi-interest-inception": {
    title: "Interest Inception",
    abbr: "II",
    breadcrumb: ["STUDI", "Interest Inception"],
    statusStrip: (
      <span className="rounded-md border border-vvu-studi/40 bg-vvu-studi/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--vvu-studi)" }}>
        curiosity-first · locked
      </span>
    ),
  },
  "studi-challenge-mode": {
    title: "Challenge Mode",
    abbr: "CM",
    breadcrumb: ["STUDI", "Challenge Mode"],
    statusStrip: (
      <span className="rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
        auto-enabled · 4 triggers
      </span>
    ),
  },
  "studi-gate-roadmap": {
    title: "5-Gate Roadmap",
    abbr: "5G",
    breadcrumb: ["STUDI", "5-Gate Roadmap"],
    statusStrip: (
      <span className="rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
        MO-GO · freeze
      </span>
    ),
  },
  "studi-doc-cert": {
    title: "Doc Certificate",
    abbr: "DOC",
    breadcrumb: ["STUDI", "Doc Certificate"],
  },
  "studi-governing-docs": {
    title: "Governing Documents",
    abbr: "GOV",
    breadcrumb: ["STUDI", "Governing Documents"],
  },
  "studi-charter": {
    title: "Charter",
    abbr: "CHT",
    breadcrumb: ["STUDI", "Charter"],
  },
  "studi-cipc": {
    title: "CIPC Filing",
    abbr: "CIPC",
    breadcrumb: ["STUDI", "CIPC Filing"],
  },
  "studi-audit": {
    title: "Audit Trail",
    abbr: "AUD",
    breadcrumb: ["STUDI", "Audit Trail"],
  },
  "studi-trust-bound": {
    title: "Trust Bound",
    abbr: "TB",
    breadcrumb: ["STUDI", "Trust Bound"],
  },
  "studi-fail-closed": {
    title: "Fail-Closed Operation",
    abbr: "FC",
    breadcrumb: ["STUDI", "Fail-Closed"],
  },
  "studi-evolution-matrix": {
    title: "Evolution Matrix",
    abbr: "EM",
    breadcrumb: ["STUDI", "Evolution Matrix"],
    statusStrip: (
      <span className="rounded-md border border-vvu-studi/40 bg-vvu-studi/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--vvu-studi)" }}>
        Fibonacci · 650 nodes
      </span>
    ),
  },
  "valve-cockpit": {
    title: "Valve Cockpit",
    abbr: "VC",
    breadcrumb: ["VVU", "Valve Cockpit"],
    statusStrip: (
      <span className="rounded-md border border-vvu-gold/40 bg-vvu-gold/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--vvu-gold)" }}>
        fail-closed · 4-stage morph
      </span>
    ),
  },
  // IVE sections
  "ive-overview": {
    title: "IVE Overview",
    abbr: "OV",
    breadcrumb: ["IVE", "Overview"],
  },
  "ive-trust-sphere": {
    title: "Trust Sphere",
    abbr: "TS",
    breadcrumb: ["IVE", "Trust Sphere"],
  },
  "ive-claims": {
    title: "Claims Pipeline",
    abbr: "CP",
    breadcrumb: ["IVE", "Claims Pipeline"],
    statusStrip: (
      <span className="rounded-md border border-vvu-ive/40 bg-vvu-ive/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--vvu-ive)" }}>
        EIS · fail-closed
      </span>
    ),
  },
  "ive-evidence-runtime": {
    title: "Evidence Runtime",
    abbr: "ER",
    breadcrumb: ["IVE", "Evidence Runtime"],
  },
  "ive-release": {
    title: "Release Report",
    abbr: "RR",
    breadcrumb: ["IVE", "Release Report"],
  },
  "ive-adapter": {
    title: "Adapter Attribution",
    abbr: "ADP",
    breadcrumb: ["IVE", "Adapter Attribution"],
  },
  "ive-integrity": {
    title: "Integrity Closure",
    abbr: "INT",
    breadcrumb: ["IVE", "Integrity Closure"],
  },
  "ive-acceptance": {
    title: "Acceptance",
    abbr: "ACC",
    breadcrumb: ["IVE", "Acceptance"],
  },
  "ive-plugins": {
    title: "Plugin Registry",
    abbr: "PR",
    breadcrumb: ["IVE", "Plugin Registry"],
  },
  "ive-amd": {
    title: "AMD Runtime",
    abbr: "AMD",
    breadcrumb: ["IVE", "AMD Runtime"],
  },
  "ive-zoo": {
    title: "Zoo Runtime",
    abbr: "ZOO",
    breadcrumb: ["IVE", "Zoo Runtime"],
  },
  "ive-hbk": {
    title: "HBK Workspace",
    abbr: "HBA",
    breadcrumb: ["IVE", "HBK Workspace"],
  },
  "ive-cad": {
    title: "CAD Viewer",
    abbr: "CAD",
    breadcrumb: ["IVE", "CAD Viewer"],
  },
  "ive-webhook": {
    title: "Webhook Delivery Subsystem",
    abbr: "WH",
    breadcrumb: ["IVE", "Webhook Delivery"],
    statusStrip: (
      <span className="rounded-md border border-vvu-ive/40 bg-vvu-ive/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--vvu-ive)" }}>
        v1.1 · launch 09-15
      </span>
    ),
  },
  "ive-evolution-matrix": {
    title: "Evolution Matrix",
    abbr: "EM",
    breadcrumb: ["IVE", "Evolution Matrix"],
    statusStrip: (
      <span className="rounded-md border border-vvu-ive/40 bg-vvu-ive/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--vvu-ive)" }}>
        Fibonacci · 650 nodes
      </span>
    ),
  },
  "ive-help": {
    title: "Help & FAQ",
    abbr: "FAQ",
    breadcrumb: ["IVE", "Help & FAQ"],
  },
};

// ─── Placeholder for not-yet-implemented sections ─────────────────────────

function NotYetImplemented({ sectionId, title }: { sectionId: string; title: string }) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted/40">
          <CircuitBoard className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            This module is registered in the sidebar but its full UI is still
            being built. The reliability contract and fail-closed bound still
            hold; the surface area is what&rsquo;s pending.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
          {sectionId} · pending
        </Badge>
      </CardContent>
    </Card>
  );
}

// ─── Inner component (uses workspace context) ──────────────────────────────

function DashboardInner() {
  // Mount the theorem-state watchdog. Lives for the lifetime of the
  // dashboard; auto-pauses when the tab is hidden, resumes on focus.
  useTheoremPoller();

  const { workspace } = useWorkspace();
  // Per-workspace active section. Defaults to the workspace overview.
  const [studiSection, setStudiSection] = useState("studi-overview");
  const [iveSection, setIveSection] = useState("ive-overview");
  const [openedPlugin, setOpenedPlugin] = useState<string | null>(null);

  // When the user switches workspaces, clear any opened plugin.
  useEffect(() => {
    setOpenedPlugin(null);
  }, [workspace]);

  const activeSection = workspace === "studi" ? studiSection : iveSection;

  const handleSectionChange = useCallback(
    (id: string) => {
      if (workspace === "studi") {
        setStudiSection(id);
      } else {
        setIveSection(id);
        // If we navigate away from the plugin registry, close any opened plugin
        if (id !== "ive-plugins") {
          setOpenedPlugin(null);
        }
      }
    },
    [workspace]
  );

  // Aggregate webhook stats — fetched for the Plugin Registry card.
  // Only fetched when in IVE mode (saves a request in STUDI mode).
  const [webhookStats, setWebhookStats] = useState<{
    totalWebhooks: number;
    activeWebhooks: number;
    openBreakers: number;
    dlqDepth: number;
    successRate: number | null;
  } | null>(null);

  useEffect(() => {
    if (workspace !== "ive") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/stats/webhooks", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setWebhookStats({
          totalWebhooks: data.totalWebhooks ?? 0,
          activeWebhooks: data.activeWebhooks ?? 0,
          openBreakers: data.openBreakers ?? 0,
          dlqDepth: data.dlqDepth ?? 0,
          successRate: data.last24h?.successRate ?? null,
        });
      } catch {
        // dashboard widget is non-critical — leave stats null on error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace, iveSection]);

  // Render the main content based on workspace + section + opened plugin
  const content = useMemo(() => {
    if (workspace === "studi") {
      switch (studiSection) {
        case "studi-overview":
          return <StudiOverview />;
        case "studi-interest-inception":
          return <InterestInceptionReview />;
        case "studi-challenge-mode":
          return <ChallengeMode />;
        case "studi-gate-roadmap":
          return <GateRoadmap />;
        case "studi-doc-cert":
          return <DocCertificate />;
        case "studi-governing-docs":
          return <GoverningDocs />;
        case "studi-evolution-matrix":
          return <EvolutionMatrixPage />;
        case "valve-cockpit":
          return <ValveCockpit />;
        default:
          return (
            <NotYetImplemented
              sectionId={studiSection}
              title={SECTION_META[studiSection]?.title ?? studiSection}
            />
          );
      }
    }
    // IVE workspace
    // If a plugin was opened from the registry, render its detail view
    if (openedPlugin === "webhook-subsystem") {
      return (
        <WebhookPluginDetail onBack={() => setOpenedPlugin(null)} />
      );
    }
    if (openedPlugin) {
      // Other plugins not yet implemented in detail
      return (
        <NotYetImplemented
          sectionId={`plugin:${openedPlugin}`}
          title={`Plugin: ${openedPlugin}`}
        />
      );
    }
    switch (iveSection) {
      case "ive-overview":
        return <IveOverview onNavigate={handleSectionChange} />;
      case "ive-claims":
        return <IveClaimsPipeline />;
      case "ive-plugins":
        return (
          <PluginRegistry
            onSelectPlugin={(pid) => setOpenedPlugin(pid)}
            webhookStats={webhookStats}
          />
        );
      case "ive-webhook":
        return <WebhookPluginDetail />;
      case "ive-evolution-matrix":
        return <EvolutionMatrixPage />;
      case "valve-cockpit":
        return <ValveCockpit />;
      case "ive-help":
        return <IveFaqView />;
      default:
        return (
          <NotYetImplemented
            sectionId={iveSection}
            title={SECTION_META[iveSection]?.title ?? iveSection}
          />
        );
    }
  }, [workspace, studiSection, iveSection, openedPlugin, webhookStats, handleSectionChange]);

  const meta = SECTION_META[activeSection] ?? {
    title: activeSection,
    abbr: "?",
    breadcrumb: [workspace.toUpperCase(), activeSection],
  };

  // When a plugin is opened, override the page title to reflect that
  const pageTitle =
    openedPlugin === "webhook-subsystem"
      ? "Webhook Delivery Subsystem"
      : openedPlugin
        ? `Plugin: ${openedPlugin}`
        : meta.title;

  const pageAbbr =
    openedPlugin === "webhook-subsystem" ? "WH" : meta.abbr;

  const breadcrumb =
    openedPlugin === "webhook-subsystem"
      ? ["IVE", "Plugin Registry", "Webhook Subsystem"]
      : openedPlugin
        ? ["IVE", "Plugin Registry", openedPlugin]
        : meta.breadcrumb;

  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      pageTitle={pageTitle}
      pageAbbr={pageAbbr}
      breadcrumb={breadcrumb}
      statusStrip={meta.statusStrip}
    >
      {content}
    </AppShell>
  );
}

// ─── Inline IVE FAQ view ───────────────────────────────────────────────────

function IveFaqView() {
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "What is IVE?",
      a: "IVE is the Integrated Verification Environment — the engineering face of VVU. It binds every claim to evidence, every evidence item to an independent source, and every authorization decision to a fail-closed bound defined by the Evidence Independence Specification.",
    },
    {
      q: "Why is release GO blocked?",
      a: "The engineering release is held in BLOCKED state until the STUDI workspace clears its governance gates. This is by design — STUDI and IVE are the two halves of a single fail-closed valve. No legal closure ⇒ no engineering release, period.",
    },
    {
      q: "How does the Webhook Subsystem fit in?",
      a: "It is registered as a plugin in the IVE Plugin Registry. Every successful verification can fan out to external systems (ProofBridge, GitHub, Discord) via the webhook delivery queue — Kafka 12 partitions, per-webhook circuit breaker, 4-attempt retry, 30-day DLQ, at-least-once idempotent delivery.",
    },
    {
      q: "What does fail-closed actually mean?",
      a: "EIS Theorem 5: loss of evidence ⇒ loss of verification ⇒ loss of authorization ⇒ breaker trips ⇒ action blocked. The breaker cannot be reset by retrying — it requires explicit operator intervention AND re-establishment of the evidence chain.",
    },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Help & FAQ</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Short answers to the most common questions about VVU IVE.
        </p>
      </div>
      <Card>
        <CardContent className="divide-y divide-border/60 p-0">
          {faqs.map((f, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {f.q}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Interest Inception review (for returning visitors who want to revisit) ─

function InterestInceptionReview() {
  const [state, setState] = useState<InterestInceptionState | null>(null);

  useEffect(() => {
    setState(loadInterestInception());
  }, []);

  if (!state || !state.completed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Sparkles className="h-8 w-8 text-vvu-studi" />
          <h2 className="text-lg font-bold tracking-tight">
            You haven&rsquo;t answered yet
          </h2>
          <p className="text-xs text-muted-foreground max-w-md">
            The Interest Inception modal is the immutable entry point for
            every VVU user. It should appear automatically on first visit. If
            you don&rsquo;t see it, refresh the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Interest Inception</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your immutable curiosity-first entry point. Reset to start over
          with a new interest.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Your interest
            </div>
            <p className="text-sm font-medium italic">
              &ldquo;{state.interest}&rdquo;
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Category
            </div>
            <p className="text-sm font-medium">{state.interestCategory}</p>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Bridging prompt
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {state.bridgingPrompt}
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Implicit Project ID
            </div>
            <p className="font-mono text-sm font-semibold text-vvu-studi">
              {state.projectId}
            </p>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Captured: {state.timestamp}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page wrapper (Interest Inception gate) ────────────────────────────────

export default function Home() {
  // Hydration flag — server renders null until client evaluates localStorage.
  const [hydrated, setHydrated] = useState(false);
  const [inception, setInception] = useState<InterestInceptionState | null>(null);

  useEffect(() => {
    setHydrated(true);
    setInception(loadInterestInception());
  }, []);

  if (!hydrated) {
    return null;
  }

  // Gate: if interest inception is not completed, show the modal with the
  // blurred dashboard behind it.
  if (!inception?.completed) {
    return (
      <WorkspaceProvider>
        <InterestInceptionModal onComplete={(state) => setInception(state)}>
          <DashboardInner />
        </InterestInceptionModal>
      </WorkspaceProvider>
    );
  }

  return (
    <WorkspaceProvider>
      <DashboardInner />
    </WorkspaceProvider>
  );
}
