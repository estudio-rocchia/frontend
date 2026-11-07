import { lazyWorkspace } from "@/lib/lazy-workspace";

const ContratosHistorialView = lazyWorkspace(
  () => import("@/components/alquileres/ContratosHistorialView"),
  "ContratosHistorialView",
);

export default function ContratosHistorialPage() {
  return <ContratosHistorialView />;
}
