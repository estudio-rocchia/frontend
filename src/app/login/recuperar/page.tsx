import Link from "next/link";

import { LoginHeading, LoginShell } from "@/components/auth/LoginShell";
import { loginLinkClass } from "@/lib/ui/login-styles";

export default function RecuperarCuentaPage() {
  return (
    <LoginShell>
      <LoginHeading title="Recuperar cuenta" />

      <div
        role="status"
        className="login-alert-enter mt-7 rounded-lg border border-border bg-bg-page px-4 py-3 text-sm text-text-secondary"
      >
        <p>
          Si olvidaste tu contraseña, contactá a un administrador del estudio para que la
          restablezca desde el panel de usuarios.
        </p>
      </div>

      <p className="mt-6 text-center">
        <Link href="/login" className={loginLinkClass}>
          Volver al inicio de sesión
        </Link>
      </p>
    </LoginShell>
  );
}
