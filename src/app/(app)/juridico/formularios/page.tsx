import { lazyWorkspace } from "@/lib/lazy-workspace";

const FormulariosView = lazyWorkspace(
  () => import("@/components/juridico/FormulariosView"),
  "FormulariosView",
);

export default function FormulariosPage() {
  return <FormulariosView />;
}
