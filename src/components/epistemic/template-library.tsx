"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library,
  FileCode2,
  Plus,
  Zap,
  Droplets,
  HeartPulse,
  Truck,
  Car,
  Banknote,
  Network,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Search,
  Star,
  Rocket,
  Filter,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { validateEpd } from "@/lib/epd";

interface Template {
  id: string;
  name: string;
  domain: string;
  icon: typeof Zap;
  description: string;
  invariants: number;
  shard: boolean;
  zk: boolean;
  shadow: boolean;
  source: string;
  featured?: boolean;
  category?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Filter },
  { id: "iot", label: "IoT", icon: Network },
  { id: "datacenter", label: "Datacenter", icon: Droplets },
  { id: "healthcare", label: "Healthcare", icon: HeartPulse },
  { id: "energy", label: "Energy", icon: Banknote },
];

/** Domain → color mapping */
const DOMAIN_COLORS: Record<string, string> = {
  iot: "border-teal-500/30 bg-teal-500/10 text-teal-400",
  datacenter: "border-verified/30 bg-verified/10 text-verified",
  healthcare: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  energy: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  logistics: "border-repairing/30 bg-repairing/10 text-repairing",
  automotive: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400",
};

const DOMAIN_ICON_COLORS: Record<string, string> = {
  iot: "bg-teal-500/10 border-teal-500/20 text-teal-400 group-hover:bg-teal-500/20",
  datacenter: "bg-verified/10 border-verified/20 text-verified group-hover:bg-verified/20",
  healthcare: "bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20",
  energy: "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20",
  logistics: "bg-repairing/10 border-repairing/20 text-repairing group-hover:bg-repairing/20",
  automotive: "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400 group-hover:bg-fuchsia-500/20",
};

