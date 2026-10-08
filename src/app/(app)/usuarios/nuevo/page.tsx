import { AdminGate } from "@/components/auth/AdminGate";
import { CrearUsuarioView } from "@/components/usuarios/CrearUsuarioView";

export default function CrearUsuarioPage() {
  return (
    <AdminGate>
      <CrearUsuarioView />
    </AdminGate>
  );
}
