"use client";

export function IveFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border/50 ive-glass">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 text-xs md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="ive-text-gold">VVU · IVE v2.0</span>
          <span aria-hidden>·</span>
          <span>HBK Mk-II Hydro-Bayesian Kernel</span>
          <span aria-hidden>·</span>
          <span>zipenc AES-256</span>
          <span aria-hidden>·</span>
          <span>CDE-bound</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AIR runtime healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            12 stale claims
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            1 conjecture blocked
          </span>
          <span className="hidden md:inline">© {year} Venture Vision Ubuntu</span>
        </div>
      </div>
    </footer>
  );
}