const TEMPLATES: Template[] = [
  {
    id: "iot-fleet",
    name: "IoT Fleet Telemetry",
    domain: "iot",
    icon: Network,
    description: "Sensor fleet with bandwidth quotas, heartbeat liveness, and monotonic sequence guards.",
    invariants: 4,
    shard: true,
    zk: false,
    shadow: true,
    featured: true,
    category: "iot",
    source: `# IoT Fleet — telemetry liveness + bandwidth invariants
policy "iot_fleet_telemetry" {
  description "Sensor fleet telemetry integrity and liveness"
  domain "iot"
  version "1.0.0"

  shard by region {
    key "geo_zone"
    strategy locality_preserving
    count 4
    replication 2
  }

  invariant "heartbeat_liveness" "Heartbeat must arrive within 60s window" {
    predicate heartbeat_age <= 60
    severity critical
  }

  invariant "sequence_monotonic" "Sequence numbers must never decrease" {
    predicate sequence >= prev_sequence
    severity high
  }

  invariant "bandwidth_quota" "Per-device bandwidth must stay under quota" {
    predicate bandwidth_mbps <= 10
    severity high
  }

  soft invariant "battery_floor" "Battery should stay above 15%" {
    predicate battery_pct >= 15
    severity medium
  }

  expect merge {
    preserves max(sequence)
    locality_preserving true
  }

  on_violation {
    strategy self_repair
    objective least_divergent
    max_iters 100
  }

  ancestry {
    proof mmr
    zk false
    gossip p2p
    anchor rekor
  }

  shadowbridge {
    enabled true
    takeover_latency_ms 300
    whatif_branching true
    replay true
  }

  export to wasm
}
`,
  },
  {
    id: "datacenter-cooling",
    name: "Datacenter Cooling",
    domain: "datacenter",
    icon: Droplets,
    description: "Rack temperature bounds, coolant flow conservation, and CRAC failover safety.",
    invariants: 5,
    shard: true,
    zk: false,
    shadow: true,
    featured: true,
    category: "datacenter",
    source: `# Datacenter cooling — thermal + flow conservation invariants
policy "datacenter_cooling_safety" {
  description "Thermal envelope and coolant flow conservation for datacenter CRAC"
  domain "datacenter"
  version "1.0.0"

  shard by subsystem {
    key "rack_row"
    strategy subsystem
    count 6
    replication 2
  }

  invariant "rack_temp_bounds" "Rack inlet temperature must stay within ASHRAE bounds" {
    predicate rack_temp in [18, 27]
    severity critical
  }

  invariant "flow_conservation" "Coolant flow in must equal flow out plus leakage" {
    predicate sum(flow_in) >= sum(flow_out) - leakage_allowance
    severity critical
  }

  invariant "crac_redundancy" "At least N+1 CRAC units must be online" {
    predicate online_crac_count >= 2
    severity high
  }

  invariant "humidity_range" "Relative humidity must stay within bounds" {
    predicate humidity in [40, 60]
    severity high
  }

  soft invariant "pue_target" "PUE should stay below 1.4" {
    predicate pue <= 1.4
    severity low
  }

  expect merge {
    preserves min(rack_temp)
    preserves min(online_crac_count)
    locality_preserving true
  }

  on_violation {
    strategy self_repair
    objective min_energy
    max_iters 80
    notify "facilities@epistemic.io"
  }

  ancestry {
    proof mmr
    zk false
    gossip mesh
    anchor rekor
  }

  shadowbridge {
    enabled true
    takeover_latency_ms 200
    whatif_branching true
    replay true
    authoritative true
  }

  export to wasm
  export to tla
}
`,
  },
  {
    id: "patient-monitoring",
    name: "Patient Monitoring",
    domain: "healthcare",
    icon: HeartPulse,
    description: "Vital sign bounds, alarm escalation, and privacy-preserving census reconciliation.",
    invariants: 4,
    shard: true,
    zk: true,
    shadow: false,
    featured: false,
    category: "healthcare",
    source: `# Patient monitoring — vital-sign safety + ZK census reconciliation
policy "patient_monitoring_safety" {
  description "Vital sign bounds and privacy-preserving census reconciliation"
  domain "healthcare"
  version "1.0.0"

  shard by facility {
    key "ward_id"
    strategy hash
    count 5
    replication 2
  }

  invariant "heart_rate_bounds" "Heart rate must stay within physiological bounds" {
    predicate heart_rate in [40, 180]
    severity critical
  }

  invariant "spo2_floor" "SpO2 must stay above 90%" {
    predicate spo2 >= 90
    severity critical
  }

  invariant "alarm_escalation" "Critical alarms must be acknowledged within 5 min" {
    predicate alarm_ack_age <= 300
    severity high
  }

  soft invariant "staff_ratio" "Nurse-to-patient ratio should stay above 1:4" {
    predicate nurse_count * 4 >= patient_count
    severity medium
  }

  expect merge {
    preserves max(alarm_ack_age)
    locality_preserving true
  }

  on_violation {
    strategy escalate
    objective max_consistency
    notify "charge-nurse@epistemic.io"
  }

  ancestry {
    proof mmr
    zk true
    gossip mesh
    anchor transparency_log
  }

  shadowbridge {
    enabled false
  }

  export to wasm
}
`,
  },
  {
    id: "energy-market",
    name: "Energy Market Settlement",
    domain: "energy",
    icon: Banknote,
    description: "Bid/ask conservation, settlement finality, and ZK-anchored audit trail.",
    invariants: 4,
    shard: true,
    zk: true,
    shadow: false,
    featured: false,
    category: "energy",
    source: `# Energy market — settlement conservation + ZK audit trail
policy "energy_market_settlement" {
  description "Bid/ask conservation and settlement finality for energy trading"
  domain "energy"
  version "1.0.0"

  shard by region {
    key "market_zone"
    strategy locality_preserving
    count 3
    replication 3
  }

  invariant "energy_conservation" "Cleared energy must equal demand" {
    predicate cleared_energy == demand
    severity critical
  }

  invariant "settlement_finality" "Settlements must be irreversible after finality window" {
    predicate settlement_age >= finality_window
    severity high
  }

  invariant "price_bounds" "Clearing price must stay within circuit breaker bounds" {
    predicate clearing_price in [price_floor, price_ceiling]
    severity critical
  }

  soft invariant "bid_volume_cap" "Single participant volume should stay under cap" {
    predicate max(participant_volume) <= volume_cap
    severity medium
  }

  expect merge {
    preserves sum(cleared_energy)
    preserves max(clearing_price)
    locality_preserving true
    max_divergence 0.0
  }

  on_violation {
    strategy reject
    objective max_consistency
    notify "market-ops@epistemic.io"
  }

  ancestry {
    proof mmr
    zk true
    gossip mesh
    anchor blockchain
  }

  shadowbridge {
    enabled false
  }

  export to wasm
  export to rust
}
`,
  },
];

