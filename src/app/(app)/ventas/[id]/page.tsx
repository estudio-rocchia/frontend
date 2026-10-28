import { Suspense } from "react";

import { lazyWorkspace } from "@/lib/lazy-workspace";

const VentaFichaView = lazyWorkspace(
  () => import("@/components/ventas/VentaFichaView"),
  "VentaFichaView",
);

export default function VentaFichaPage() {
  return (
    <Suspense fallback={null}>
      <VentaFichaView />
    </Suspense>
  );
}
