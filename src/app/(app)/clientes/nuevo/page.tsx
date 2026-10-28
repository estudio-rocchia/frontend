import { lazyWorkspace } from "@/lib/lazy-workspace";

const CrearClienteView = lazyWorkspace(
  () => import("@/components/clientes/CrearClienteView"),
  "CrearClienteView",
);

export default function NuevoClientePage() {
  return <CrearClienteView />;
}
