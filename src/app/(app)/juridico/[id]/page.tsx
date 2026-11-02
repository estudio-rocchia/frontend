import { lazyWorkspace } from "@/lib/lazy-workspace";

const ExpedienteDetailView = lazyWorkspace(
  () => import("@/components/juridico/ExpedienteDetailView"),
  "ExpedienteDetailView",
);

export default function ExpedientePage() {
  return <ExpedienteDetailView />;
}
