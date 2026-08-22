import { jsx } from "react/jsx-runtime";
import { StudyWorkspace } from "@/components/study/study-workspace";
const metadata = {
  title: "VVU Study Mode \u2014 Dual-Render Pipeline",
  description: "CPU-only sandbox proving the VVU dual-render pipeline: immediate base render + eventual IVE verification overlay across Research, Engineering, and Sports tracks."
};
function StudyPage() {
  return /* @__PURE__ */ jsx("main", { className: "min-h-screen", children: /* @__PURE__ */ jsx(StudyWorkspace, {}) });
}
export {
  StudyPage as default,
  metadata
};
