import { lazyWorkspace } from "@/lib/lazy-workspace";

const IndicesView = lazyWorkspace(
  () => import("@/components/indices/IndicesView"),
  "IndicesView",
);

export default function IndicesPage() {
  return <IndicesView />;
}
