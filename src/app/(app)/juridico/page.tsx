import { lazyWorkspace } from "@/lib/lazy-workspace";

const JuridicoView = lazyWorkspace(
  () => import("@/components/juridico/JuridicoView"),
  "JuridicoView",
);

export default function JuridicoPage() {
  return <JuridicoView />;
}
