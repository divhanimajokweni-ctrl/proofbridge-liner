import dynamic from "next/dynamic";

export const GlobalSearch = dynamic(
  () => import("./global-search").then((m) => m.GlobalSearch),
  { ssr: false }
);
export const KeyboardShortcutsPanel = dynamic(
  () => import("./keyboard-shortcuts").then((m) => m.KeyboardShortcutsPanel),
  { ssr: false }
);
export const NotificationCenter = dynamic(
  () => import("./notification-center").then((m) => m.NotificationCenter),
  { ssr: false }
);
