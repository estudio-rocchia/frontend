import { lazyWorkspace } from "@/lib/lazy-workspace";

const CierreBalanceView = lazyWorkspace(
  () => import("@/components/reportes/CierreBalanceView"),
  "CierreBalanceView",
);

export default function ReportesCierrePage() {
  return <CierreBalanceView />;
}
