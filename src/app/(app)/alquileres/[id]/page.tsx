import { Suspense } from "react";

import { lazyWorkspace } from "@/lib/lazy-workspace";

const ContractFichaView = lazyWorkspace(
  () => import("@/components/alquileres/ContractFichaView"),
  "ContractFichaView",
);

export default function ContratoFichaPage() {
  return (
    <Suspense fallback={null}>
      <ContractFichaView />
    </Suspense>
  );
}
