import { lazyWorkspace } from "@/lib/lazy-workspace";

const ClientesView = lazyWorkspace(
  () => import("@/components/clientes/ClientesView"),
  "ClientesView",
);

export default function ClientesPage() {
  return <ClientesView />;
}
