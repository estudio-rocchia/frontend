import { lazyWorkspace } from "@/lib/lazy-workspace";

const AlquileresWorkspace = lazyWorkspace(
  () => import("@/components/alquileres/AlquileresWorkspace"),
  "AlquileresWorkspace",
);

export default function AlquileresPage() {
  return <AlquileresWorkspace />;
}
