"use client";

export default function AdministrationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center text-verified font-bold">VVU</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Administration</h1>
          <p className="text-xs text-muted-foreground font-mono">SETTINGS · SECRETS · GITOPS · ARGOCD</p>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
        <p className="text-xs text-muted-foreground">This page is never shown to observers. It provides operator configuration for GitOps, cluster settings, and feature flags.</p>
      </div>
    </div>
  );
}
