"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

import logo2 from "@/assets/logo2.jpg";
import rocchiaLogo from "@/assets/rocchia-logo.png";
import rocchiaWordmark from "@/assets/rocchia-wordmark.png";
import { LoginDrift, LoginSky, LoginSkyline } from "@/components/auth/LoginSkyline";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import { loginCardClass, loginFocusClass, loginTagline } from "@/lib/ui/login-styles";

export type LoginOption = 1 | 2;

const LOGIN_OPTION_KEY = "login-option";

const LoginOptionContext = createContext<{
  option: LoginOption;
  setOption: (option: LoginOption) => void;
}>({
  option: 2,
  setOption: () => {},
});

export function useLoginOption() {
  return useContext(LoginOptionContext);
}

function readStoredOption(): LoginOption {
  if (typeof window === "undefined") return 2;
  return window.sessionStorage.getItem(LOGIN_OPTION_KEY) === "1" ? 1 : 2;
}

function subscribeLoginOption(onStoreChange: () => void) {
  window.addEventListener("login-option", onStoreChange);
  return () => window.removeEventListener("login-option", onStoreChange);
}

function writeStoredOption(option: LoginOption) {
  window.sessionStorage.setItem(LOGIN_OPTION_KEY, String(option));
  window.dispatchEvent(new Event("login-option"));
}

function useStoredLoginOption(): LoginOption {
  return useSyncExternalStore(subscribeLoginOption, readStoredOption, () => 2);
}

const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-8px)" },
  { transform: "translateX(7px)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(3px)" },
  { transform: "translateX(0)" },
];

function LoginCard({
  children,
  asForm,
  onSubmit,
  shakeSignal,
  option,
}: {
  children: ReactNode;
  asForm?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  shakeSignal?: number;
  option: LoginOption;
}) {
  const cardRef = useRef<HTMLFormElement & HTMLDivElement>(null);

  useEffect(() => {
    if (!shakeSignal || !cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cardRef.current.animate(SHAKE_KEYFRAMES, { duration: 420, easing: "ease-out" });
  }, [shakeSignal]);

  const body = (
    <>
      {option === 2 ? (
        <div className="flex justify-center">
          <div
            className="login-wordmark relative w-full max-w-[320px]"
            style={{ "--wordmark": `url(${rocchiaWordmark.src})` } as React.CSSProperties}
          >
            <Image
              src={rocchiaWordmark}
              alt="Rocchia"
              width={rocchiaWordmark.width}
              height={rocchiaWordmark.height}
              priority
              className="h-auto w-full"
            />
            <span aria-hidden className="login-wordmark-shine" />
          </div>
        </div>
      ) : null}
      {children}
      <p className="mt-8 border-t border-border pt-5 text-center text-xs text-text-secondary">
        {loginTagline}
      </p>
    </>
  );

  const className = `login-card-enter ${loginCardClass}`;

  if (asForm) {
    return (
      <form ref={cardRef} onSubmit={onSubmit} className={className}>
        {body}
      </form>
    );
  }

  return (
    <div ref={cardRef} className={className}>
      {body}
    </div>
  );
}

export function LoginHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  const { option } = useLoginOption();
  const optionTwo = option === 2;
  return (
    <div className={optionTwo ? "mt-4 text-center" : "text-center"}>
      <h1 className={`${optionTwo ? "text-[22px]" : "text-[26px]"} font-bold text-text-primary`}>{title}</h1>
      {subtitle ? <p className="mt-1.5 text-[15px] text-text-secondary">{subtitle}</p> : null}
      <div aria-hidden className="mx-auto mt-4 h-0.5 w-10 rounded-full bg-login-accent" />
    </div>
  );
}

function CircleLogo({ option, size }: { option: LoginOption; size: number }) {
  if (option === 1) {
    return (
      <Image
        src={rocchiaLogo}
        alt="Rocchia"
        width={size}
        height={size}
        priority={size > 80}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <Image
      src={logo2}
      alt=""
      width={size}
      height={size}
      priority={size > 80}
      aria-hidden
      className="absolute top-1/2 left-1/2 h-[120.3%] w-[213.9%] max-w-none -translate-x-1/2 -translate-y-1/2"
    />
  );
}

function LoginOptionSwitch({
  option,
  onChange,
}: {
  option: LoginOption;
  onChange: (option: LoginOption) => void;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="group" aria-label="Diseño del acceso">
      {([1, 2] as const).map((value) => {
        const selected = option === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${loginFocusClass} ${
              selected ? "bg-bg-card text-text-primary" : "bg-white/15 text-text-on-primary"
            }`}
          >
            Opción {value}
          </button>
        );
      })}
    </div>
  );
}

export function LoginShell({
  children,
  asForm,
  onSubmit,
  shakeSignal,
}: {
  children: ReactNode;
  asForm?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Incrementing value; each change shakes the card (e.g. after rejected credentials). */
  shakeSignal?: number;
}) {
  const option = useStoredLoginOption();

  return (
    <LoginOptionContext.Provider value={{ option, setOption: writeStoredOption }}>
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.09),transparent_60%)]"
      />
      {option === 2 ? <LoginSky /> : null}
      {option === 2 ? <LoginDrift /> : null}
      <LoginSkyline />

      <div className="relative z-10 w-full max-w-[420px] pt-12">
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
          <div className="login-logo-enter relative h-[88px] w-[88px]">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-[var(--login-shadow-logo)]">
              <CircleLogo option={option} size={176} />
            </div>
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              className="pointer-events-none absolute -inset-1 h-[96px] w-[96px] -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r="47.5"
                pathLength={1}
                fill="none"
                stroke="var(--login-accent)"
                strokeWidth="4.5"
                strokeLinecap="round"
                className="login-logo-ring"
              />
            </svg>
          </div>
        </div>

        <LoginCard asForm={asForm} onSubmit={onSubmit} shakeSignal={shakeSignal} option={option}>
          {children}
        </LoginCard>
      </div>
      <LoginOptionSwitch option={option} onChange={writeStoredOption} />
    </div>
    </LoginOptionContext.Provider>
  );
}

export function LoginLoadingScreen({ message }: { message: string }) {
  const option = useStoredLoginOption();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary text-sm text-text-on-primary/80">
      {option === 2 ? (
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
          <CircleLogo option={2} size={80} />
        </div>
      ) : null}
      <LoginSpinner className="text-text-on-primary" />
      <p>{message}</p>
    </div>
  );
}
