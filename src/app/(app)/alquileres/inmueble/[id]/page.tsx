import { lazyWorkspace } from "@/lib/lazy-workspace";

const CatalogInmuebleFichaView = lazyWorkspace(
  () => import("@/components/ventas/CatalogInmuebleFichaView"),
  "CatalogInmuebleFichaView",
);

export default function AlquilerInmuebleFichaPage() {
  return <CatalogInmuebleFichaView />;
}
