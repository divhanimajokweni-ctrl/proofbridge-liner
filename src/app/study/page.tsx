import { StudyWorkspace } from "@/components/study/study-workspace";

export const metadata = {
  title: "VVU Study Mode — Dual-Render Pipeline",
  description:
    "CPU-only sandbox proving the VVU dual-render pipeline: immediate base render + eventual IVE verification overlay across Research, Engineering, and Sports tracks.",
};

export default function StudyPage() {
  return (
    <main className="min-h-screen">
      <StudyWorkspace />
    </main>
  );
}
