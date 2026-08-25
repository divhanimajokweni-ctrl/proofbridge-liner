"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  HardHat,
  AlertTriangle,
  Microscope,
  Activity,
  ShieldCheck,
  Cpu,
  Clock,
} from "lucide-react";

const PHOTOS = [
  { src: "/field-evidence-1.jpg", id: "FE-01", caption: "Demolition rubble pile — unsorted material awaiting classification.", tags: ["unclassified", "real-world", "physical-layer"] },
  { src: "/field-evidence-2.jpg", id: "FE-02", caption: "Excavated trench with caution tape — spatial edge case for GIS overlay.", tags: ["spatial-edge", "gis-overlap", "caution-zone"] },
  { src: "/field-evidence-3.jpg", id: "FE-03", caption: "Same trench, alternate angle — evidence-chain consistency check.", tags: ["multi-view", "evidence-chain", "calibration"] },
  { src: "/field-evidence-4.jpg", id: "FE-04", caption: "Stylized shadow on pavement — photographic provenance / capture-epoch test.", tags: ["provenance", "capture-epoch", "optical"] },
];

const VISION_PASS = [
  { icon: Camera, title: "01 · Physical-Layer Reality Check", body: "These are not rendered mockups. They are phone-camera captures of an active South African construction/demolition site — unsorted rubble, hand-dug trenches, caution tape, and personnel in PPE. This is exactly the kind of physical-world signal that a lab-published architecture figure cannot model.", accent: "ive-text-gold" },
  { icon: HardHat, title: "02 · Why HBK Mk-II Matters Here", body: "A traditional MCMC-based Bayesian model would choke on this kind of sparse, noisy, asynchronous field evidence. HBK Mk-II's supervised random Fourier basis was specifically designed to handle thousands of such exposures almost linearly, with 85–96% computation-time reduction versus MCMC. The kernel does not require clean data; it requires honest data.", accent: "ive-text-emerald" },
  { icon: AlertTriangle, title: "03 · The Trust-Inflation Risk", body: "An untrained observer might trust the rubble pile as 'obvious evidence of demolition progress.' But without a calibrated capture epoch, sensor ID, and timestamp spine, the photo could be from any site. The Epistemic Layer would mark this as CONJECTURE until paired with capture_epoch, sensor_timestamp, and a verified attestation chain.", accent: "ive-text-rose" },
  { icon: Microscope, title: "04 · The Substrate-Agnostic Test", body: "These photos arrived via WhatsApp — a lossy, compressed, metadata-stripped channel. To ingest them as evidence, the substrate-agnostic router would need to classify each as 'light-change event', route through the Silicon substrate for CV pre-processing, then hand off to ProofBridge for hashing + MMR-leaf insertion.", accent: "ive-text-jade" },
  { icon: Activity, title: "05 · Evidence Decay On Display", body: "FE-02 and FE-03 are the same trench from slightly different angles — a natural evidence-chain consistency check. The IVE Evidence Decay Tracker would flag both as STALE within days if no re-verification arrived. The photos are not wrong; they are simply not freshly attested.", accent: "ive-text-gold" },
  { icon: ShieldCheck, title: "06 · Governance Cannot Manufacture Validity", body: "Per the constitutional principle: governance may authorize action; governance cannot make invalid evidence valid. Even if a regulator asked us to treat these four WhatsApp screenshots as certified demolition evidence, the IVE invariant engine would block the release.", accent: "ive-text-emerald" },
];

const PROVENANCE_FIELDS = [
  { k: "event_id", v: "FE-01..04" },
  { k: "sensor_id", v: "WhatsApp / phone camera" },
  { k: "sensor_timestamp", v: "2026-08-24 19:31:35 +0200" },
  { k: "capture_epoch", v: "uncalibrated — UNDEFINED" },
  { k: "frame_sequence", v: "1..4" },
  { k: "optical_sequence", v: "lossy JPEG — compressed" },
  { k: "receiver_timestamp", v: "2026-08-24 20:00:00 +0200" },
  { k: "router_timestamp", v: "pending — not routed" },
  { k: "proof_leaf", v: "not yet hashed" },
  { k: "attestation_reference", v: "not yet attested" },
  { k: "calibration_epoch", v: "UNDEFINED — conjecture-class" },
];

export function FieldTab() {
  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-border/60 ive-glass-gold">
        <div className="relative p-6 md:p-8">
          <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">
            Field Evidence · HBK Mk-II Justification
          </Badge>
          <h2 className="mt-3 font-mono text-2xl font-semibold leading-tight md:text-3xl">
            Why HBK Mk-II exists:{" "}
            <span className="ive-text-gold">because the field looks like this.</span>
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Four photographs taken at an active construction site, captured
            informally on a phone camera and shared via WhatsApp. They are
            not lab data. They are the exact class of sparse, noisy,
            uncalibrated, real-world evidence that motivated the Hydro-Bayesian
            Kernel Mk-II upgrade — and that the IVE governance model exists to
            keep honest.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {PHOTOS.map((p) => (
          <Card key={p.id} className="overflow-hidden border-border/60 ive-glass">
            <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
              <img src={p.src} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute left-2 top-2 rounded bg-background/80 px-2 py-1 font-mono text-[10px] uppercase tracking-widest ive-text-gold backdrop-blur">
                {p.id}
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{p.caption}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span key={t} className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Camera className="h-4 w-4 ive-text-gold" />
            Vision Pass · Why This Justifies HBK Mk-II
          </CardTitle>
          <CardDescription className="text-xs">
            Six observations tying the field photos directly to the IVE / HBK Mk-II architecture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {VISION_PASS.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${v.accent}`} />
                    <h3 className="font-mono text-[11px] uppercase tracking-widest">{v.title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="ive-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Clock className="h-4 w-4 ive-text-rose" />
            Provenance Spine · Current State of These Photos
          </CardTitle>
          <CardDescription className="text-xs">
            The 11-field provenance thread, applied to these four photos as they exist right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PROVENANCE_FIELDS.map((f) => {
              const isUndefined = f.v.includes("UNDEFINED") || f.v.includes("not yet") || f.v.includes("pending") || f.v.includes("uncalibrated") || f.v.includes("conjecture");
              return (
                <div key={f.k} className={`rounded-md border p-2.5 ${isUndefined ? "border-[oklch(0.65_0.21_22/40%)] bg-rose-500/5" : "border-border/40 bg-secondary/30"}`}>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{f.k}</div>
                  <div className={`mt-0.5 font-mono text-xs ${isUndefined ? "ive-text-rose" : "ive-text-gold"}`}>{f.v}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="ive-glass-gold">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Cpu className="mt-0.5 h-5 w-5 ive-text-gold" />
            <div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-widest ive-text-gold">The Bounded Claim</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                These four photos do not prove HBK Mk-II works. They prove{" "}
                <span className="ive-text-gold">why HBK Mk-II is necessary</span>.
                They are field evidence of the kind of uncalibrated,
                informally-captured, sparse-asynchronous physical-world signal
                that the kernel was designed to ingest — and that the IVE
                governance model was designed to keep honest. The kernel's
                85–96% speedup over MCMC is demonstrated elsewhere (HBK Mk-II
                tab, performance scaling table); the photos here are the
                motivation, not the proof.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">Provable elsewhere</Badge>
                <Badge variant="outline" className="border-[oklch(0.72_0.17_162/40%)] ive-text-emerald">Honest motivation</Badge>
                <Badge variant="outline" className="border-[oklch(0.65_0.21_22/40%)] ive-text-rose">Conjecture-class until attested</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
