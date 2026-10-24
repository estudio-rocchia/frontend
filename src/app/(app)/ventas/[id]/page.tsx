import { Suspense } from "react";

import { VentaFichaView } from "@/components/ventas/VentaFichaView";

export default function VentaFichaPage() {
  return (
    <Suspense fallback={null}>
      <VentaFichaView />
    </Suspense>
  );
}
