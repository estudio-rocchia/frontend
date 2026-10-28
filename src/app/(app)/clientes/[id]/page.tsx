import { lazyWorkspace } from "@/lib/lazy-workspace";

const ClienteFichaView = lazyWorkspace(
  () => import("@/components/clientes/ClienteFichaView"),
  "ClienteFichaView",
);

export default function ClienteFichaPage() {
  return <ClienteFichaView />;
}
