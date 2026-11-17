import { lazyWorkspace } from "@/lib/lazy-workspace";

const InmueblesParaAlquilarView = lazyWorkspace(
  () => import("@/components/alquileres/InmueblesParaAlquilarView"),
  "InmueblesParaAlquilarView",
);

export default function InmueblesParaAlquilarPage() {
  return <InmueblesParaAlquilarView />;
}
