"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace";
import { AppShell } from "@/components/vvu/app-shell";
import { InterestInceptionModal } from "@/components/studi/interest-inception-modal";
import { ChallengeMode } from "@/components/studi/challenge-mode";
import {
  loadInterestInception
} from "@/lib/studi/interest-inception-state";
import { StudiOverview } from "@/components/studi/studi-overview";
import { GateRoadmap } from "@/components/studi/gate-roadmap";
import { DocCertificate } from "@/components/studi/doc-certificate";
import { GoverningDocs } from "@/components/studi/governing-docs";
import { IveOverview } from "@/components/ive-workspace/ive-overview";
import {
  PluginRegistry
} from "@/components/ive-workspace/plugin-registry";
import { WebhookPluginDetail } from "@/components/ive-workspace/webhook-plugin-detail";
import { IveClaimsPipeline } from "@/components/ive-workspace/ive-claims-pipeline";
import { EvolutionMatrixPage } from "@/components/vvu/evolution-matrix-page";
import { ValveCockpit } from "@/components/vvu/valve-cockpit";
import { useTheoremPoller } from "@/lib/theorem/use-theorem-poller";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircuitBoard, HelpCircle, Sparkles } from "lucide-react";
const SECTION_META = {
  // STUDI sections
  "studi-overview": {
    title: "Overview",
    abbr: "OV",
    breadcrumb: ["STUDI", "Overview"]
  },
  "studi-interest-inception": {
    title: "Interest Inception",
    abbr: "II",
    breadcrumb: ["STUDI", "Interest Inception"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-vvu-studi/40 bg-vvu-studi/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", style: { color: "var(--vvu-studi)" }, children: "curiosity-first \xB7 locked" })
  },
  "studi-challenge-mode": {
    title: "Challenge Mode",
    abbr: "CM",
    breadcrumb: ["STUDI", "Challenge Mode"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-400", children: "auto-enabled \xB7 4 triggers" })
  },
  "studi-gate-roadmap": {
    title: "5-Gate Roadmap",
    abbr: "5G",
    breadcrumb: ["STUDI", "5-Gate Roadmap"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-400", children: "MO-GO \xB7 freeze" })
  },
  "studi-doc-cert": {
    title: "Doc Certificate",
    abbr: "DOC",
    breadcrumb: ["STUDI", "Doc Certificate"]
  },
  "studi-governing-docs": {
    title: "Governing Documents",
    abbr: "GOV",
    breadcrumb: ["STUDI", "Governing Documents"]
  },
  "studi-charter": {
    title: "Charter",
    abbr: "CHT",
    breadcrumb: ["STUDI", "Charter"]
  },
  "studi-cipc": {
    title: "CIPC Filing",
    abbr: "CIPC",
    breadcrumb: ["STUDI", "CIPC Filing"]
  },
  "studi-audit": {
    title: "Audit Trail",
    abbr: "AUD",
    breadcrumb: ["STUDI", "Audit Trail"]
  },
  "studi-trust-bound": {
    title: "Trust Bound",
    abbr: "TB",
    breadcrumb: ["STUDI", "Trust Bound"]
  },
  "studi-fail-closed": {
    title: "Fail-Closed Operation",
    abbr: "FC",
    breadcrumb: ["STUDI", "Fail-Closed"]
  },
  "studi-evolution-matrix": {
    title: "Evolution Matrix",
    abbr: "EM",
    breadcrumb: ["STUDI", "Evolution Matrix"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-vvu-studi/40 bg-vvu-studi/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", style: { color: "var(--vvu-studi)" }, children: "Fibonacci \xB7 650 nodes" })
  },
  "valve-cockpit": {
    title: "Valve Cockpit",
    abbr: "VC",
    breadcrumb: ["VVU", "Valve Cockpit"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-vvu-gold/40 bg-vvu-gold/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", style: { color: "var(--vvu-gold)" }, children: "fail-closed \xB7 4-stage morph" })
  },
  // IVE sections
  "ive-overview": {
    title: "IVE Overview",
    abbr: "OV",
    breadcrumb: ["IVE", "Overview"]
  },
  "ive-trust-sphere": {
    title: "Trust Sphere",
    abbr: "TS",
    breadcrumb: ["IVE", "Trust Sphere"]
  },
  "ive-claims": {
    title: "Claims Pipeline",
    abbr: "CP",
    breadcrumb: ["IVE", "Claims Pipeline"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-vvu-ive/40 bg-vvu-ive/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", style: { color: "var(--vvu-ive)" }, children: "EIS \xB7 fail-closed" })
  },
  "ive-evidence-runtime": {
    title: "Evidence Runtime",
    abbr: "ER",
    breadcrumb: ["IVE", "Evidence Runtime"]
  },
  "ive-release": {
    title: "Release Report",
    abbr: "RR",
    breadcrumb: ["IVE", "Release Report"]
  },
  "ive-adapter": {
    title: "Adapter Attribution",
    abbr: "ADP",
    breadcrumb: ["IVE", "Adapter Attribution"]
  },
  "ive-integrity": {
    title: "Integrity Closure",
    abbr: "INT",
    breadcrumb: ["IVE", "Integrity Closure"]
  },
  "ive-acceptance": {
    title: "Acceptance",
    abbr: "ACC",
    breadcrumb: ["IVE", "Acceptance"]
  },
  "ive-plugins": {
    title: "Plugin Registry",
    abbr: "PR",
    breadcrumb: ["IVE", "Plugin Registry"]
  },
  "ive-amd": {
    title: "AMD Runtime",
    abbr: "AMD",
    breadcrumb: ["IVE", "AMD Runtime"]
  },
  "ive-zoo": {
    title: "Zoo Runtime",
    abbr: "ZOO",
    breadcrumb: ["IVE", "Zoo Runtime"]
  },
  "ive-hbk": {
    title: "HBK Workspace",
    abbr: "HBA",
    breadcrumb: ["IVE", "HBK Workspace"]
  },
  "ive-cad": {
    title: "CAD Viewer",
    abbr: "CAD",
    breadcrumb: ["IVE", "CAD Viewer"]
  },
  "ive-webhook": {
    title: "Webhook Delivery Subsystem",
    abbr: "WH",
    breadcrumb: ["IVE", "Webhook Delivery"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-vvu-ive/40 bg-vvu-ive/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", style: { color: "var(--vvu-ive)" }, children: "v1.1 \xB7 launch 09-15" })
  },
  "ive-evolution-matrix": {
    title: "Evolution Matrix",
    abbr: "EM",
    breadcrumb: ["IVE", "Evolution Matrix"],
    statusStrip: /* @__PURE__ */ jsx("span", { className: "rounded-md border border-vvu-ive/40 bg-vvu-ive/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider", style: { color: "var(--vvu-ive)" }, children: "Fibonacci \xB7 650 nodes" })
  },
  "ive-help": {
    title: "Help & FAQ",
    abbr: "FAQ",
    breadcrumb: ["IVE", "Help & FAQ"]
  }
};
function NotYetImplemented({ sectionId, title }) {
  return /* @__PURE__ */ jsx(Card, { className: "border-border/70", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col items-center justify-center gap-3 py-16 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsx(CircuitBoard, { className: "h-5 w-5 text-muted-foreground/70" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold tracking-tight", children: title }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground max-w-md", children: "This module is registered in the sidebar but its full UI is still being built. The reliability contract and fail-closed bound still hold; the surface area is what\u2019s pending." })
    ] }),
    /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "font-mono text-[10px] uppercase tracking-wider", children: [
      sectionId,
      " \xB7 pending"
    ] })
  ] }) });
}
function DashboardInner() {
  var _a;
  useTheoremPoller();
  const { workspace } = useWorkspace();
  const [studiSection, setStudiSection] = useState("studi-overview");
  const [iveSection, setIveSection] = useState("ive-overview");
  const [openedPlugin, setOpenedPlugin] = useState(null);
  useEffect(() => {
    setOpenedPlugin(null);
  }, [workspace]);
  const activeSection = workspace === "studi" ? studiSection : iveSection;
  const handleSectionChange = useCallback(
    (id) => {
      if (workspace === "studi") {
        setStudiSection(id);
      } else {
        setIveSection(id);
        if (id !== "ive-plugins") {
          setOpenedPlugin(null);
        }
      }
    },
    [workspace]
  );
  const [webhookStats, setWebhookStats] = useState(null);
  useEffect(() => {
    if (workspace !== "ive") return;
    let cancelled = false;
    (async () => {
      var _a2, _b, _c, _d, _e, _f;
      try {
        const res = await fetch("/api/v1/stats/webhooks", {
          cache: "no-store"
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setWebhookStats({
          totalWebhooks: (_a2 = data.totalWebhooks) != null ? _a2 : 0,
          activeWebhooks: (_b = data.activeWebhooks) != null ? _b : 0,
          openBreakers: (_c = data.openBreakers) != null ? _c : 0,
          dlqDepth: (_d = data.dlqDepth) != null ? _d : 0,
          successRate: (_f = (_e = data.last24h) == null ? void 0 : _e.successRate) != null ? _f : null
        });
      } catch (e) {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspace, iveSection]);
  const content = useMemo(() => {
    var _a2, _b, _c, _d;
    if (workspace === "studi") {
      switch (studiSection) {
        case "studi-overview":
          return /* @__PURE__ */ jsx(StudiOverview, {});
        case "studi-interest-inception":
          return /* @__PURE__ */ jsx(InterestInceptionReview, {});
        case "studi-challenge-mode":
          return /* @__PURE__ */ jsx(ChallengeMode, {});
        case "studi-gate-roadmap":
          return /* @__PURE__ */ jsx(GateRoadmap, {});
        case "studi-doc-cert":
          return /* @__PURE__ */ jsx(DocCertificate, {});
        case "studi-governing-docs":
          return /* @__PURE__ */ jsx(GoverningDocs, {});
        case "studi-evolution-matrix":
          return /* @__PURE__ */ jsx(EvolutionMatrixPage, {});
        case "valve-cockpit":
          return /* @__PURE__ */ jsx(ValveCockpit, {});
        default:
          return /* @__PURE__ */ jsx(
            NotYetImplemented,
            {
              sectionId: studiSection,
              title: (_b = (_a2 = SECTION_META[studiSection]) == null ? void 0 : _a2.title) != null ? _b : studiSection
            }
          );
      }
    }
    if (openedPlugin === "webhook-subsystem") {
      return /* @__PURE__ */ jsx(WebhookPluginDetail, { onBack: () => setOpenedPlugin(null) });
    }
    if (openedPlugin) {
      return /* @__PURE__ */ jsx(
        NotYetImplemented,
        {
          sectionId: `plugin:${openedPlugin}`,
          title: `Plugin: ${openedPlugin}`
        }
      );
    }
    switch (iveSection) {
      case "ive-overview":
        return /* @__PURE__ */ jsx(IveOverview, { onNavigate: handleSectionChange });
      case "ive-claims":
        return /* @__PURE__ */ jsx(IveClaimsPipeline, {});
      case "ive-plugins":
        return /* @__PURE__ */ jsx(
          PluginRegistry,
          {
            onSelectPlugin: (pid) => setOpenedPlugin(pid),
            webhookStats
          }
        );
      case "ive-webhook":
        return /* @__PURE__ */ jsx(WebhookPluginDetail, {});
      case "ive-evolution-matrix":
        return /* @__PURE__ */ jsx(EvolutionMatrixPage, {});
      case "valve-cockpit":
        return /* @__PURE__ */ jsx(ValveCockpit, {});
      case "ive-help":
        return /* @__PURE__ */ jsx(IveFaqView, {});
      default:
        return /* @__PURE__ */ jsx(
          NotYetImplemented,
          {
            sectionId: iveSection,
            title: (_d = (_c = SECTION_META[iveSection]) == null ? void 0 : _c.title) != null ? _d : iveSection
          }
        );
    }
  }, [workspace, studiSection, iveSection, openedPlugin, webhookStats, handleSectionChange]);
  const meta = (_a = SECTION_META[activeSection]) != null ? _a : {
    title: activeSection,
    abbr: "?",
    breadcrumb: [workspace.toUpperCase(), activeSection]
  };
  const pageTitle = openedPlugin === "webhook-subsystem" ? "Webhook Delivery Subsystem" : openedPlugin ? `Plugin: ${openedPlugin}` : meta.title;
  const pageAbbr = openedPlugin === "webhook-subsystem" ? "WH" : meta.abbr;
  const breadcrumb = openedPlugin === "webhook-subsystem" ? ["IVE", "Plugin Registry", "Webhook Subsystem"] : openedPlugin ? ["IVE", "Plugin Registry", openedPlugin] : meta.breadcrumb;
  return /* @__PURE__ */ jsx(
    AppShell,
    {
      activeSection,
      onSectionChange: handleSectionChange,
      pageTitle,
      pageAbbr,
      breadcrumb,
      statusStrip: meta.statusStrip,
      children: content
    }
  );
}
function IveFaqView() {
  const faqs = [
    {
      q: "What is IVE?",
      a: "IVE is the Integrated Verification Environment \u2014 the engineering face of VVU. It binds every claim to evidence, every evidence item to an independent source, and every authorization decision to a fail-closed bound defined by the Evidence Independence Specification."
    },
    {
      q: "Why is release GO blocked?",
      a: "The engineering release is held in BLOCKED state until the STUDI workspace clears its governance gates. This is by design \u2014 STUDI and IVE are the two halves of a single fail-closed valve. No legal closure \u21D2 no engineering release, period."
    },
    {
      q: "How does the Webhook Subsystem fit in?",
      a: "It is registered as a plugin in the IVE Plugin Registry. Every successful verification can fan out to external systems (ProofBridge, GitHub, Discord) via the webhook delivery queue \u2014 Kafka 12 partitions, per-webhook circuit breaker, 4-attempt retry, 30-day DLQ, at-least-once idempotent delivery."
    },
    {
      q: "What does fail-closed actually mean?",
      a: "EIS Theorem 5: loss of evidence \u21D2 loss of verification \u21D2 loss of authorization \u21D2 breaker trips \u21D2 action blocked. The breaker cannot be reset by retrying \u2014 it requires explicit operator intervention AND re-establishment of the evidence chain."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Help & FAQ" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Short answers to the most common questions about VVU IVE." })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "divide-y divide-border/60 p-0", children: faqs.map((f, i) => /* @__PURE__ */ jsx("div", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsx(HelpCircle, { className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold tracking-tight", children: f.q }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: f.a })
      ] })
    ] }) }, i)) }) })
  ] });
}
function InterestInceptionReview() {
  const [state, setState] = useState(null);
  useEffect(() => {
    setState(loadInterestInception());
  }, []);
  if (!state || !state.completed) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col items-center justify-center gap-3 py-16 text-center", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-8 w-8 text-vvu-studi" }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold tracking-tight", children: "You haven\u2019t answered yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground max-w-md", children: "The Interest Inception modal is the immutable entry point for every VVU user. It should appear automatically on first visit. If you don\u2019t see it, refresh the page." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Interest Inception" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Your immutable curiosity-first entry point. Reset to start over with a new interest." })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Your interest" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium italic", children: [
          "\u201C",
          state.interest,
          "\u201D"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Category" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: state.interestCategory })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Bridging prompt" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-foreground/90", children: state.bridgingPrompt })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono uppercase tracking-wider text-muted-foreground", children: "Implicit Project ID" }),
        /* @__PURE__ */ jsx("p", { className: "font-mono text-sm font-semibold text-vvu-studi", children: state.projectId })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
        "Captured: ",
        state.timestamp
      ] })
    ] }) })
  ] });
}
function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [inception, setInception] = useState(null);
  useEffect(() => {
    setHydrated(true);
    setInception(loadInterestInception());
  }, []);
  if (!hydrated) {
    return null;
  }
  if (!(inception == null ? void 0 : inception.completed)) {
    return /* @__PURE__ */ jsx(WorkspaceProvider, { children: /* @__PURE__ */ jsx(InterestInceptionModal, { onComplete: (state) => setInception(state), children: /* @__PURE__ */ jsx(DashboardInner, {}) }) });
  }
  return /* @__PURE__ */ jsx(WorkspaceProvider, { children: /* @__PURE__ */ jsx(DashboardInner, {}) });
}
export {
  Home as default
};
