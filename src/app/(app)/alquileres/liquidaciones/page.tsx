import { lazyWorkspace } from "@/lib/lazy-workspace";

const LiquidacionesHistorialView = lazyWorkspace(
  () => import("@/components/alquileres/LiquidacionesHistorialView"),
  "LiquidacionesHistorialView",
);

export default function LiquidacionesHistorialPage() {
  return <LiquidacionesHistorialView />;
}
