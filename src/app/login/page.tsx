"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonPrimary } from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, token, loading } = useAuth();
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("demo.staff");
  const [password, setPassword] = useState("DemoStaff2026!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] outline-none focus:border-primary"
            />
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

        <p className="mt-4 text-xs text-text-secondary">
          Demo local: <code className="text-text-primary">demo.staff</code> /{" "}
          <code className="text-text-primary">DemoStaff2026!</code>
        </p>
      </form>
    </div>
  );
}
