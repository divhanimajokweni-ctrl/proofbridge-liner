import { useState } from "react";
import { FileJson, FileSpreadsheet } from "lucide-react";
import type { Pipe } from "../lib/engine";
import { exportCSV, exportJSONReport } from "../lib/export";

export interface ExportBarProps {
  pipes: Pipe[];
  cycle: number;
}

export default function ExportBar({ pipes, cycle }: ExportBarProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const onCSV = () => {
    try {
      exportCSV(pipes);
      flash("CSV downloaded — open in your spreadsheet");
    } catch {
      flash("Couldn't build the CSV — try again");
    }
  };

  const onJSON = async () => {
    try {
      await exportJSONReport(pipes, cycle);
      flash("JSON report + SHA-256 downloaded");
    } catch {
      flash("Couldn't build the report — try again");
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[15] sm:bottom-4 sm:left-4">
      <div className="pointer-events-auto flex flex-col gap-1.5 rounded-xl border border-edge bg-surface/85 px-3 py-2.5 shadow-xl backdrop-blur-md">
        <div className="hidden items-center gap-2 sm:flex">
          <FileJson className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Export Results
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCSV}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            onClick={onJSON}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
            JSON + SHA
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`text-[11px] leading-tight transition-opacity duration-200 ${
            notice ? "text-verified opacity-100" : "opacity-0"
          }`}
        >
          {notice ?? "…"}
        </p>
        <p className="text-[9px] leading-none text-muted/60">Map © OpenFreeMap · MapLibre GL</p>
      </div>
    </div>
  );
}
