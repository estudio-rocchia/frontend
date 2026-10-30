import { lazyWorkspace } from "@/lib/lazy-workspace";

const VisasView = lazyWorkspace(() => import("@/components/visas/VisasView"), "VisasView");

export default function VisasPage() {
  return <VisasView />;
}
