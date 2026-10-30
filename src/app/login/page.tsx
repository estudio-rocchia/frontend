"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { LoginErrorAlert } from "@/components/auth/LoginErrorAlert";
import { LoginLoadingScreen, LoginShell } from "@/components/auth/LoginShell";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import { useAuth } from "@/context/auth-context";
import {
  getLoginErrorPresentation,
  type LoginErrorPresentation,
} from "@/lib/auth/login-errors";
import { loginFocusClass, loginInputClass, loginLinkClass, loginSubmitClass } from "@/lib/ui/login-styles";

type FieldErrors = {
  usernameOrEmail?: string;
  password?: string;
};

function validateFields(usernameOrEmail: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!usernameOrEmail.trim()) {
    errors.usernameOrEmail = "Ingresá tu email o nombre de usuario.";
  }
  if (!password) {
    errors.password = "Ingresá tu contraseña.";
  }
  return errors;
}

export default function LoginPage() {
  const { login, token, loading } = useAuth();
  const router = useRouter();
  const errorId = useId();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<LoginErrorPresentation | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = Boolean(usernameOrEmail.trim() && password && !submitting);

  useEffect(() => {
    if (!loading && token) {
      router.replace("/");
    }
  }, [loading, token, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validateFields(usernameOrEmail, password);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setLoginError(null);
    setSubmitting(true);
    try {
      await login(usernameOrEmail.trim(), password);
      router.replace("/");
    } catch (err) {
      setLoginError(getLoginErrorPresentation(err));
    } finally {
      setSubmitting(false);
    }
  }

  const authFailed = Boolean(loginError?.highlightFields);

  if (loading || token) {
    return <LoginLoadingScreen message="Redirigiendo…" />;
  }

  return (
    <LoginShell asForm onSubmit={handleSubmit}>
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-text-primary">Acceso</h1>
        <p className="mt-1.5 text-[15px] text-text-secondary">Estudio Jurídico e Inmobiliario</p>
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-primary">Email o usuario</span>
          <input
            data-testid="login-username"
            value={usernameOrEmail}
            onChange={(e) => {
              setUsernameOrEmail(e.target.value);
              if (fieldErrors.usernameOrEmail) {
                setFieldErrors((current) => ({ ...current, usernameOrEmail: undefined }));
              }
              if (loginError) setLoginError(null);
            }}
            autoComplete="username"
            autoFocus
            aria-invalid={Boolean(fieldErrors.usernameOrEmail || authFailed)}
            aria-describedby={
              fieldErrors.usernameOrEmail
                ? "login-username-error"
                : loginError
                  ? errorId
                  : undefined
            }
            placeholder="email o nombre de usuario"
            className={loginInputClass(Boolean(fieldErrors.usernameOrEmail || authFailed))}
          />
          {fieldErrors.usernameOrEmail ? (
            <span id="login-username-error" className="login-alert-enter text-xs text-danger">
              {fieldErrors.usernameOrEmail}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-primary">Contraseña</span>
          <div className="relative">
            <input
              data-testid="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }
                if (loginError) setLoginError(null);
              }}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password || authFailed)}
              aria-describedby={
                fieldErrors.password ? "login-password-error" : loginError ? errorId : undefined
              }
              className={`w-full py-3 pr-11 pl-4 ${loginInputClass(Boolean(fieldErrors.password || authFailed))}`}
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
          <p className="text-right">
            <Link href="/login/recuperar" className={loginLinkClass}>
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          {fieldErrors.password ? (
            <span id="login-password-error" className="login-alert-enter text-xs text-danger">
              {fieldErrors.password}
            </span>
          ) : null}
        </label>
      </div>

      {loginError ? <LoginErrorAlert id={errorId} error={loginError} /> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        data-testid="login-submit"
        className={`mt-6 ${loginSubmitClass}`}
      >
        {submitting ? (
          <>
            <LoginSpinner className="text-white" />
            Ingresando…
          </>
        ) : (
          "Ingresar"
        )}
      </button>
    </LoginShell>
  );
}
