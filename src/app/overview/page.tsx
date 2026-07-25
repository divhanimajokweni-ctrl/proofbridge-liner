import { redirect } from "next/navigation";


export const dynamic = "force-static";
export const revalidate = 5;

async function getLifecycle(): Promise<any> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const res = await fetch(`${base}/api/app-state`, { next: { revalidate: 5 } });
    if (!res.ok) throw new Error("Navigation state unavailable");
    return res.json();
  } catch {
    return { state: "REHEARSAL", runtimeHealthy: null, evidenceReady: null, deploymentReady: null, productionPublished: null, currentHour: null };
  }
}

export default async function OverviewPage() {
  const data = await getLifecycle();
  const state = data?.state ?? "REHEARSAL";

  if (state === "RUNNING" || state === "VERIFYING") {
    redirect("/validation");
  }

  if (state === "COMPLETE" || state === "ARCHIVED") {
    redirect("/evidence");
  }

  return <OverviewTiles data={data} />;
}

function OverviewTiles({ data }: { data: any }) {
  const state = data?.state ?? "REHEARSAL";
  const tiles = [
    {
      title: "Validation",
      status: stateLabel(state),
      meta: currentHourMeta(data),
      href: state === "REHEARSAL" ? "/rehearsal" : "/validation",
      accent: "verified",
    },
    {
      title: "Evidence",
      status: data?.evidenceReady === true ? "Ready" : data?.evidenceReady === false ? "Incomplete" : "Pending",
      meta: data?.evidenceReady === true ? `${data?.currentHour ?? 0} Bundles` : "No evidence bundles yet",
      href: "/evidence",
      accent: "verified",
    },
    {
      title: "Runtime",
      status: data?.runtimeHealthy === true ? "Healthy" : data?.runtimeHealthy === false ? "Degraded" : "Unknown",
      meta: "NATS · Prometheus · Storage",
      href: "/runtime",
      accent: "primary",
    },
    {
      title: "Deployment",
      status: data?.productionPublished === true ? "Published" : data?.deploymentReady === true ? "Build Ready" : "Pending",
      meta: `State: ${state}`,
      href: "/deployments",
      accent: state === "COMPLETE" || state === "ARCHIVED" ? "verified" : "muted",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-5">
        <div className="h-9 w-9 rounded-lg bg-verified/15 border border-verified/30 flex items-center justify-center text-verified font-bold">VVU</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-xs text-muted-foreground font-mono">MISSION CONTROL · SINGLE SOURCE OF TRUTH</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {tiles.map((tile) => (
          <a key={tile.title} href={tile.href} className="group block rounded-lg border border-border/60 bg-muted/20 p-5 transition-colors hover:border-verified/40">
            <div className="text-xs text-muted-foreground">{tile.title}</div>
            <div className="mt-3 text-lg font-semibold text-foreground">{tile.status}</div>
            <div className="mt-1 text-xs text-muted-foreground">{tile.meta}</div>
            <div className="mt-3 text-[10px] font-mono text-verified/80 group-hover:text-verified">Open →</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function stateLabel(state: string) {
  switch (state) {
    case "REHEARSAL":
      return "Rehearsal";
    case "RUNNING":
      return "RUNNING";
    case "VERIFYING":
      return "Verifying";
    case "COMPLETE":
      return "Complete";
    case "FAILED":
      return "Failed";
    case "ARCHIVED":
      return "Archived";
    default:
      return state;
  }
}

function currentHourMeta(data: any) {
  const hour = data?.currentHour;
  if (typeof hour === "number") return `Hour ${hour} / 72`;
  if (data?.state === "REHEARSAL") return "Gate A";
  if (data?.state === "COMPLETE") return "Complete";
  return "Not started";
}
