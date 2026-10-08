import { AdminGate } from "@/components/auth/AdminGate";
import { UsuariosView } from "@/components/usuarios/UsuariosView";

export default function UsuariosPage() {
  return (
    <AdminGate>
      <UsuariosView />
    </AdminGate>
  );
}
