import { lazyWorkspace } from "@/lib/lazy-workspace";

const CalendarioView = lazyWorkspace(
  () => import("@/components/calendario/CalendarioView"),
  "CalendarioView",
);

export default function CalendarioPage() {
  return <CalendarioView />;
}
