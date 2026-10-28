import { lazyWorkspace } from "@/lib/lazy-workspace";

const DashboardView = lazyWorkspace(
  () => import("@/components/dashboard/DashboardView"),
  "DashboardView",
);

export default function DashboardPage() {
  return <DashboardView />;
}
