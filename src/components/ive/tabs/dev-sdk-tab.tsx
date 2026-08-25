"use client";

import { useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Package,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ModEntry {
  id: string;
  title: string;
  author: string;
  desc: string;
  price: string;
  category: string;
  version: string;
  installed: boolean;
  createdAt: string;
}

interface UploadResult {
  success?: boolean;
  mod?: ModEntry;
  totalMods?: number;
  scriptSaved?: boolean;
  error?: string;
}

/**
 * Dev SDK tab — web-based form for indie developers to upload custom .vvu
 * JSON manifests and optional logic scripts into the store registry.
 *
 * Two upload paths:
 *  1. Structured form → POST /api/store/registry (builds the manifest server-side)
 *  2. Manifest file upload → POST /api/store/upload (parses the .vvu file directly)
 *
 * Both paths end up in the same /data/store-registry.json file.
 */
export function DevSdkTab() {
  const [form, setForm] = useState({
    modId: "",
    title: "",
    author: "",
    desc: "",
    price: "FREE",
    category: "WEAPONS",
    version: "1.0.0",
    particleColor: "#bd00ff",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registry, setRegistry] = useState<ModEntry[] | null>(null);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshRegistry = useCallback(async () => {
    setRegistryLoading(true);
    try {
      const res = await fetch("/api/store/registry");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRegistry(data.mods || []);
    } catch (err) {
      setError(`Failed to fetch registry: ${(err as Error).message}`);
    } finally {
      setRegistryLoading(false);
    }
  }, []);

  // ─── Path 1: structured form submit → POST /api/store/registry ───
  const submitForm = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // Validate required fields
      if (!form.modId || !form.title || !form.author) {
        throw new Error("modId, title, and author are required");
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(form.modId)) {
        throw new Error("modId must be alphanumeric (dots, hyphens, underscores allowed)");
      }

      const payload = {
        id: form.modId,
        title: form.title,
        author: form.author,
        desc: form.desc,
        price: form.price,
        category: form.category,
        version: form.version,
        assets: { particleColor: form.particleColor },
      };

      const res = await fetch("/api/store/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      setForm({
        modId: "",
        title: "",
        author: "",
        desc: "",
        price: "FREE",
        category: "WEAPONS",
        version: "1.0.0",
        particleColor: "#bd00ff",
      });
      refreshRegistry();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [form, refreshRegistry]);

  // ─── Path 2: manifest file upload → POST /api/store/upload ───
  const submitFileUpload = useCallback(async () => {
    if (!manifestFile) {
      setError("Please select a .vvu manifest file first");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("manifest", manifestFile);
      if (scriptFile) {
        formData.append("script", scriptFile);
      }

      const res = await fetch("/api/store/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      setManifestFile(null);
      setScriptFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refreshRegistry();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [manifestFile, scriptFile, refreshRegistry]);

  return (
    <div className="space-y-4">
      {/* Intro card */}
      <Card className="ive-glass-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <Package className="h-4 w-4 ive-text-gold" />
            Dev SDK · Mod Upload Console
          </CardTitle>
          <CardDescription className="text-xs">
            Web-based form for indie developers to upload custom{" "}
            <code className="font-mono">.vvu</code> JSON manifests and optional
            logic scripts into the VVU Community Store registry. Two upload
            paths: structured form (builds the manifest server-side) or direct
            <code className="font-mono"> .vvu</code> file upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Store Registry API", value: "GET /api/store/registry", tone: "ive-text-emerald" },
              { label: "Mod Submit API", value: "POST /api/store/registry", tone: "ive-text-gold" },
              { label: "File Upload API", value: "POST /api/store/upload", tone: "ive-text-jade" },
              { label: "Storage", value: "data/store-registry.json", tone: "ive-text-rose" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-border/40 bg-secondary/30 p-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </div>
                <div className={`mt-1 font-mono text-xs ${c.tone}`}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[oklch(0.82_0.16_75/40%)] ive-text-gold">
              Opt-in loadouts
            </Badge>
            <Badge variant="outline" className="border-[oklch(0.72_0.17_162/40%)] ive-text-emerald">
              Sandboxed JSON rulesets
            </Badge>
            <Badge variant="outline" className="border-border">
              Creator monetization ready
            </Badge>
            <Badge variant="outline" className="border-border">
              Dynamic multiplayer mod packs
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Path 1: structured form */}
        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <FileJson className="h-4 w-4 ive-text-gold" />
              Path 1 · Structured Form
            </CardTitle>
            <CardDescription className="text-xs">
              Build the manifest server-side. Best for quick uploads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modId" className="font-mono text-[10px] uppercase tracking-widest">
                  modId *
                </Label>
                <Input
                  id="modId"
                  value={form.modId}
                  onChange={(e) => setForm({ ...form, modId: e.target.value })}
                  placeholder="community.dev.gravity_grenade"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="title" className="font-mono text-[10px] uppercase tracking-widest">
                  title *
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Quantum Singularity Grenade"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="author" className="font-mono text-[10px] uppercase tracking-widest">
                  author *
                </Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="IndieDev_42"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="category" className="font-mono text-[10px] uppercase tracking-widest">
                  category
                </Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="WEAPONS / COSMETICS / ENEMIES"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="desc" className="font-mono text-[10px] uppercase tracking-widest">
                description
              </Label>
              <Textarea
                id="desc"
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                placeholder="Drops high-damage gravity implosion spheres."
                className="min-h-[60px] resize-none font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="price" className="font-mono text-[10px] uppercase tracking-widest">
                  price
                </Label>
                <Input
                  id="price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="FREE / 50 MATTER"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="version" className="font-mono text-[10px] uppercase tracking-widest">
                  version
                </Label>
                <Input
                  id="version"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label htmlFor="particleColor" className="font-mono text-[10px] uppercase tracking-widest">
                  particle color
                </Label>
                <Input
                  id="particleColor"
                  type="color"
                  value={form.particleColor}
                  onChange={(e) => setForm({ ...form, particleColor: e.target.value })}
                  className="h-9 p-1"
                />
              </div>
            </div>
            <Button
              onClick={submitForm}
              disabled={busy}
              className="w-full gap-2 font-mono text-xs uppercase tracking-widest"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Submit to Registry
            </Button>
          </CardContent>
        </Card>

        {/* Path 2: file upload */}
        <Card className="ive-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Upload className="h-4 w-4 ive-text-emerald" />
              Path 2 · .vvu File Upload
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a complete manifest + optional logic script. Best for
              pre-built mod packages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="manifestFile" className="font-mono text-[10px] uppercase tracking-widest">
                manifest file (.vvu / .json) *
              </Label>
              <Input
                id="manifestFile"
                type="file"
                accept=".vvu,.json,application/json"
                ref={fileInputRef}
                onChange={(e) => setManifestFile(e.target.files?.[0] ?? null)}
                className="font-mono text-xs"
              />
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Expected fields: modId, title, author, category (optional: desc, price, version, assets)
              </p>
            </div>
            <div>
              <Label htmlFor="scriptFile" className="font-mono text-[10px] uppercase tracking-widest">
                logic script (optional)
              </Label>
              <Input
                id="scriptFile"
                type="file"
                accept=".json,.js,.txt"
                onChange={(e) => setScriptFile(e.target.files?.[0] ?? null)}
                className="font-mono text-xs"
              />
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Saved to <code className="font-mono">data/store-scripts/</code> as{" "}
                <code className="font-mono">{`{modId}.{ext}`}</code>
              </p>
            </div>
            <Button
              onClick={submitFileUpload}
              disabled={busy || !manifestFile}
              className="w-full gap-2 font-mono text-xs uppercase tracking-widest"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload .vvu Package
            </Button>

            {/* Manifest schema example */}
            <div className="rounded-md border border-border/40 bg-black/30 p-3">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                manifest example
              </div>
              <pre className="overflow-x-auto font-mono text-[10px] leading-relaxed text-muted-foreground">
{`{
  "modId": "community.dev.gravity_grenade",
  "title": "Quantum Singularity Grenade",
  "author": "IndieDev_42",
  "version": "1.0.0",
  "price": 0.00,
  "category": "WEAPONS",
  "entryScript": "grenade_logic.json",
  "assets": {
    "icon": "icon_singularity.png",
    "particleColor": "#bd00ff"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result + error display */}
      {(result || error) && (
        <Card className="ive-glass">
          <CardContent className="p-4">
            {error && (
              <div className="flex items-start gap-2 text-sm text-rose-500">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-rose-500">
                    Upload Failed
                  </div>
                  <div className="mt-1 text-xs">{error}</div>
                </div>
              </div>
            )}
            {result && result.success && (
              <div className="flex items-start gap-2 text-sm text-emerald-500">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <div className="flex-1">
                  <div className="font-mono text-xs uppercase tracking-widest text-emerald-500">
                    Upload Successful
                  </div>
                  {result.mod && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <code className="font-mono">{result.mod.id}</code> by{" "}
                      <code className="font-mono">{result.mod.author}</code> —{" "}
                      {result.totalMods} total mods in registry
                      {result.scriptSaved && " (script saved)"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live registry view */}
      <Card className="ive-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
              <Package className="h-4 w-4 ive-text-gold" />
              Live Registry · data/store-registry.json
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRegistry}
              disabled={registryLoading}
              className="gap-1.5 font-mono text-[10px] uppercase tracking-widest"
            >
              <RefreshCw className={`h-3 w-3 ${registryLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <CardDescription className="text-xs">
            Current contents of the store registry. Fetches from{" "}
            <code className="font-mono">/api/store/registry</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registry === null && !registryLoading && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Click "Refresh" to load the registry.
            </div>
          )}
          {registryLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching…
            </div>
          )}
          {registry !== null && registry.length === 0 && !registryLoading && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Registry is empty. Upload a mod via Path 1 or Path 2 above.
            </div>
          )}
          {registry !== null && registry.length > 0 && (
            <div className="ive-scrollbar max-h-80 space-y-2 overflow-y-auto pr-1">
              {registry.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-md border border-border/40 bg-secondary/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {mod.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[9px] uppercase tracking-widest"
                      >
                        {mod.category}
                      </Badge>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {mod.price}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    <code className="text-foreground">{mod.id}</code> · by{" "}
                    {mod.author} · v{mod.version}
                  </div>
                  {mod.desc && (
                    <p className="mt-1 text-xs text-muted-foreground">{mod.desc}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
