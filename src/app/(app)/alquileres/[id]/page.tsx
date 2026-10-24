import { Suspense } from "react";

import { ContractFichaView } from "@/components/alquileres/ContractFichaView";

export default function ContratoFichaPage() {
  return (
    <Suspense fallback={null}>
      <ContractFichaView />
    </Suspense>
  );
}
