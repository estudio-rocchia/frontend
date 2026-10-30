"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { FormEvent, Suspense, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LoginErrorAlert } from "@/components/auth/LoginErrorAlert";
import { LoginLoadingScreen, LoginShell } from "@/components/auth/LoginShell";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import { resetPasswordWithToken } from "@/lib/api";
import { getLoginErrorPresentation } from "@/lib/auth/login-errors";
import {
  loginFocusClass,
  loginInputClass,
  loginLinkClass,
  loginSubmitClass,
} from "@/lib/ui/login-styles";

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

function RestablecerContrasenaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorId = useId();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<ReturnType<typeof getLoginErrorPresentation> | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const canSubmit = Boolean(token && password && confirmPassword && !submitting);

  function validateFields(): FieldErrors {
    const errors: FieldErrors = {};
    if (password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres.";
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validateFields();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0 || !token) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await resetPasswordWithToken(token, password);
      setCompleted(true);
      window.setTimeout(() => router.replace("/login"), 2500);
    } catch (error) {
      setSubmitError(getLoginErrorPresentation(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell asForm onSubmit={handleSubmit}>
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-text-primary">Nueva contraseña</h1>
        <p className="mt-1.5 text-[15px] text-text-secondary">
          Elegí una contraseña nueva para volver a ingresar al estudio.
        </p>
      </div>

      {!token ? (
        <div
          role="alert"
          className="login-alert-enter mt-8 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          El enlace no es válido. Solicitá uno nuevo desde la recuperación de cuenta.
        </div>
      ) : completed ? (
        <div
          role="status"
          className="login-alert-enter mt-8 rounded-lg border border-success bg-success-bg px-4 py-3 text-sm text-success"
        >
          Contraseña actualizada. Te redirigimos al inicio de sesión…
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-text-primary">Nueva contraseña</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }
                  if (submitError) setSubmitError(null);
                }}
                autoComplete="new-password"
                autoFocus
                aria-invalid={Boolean(fieldErrors.password)}
                className={`w-full py-3 pr-11 pl-4 ${loginInputClass(Boolean(fieldErrors.password))}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-text-secondary hover:text-text-primary ${loginFocusClass}`}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <span className="login-alert-enter text-xs text-danger">{fieldErrors.password}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-text-primary">Confirmar contraseña</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }
                  if (submitError) setSubmitError(null);
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={submitError ? errorId : undefined}
                className={`w-full py-3 pr-11 pl-4 ${loginInputClass(Boolean(fieldErrors.confirmPassword))}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-text-secondary hover:text-text-primary ${loginFocusClass}`}
                aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword ? (
              <span className="login-alert-enter text-xs text-danger">
                {fieldErrors.confirmPassword}
              </span>
            ) : null}
          </label>

          {submitError ? <LoginErrorAlert id={errorId} error={submitError} /> : null}

          <button type="submit" disabled={!canSubmit} className={loginSubmitClass}>
            {submitting ? (
              <>
                <LoginSpinner className="text-white" />
                Guardando…
              </>
            ) : (
              "Guardar contraseña"
            )}
          </button>
        </div>
      )}

      <p className="mt-6 text-center">
        <Link href="/login/recuperar" className={loginLinkClass}>
          Solicitar un enlace nuevo
        </Link>
      </p>
    </LoginShell>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <Suspense fallback={<LoginLoadingScreen message="Cargando…" />}>
      <RestablecerContrasenaForm />
    </Suspense>
  );
}
