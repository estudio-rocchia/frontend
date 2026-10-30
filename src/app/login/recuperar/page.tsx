"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { LoginShell } from "@/components/auth/LoginShell";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import {
  loginInputClass,
  loginLinkClass,
  loginSubmitClass,
} from "@/lib/ui/login-styles";

export default function RecuperarCuentaPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(email.trim() && !submitting);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setFieldError("Ingresá tu email.");
      return;
    }

    setFieldError(null);
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  }

  return (
    <LoginShell asForm onSubmit={handleSubmit}>
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-text-primary">Recuperar cuenta</h1>
        <p className="mt-1.5 text-[15px] text-text-secondary">
          Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
        </p>
      </div>

      {submitted ? (
        <div
          role="status"
          className="login-alert-enter mt-8 rounded-lg border border-success bg-success-bg px-4 py-3 text-sm text-success"
        >
          Si existe una cuenta asociada a{" "}
          <span className="font-semibold">{email.trim()}</span>, recibirás un correo con los pasos
          para restablecer tu contraseña.
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-text-primary">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              autoComplete="email"
              autoFocus
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "recuperar-email-error" : undefined}
              placeholder="email o nombre de usuario"
              className={loginInputClass(Boolean(fieldError))}
            />
            {fieldError ? (
              <span id="recuperar-email-error" className="login-alert-enter text-xs text-danger">
                {fieldError}
              </span>
            ) : null}
          </label>

          <button type="submit" disabled={!canSubmit} className={loginSubmitClass}>
            {submitting ? (
              <>
                <LoginSpinner className="text-white" />
                Enviando…
              </>
            ) : (
              "Enviar instrucciones"
            )}
          </button>
        </div>
      )}

      <p className="mt-6 text-center">
        <Link href="/login" className={loginLinkClass}>
          Volver al inicio de sesión
        </Link>
      </p>
    </LoginShell>
  );
}
