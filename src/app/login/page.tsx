"use client";

import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, token, loading } = useAuth();
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      router.replace("/");
    }
  }, [loading, token, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(usernameOrEmail.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page text-sm text-text-secondary">
        Redirigiendo…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-md border border-border bg-bg-card p-8 shadow-[var(--shadow-card)]"
      >
        <h1 className="text-[22px] font-bold text-text-primary">Rocchia — Acceso</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Ingresá con tu usuario del sistema interno.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Usuario o email</span>
            <input
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              autoComplete="username"
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Contraseña</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-sm border border-border bg-bg-page py-2.5 pr-10 pl-3 text-[13px] outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-1 text-text-secondary hover:text-text-primary"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <ButtonPrimary type="submit" disabled={submitting}>
            {submitting ? "Ingresando…" : "Ingresar"}
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
}
