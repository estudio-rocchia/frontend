import { lazyWorkspace } from "@/lib/lazy-workspace";

const VentasWorkspace = lazyWorkspace(
  () => import("@/components/ventas/VentasWorkspace"),
  "VentasWorkspace",
);

export default function VentasPage() {
  return <VentasWorkspace />;
}
