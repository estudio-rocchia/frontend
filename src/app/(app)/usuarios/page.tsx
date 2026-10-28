import { lazyWorkspace } from "@/lib/lazy-workspace";

const UsuariosView = lazyWorkspace(
  () => import("@/components/usuarios/UsuariosView"),
  "UsuariosView",
);

export default function UsuariosPage() {
  return <UsuariosView />;
}
