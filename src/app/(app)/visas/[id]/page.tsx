import { lazyWorkspace } from "@/lib/lazy-workspace";

const VisaFichaView = lazyWorkspace(
  () => import("@/components/visas/VisaFichaView"),
  "VisaFichaView",
);

export default function VisaFichaPage() {
  return <VisaFichaView />;
}
