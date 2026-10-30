"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CapsLockHint, useCapsLock } from "@/components/auth/CapsLockHint";
import { LoginErrorAlert } from "@/components/auth/LoginErrorAlert";
import { LoginHeading, LoginLoadingScreen, LoginShell } from "@/components/auth/LoginShell";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import { useAuth } from "@/context/auth-context";
import {
  getLoginErrorPresentation,
  type LoginErrorPresentation,
} from "@/lib/auth/login-errors";
import {
  loginFocusClass,
  loginInputClass,
  loginInputIconClass,
  loginLinkClass,
  loginSubmitClass,
} from "@/lib/ui/login-styles";

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

function describedBy(...ids: Array<string | false | null | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export default function LoginPage() {
  const { login, token, loading } = useAuth();
  const router = useRouter();
  const errorId = useId();
  const capsLockId = useId();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<LoginErrorPresentation | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeSignal, setShakeSignal] = useState(0);
  const { capsLock, capsLockHandlers } = useCapsLock();

  const canSubmit = Boolean(usernameOrEmail.trim() && password && !submitting);
  const authFailed = Boolean(loginError?.highlightFields);

  useEffect(() => {
    if (!loading && token) {
      router.replace("/");
    }
  }, [loading, token, router]);

  useEffect(() => {
    if (shakeSignal === 0) return;
    passwordRef.current?.focus();
    passwordRef.current?.select();
  }, [shakeSignal]);

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
      const presentation = getLoginErrorPresentation(err);
      setLoginError(presentation);
      if (presentation.highlightFields) {
        setShakeSignal((value) => value + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || token) {
    return <LoginLoadingScreen message="Redirigiendo…" />;
  }

  return (
    <LoginShell asForm onSubmit={handleSubmit} shakeSignal={shakeSignal}>
      <LoginHeading title="Acceso" subtitle="Estudio Jurídico e Inmobiliario" />

      <div className="mt-7 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-primary">Email o usuario</span>
          <div className="relative">
            <UserRound className={loginInputIconClass} aria-hidden />
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
              disabled={submitting}
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(fieldErrors.usernameOrEmail || authFailed)}
              aria-describedby={describedBy(
                fieldErrors.usernameOrEmail ? "login-username-error" : loginError && errorId,
              )}
              placeholder="email o nombre de usuario"
              className={loginInputClass(Boolean(fieldErrors.usernameOrEmail || authFailed), {
                leadingIcon: true,
              })}
            />
          </div>
          {fieldErrors.usernameOrEmail ? (
            <span id="login-username-error" className="login-alert-enter text-xs text-danger">
              {fieldErrors.usernameOrEmail}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-text-primary">Contraseña</span>
          <div className="relative">
            <LockKeyhole className={loginInputIconClass} aria-hidden />
            <input
              ref={passwordRef}
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
              {...capsLockHandlers}
              disabled={submitting}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password || authFailed)}
              aria-describedby={describedBy(
                fieldErrors.password ? "login-password-error" : loginError && errorId,
                capsLock && capsLockId,
              )}
              className={loginInputClass(Boolean(fieldErrors.password || authFailed), {
                leadingIcon: true,
                trailingAction: true,
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={submitting}
              className={`absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-text-secondary hover:text-text-primary disabled:cursor-not-allowed ${loginFocusClass}`}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden />
              ) : (
                <Eye className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CapsLockHint id={capsLockId} visible={capsLock} />
            <Link href="/login/recuperar" className={`ml-auto ${loginLinkClass}`}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
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
          <>
            Ingresar
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 [button:enabled:hover_&]:translate-x-1"
              aria-hidden
            />
          </>
        )}
      </button>
    </LoginShell>
  );
}