export function TemplateLibrarySection({ onCreate }: { onCreate?: (source: string, filename: string) => void }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Template | null>(null);
  const [editedSource, setEditedSource] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [validation, setValidation] = useState<{ ok: boolean; invCount: number; errors: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [deploying, setDeploying] = useState(false);

  const openTemplate = (t: Template) => {
    setSelected(t);
    setEditedSource(t.source);
    const m = t.source.match(/policy "([^"]+)"/);
    setPolicyName(m ? m[1] : t.name);
    setValidation(null);
  };

  const validate = () => {
    const result = validateEpd(editedSource);
    setValidation({
      ok: result.ok,
      invCount: result.invariantCount,
      errors: result.diagnostics.filter((d) => d.level === "error").length,
    });
    if (result.ok) {
      toast({ title: "Template valid", description: `${result.invariantCount} invariants compiled` });
    } else {
      toast({ title: "Validation failed", description: `${result.diagnostics.filter((d) => d.level === "error").length} error(s)`, variant: "destructive" });
    }
  };

  const create = async () => {
    const result = validateEpd(editedSource);
    if (!result.ok) {
      toast({ title: "Cannot create — fix errors first", variant: "destructive" });
      return;
    }
    setDeploying(true);
    const filename = `${policyName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.epd`;
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: editedSource, filename }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: "Create failed", description: d.error ?? "invalid", variant: "destructive" });
      } else {
        toast({ title: "Policy created", description: `${d.policy.name} saved & compiled` });
        setSelected(null);
        onCreate?.(editedSource, filename);
      }
    } catch (e) {
      toast({ title: "Create failed", description: String(e), variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(editedSource);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      toast({ title: "Source copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      const matchesSearch = !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const totalInvariants = TEMPLATES.reduce((sum, t) => sum + t.invariants, 0);
  const domains = new Set(TEMPLATES.map((t) => t.domain)).size;

  return (
    <section className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-verified/0 via-verified/50 to-verified/0" />
          <div className="bg-grid absolute inset-0 opacity-20" />
          <div className="relative flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-verified/30 bg-verified/10 shrink-0">
              <Library className="h-5 w-5 text-verified" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold flex items-center gap-2">
                Policy Template Library
                <Badge variant="outline" className="border-verified/30 bg-verified/10 text-verified text-[9px] font-mono">
                  {TEMPLATES.length} templates
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start from a domain template — edit, validate, and compile a new `.epd` policy in one click.
              </p>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-verified">{totalInvariants}</div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">invariants</div>
              </div>
              <Separator orientation="vertical" className="h-8 bg-border/40" />
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-foreground">{domains}</div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">domains</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search + Category filter */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap items-center gap-2"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates…"
            className="h-8 pl-8 text-xs bg-card/60 border-border/60"
          />
        </div>

        {/* Category filter buttons */}
        <div className="flex items-center gap-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-verified/40 bg-verified/10 text-verified"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{cat.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((t, i) => {
            const Icon = t.icon;
            const domainColor = DOMAIN_COLORS[t.domain] ?? "border-border/60";
            const iconBgColor = DOMAIN_ICON_COLORS[t.domain] ?? "bg-verified/10 border-verified/20 text-verified group-hover:bg-verified/20";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                layout
              >
                <Card
                  className="bg-card/60 backdrop-blur border-border/60 p-4 relative overflow-hidden hover:border-verified/40 transition-all duration-200 cursor-pointer group"
                  onClick={() => openTemplate(t)}
                >
                  {/* Gradient border top accent */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-[2px]",
                    t.domain === "iot" ? "bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0" :
                    t.domain === "datacenter" ? "bg-gradient-to-r from-verified/0 via-verified/50 to-verified/0" :
                    t.domain === "healthcare" ? "bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" :
                    t.domain === "energy" ? "bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" :
                    "bg-gradient-to-r from-verified/0 via-verified/30 to-verified/0",
                  )} />
                  <div className="bg-grid-fine absolute inset-0 opacity-20" />
                  <div className="relative">
                    <div className="flex items-start gap-3">
                      <div className={cn("h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors", iconBgColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold truncate">{t.name}</h3>
                          {t.featured && (
                            <Badge className="bg-verified/15 border border-verified/30 text-verified text-[8px] gap-0.5 px-1.5 py-0">
                              <Star className="h-2 w-2" /> featured
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] mt-0.5", domainColor)}>
                          {t.domain}
                        </Badge>
                      </div>
                      <motion.div
                        whileHover={{ x: 3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </motion.div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed line-clamp-2">{t.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] border-border/60">
                        <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> {t.invariants} inv
                      </Badge>
                      {t.shard && (
                        <Badge variant="outline" className="text-[9px] border-border/60">sharded</Badge>
                      )}
                      {t.zk && (
                        <Badge variant="outline" className="text-[9px] border-verified/30 bg-verified/10 text-verified">ZK</Badge>
                      )}
                      {t.shadow && (
                        <Badge variant="outline" className="text-[9px] border-repairing/30 bg-repairing/10 text-repairing">shadow</Badge>
                      )}
                    </div>

                    {/* Hover preview line */}
                    <div className="mt-2 h-0 group-hover:h-6 overflow-hidden transition-all duration-200">
                      <p className="text-[10px] text-muted-foreground/60 font-mono truncate">
                        {t.source.split("\n").find((l) => l.includes("invariant"))?.trim() ?? "Click to open editor"}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-card/60 border-dashed border-border/60 p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No templates match your search.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Try adjusting the category filter or search query.
          </p>
        </Card>
      )}

      {/* Template editor dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && (() => {
                const Icon = selected.icon;
                return <Icon className="h-4 w-4 text-verified" />;
              })()}
              {selected?.name ?? "Template"}
              {selected?.featured && (
                <Badge className="bg-verified/15 border border-verified/30 text-verified text-[8px] gap-0.5 px-1.5 py-0">
                  <Star className="h-2 w-2" /> featured
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selected?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-1">
            <span className="text-[11px] text-muted-foreground shrink-0">Policy name:</span>
            <Input
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded-md border border-border/60 bg-background/40">
            <Textarea
              value={editedSource}
              onChange={(e) => {
                setEditedSource(e.target.value);
                setValidation(null);
              }}
              spellCheck={false}
              className="codeblock h-[320px] w-full resize-none border-0 rounded-none bg-transparent focus-visible:ring-0 text-[11px]"
            />
          </div>
          {validation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs",
                validation.ok
                  ? "border-verified/30 bg-verified/5 text-verified"
                  : "border-violating/30 bg-violating/5 text-violating",
              )}
            >
              {validation.ok
                ? `✓ Valid — ${validation.invCount} invariants compiled`
                : `✗ ${validation.errors} error(s) — fix the source above`}
            </motion.div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-verified" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="outline" onClick={validate}>
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Validate
            </Button>
            <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Button size="sm" className="bg-verified/90 hover:bg-verified text-primary-foreground" onClick={create} disabled={deploying}>
                {deploying ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    </motion.div>
                    Deploying…
                  </>
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5 mr-1.5" /> Create policy
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
