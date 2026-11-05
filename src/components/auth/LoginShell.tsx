"use client";

import Image from "next/image";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

import logo2 from "@/assets/logo2.jpg";
import rocchiaWordmark from "@/assets/rocchia-wordmark.png";
import { LoginDrift, LoginSky, LoginSkyline } from "@/components/auth/LoginSkyline";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import { loginCardClass, loginTagline } from "@/lib/ui/login-styles";

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
}: {
  children: ReactNode;
  asForm?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  shakeSignal?: number;
}) {
  const cardRef = useRef<HTMLFormElement & HTMLDivElement>(null);

  useEffect(() => {
    if (!shakeSignal || !cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cardRef.current.animate(SHAKE_KEYFRAMES, { duration: 420, easing: "ease-out" });
  }, [shakeSignal]);

  const body = (
    <>
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
  return (
    <div className="mt-4 text-center">
      <h1 className="text-[22px] font-bold text-text-primary">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-[15px] text-text-secondary">{subtitle}</p> : null}
      <div aria-hidden className="mx-auto mt-4 h-0.5 w-10 rounded-full bg-login-accent" />
    </div>
  );
}

function CircleLogo({ size }: { size: number }) {
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
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.09),transparent_60%)]"
      />
      <LoginSky />
      <LoginDrift />
      <LoginSkyline />

      <div className="relative z-10 w-full max-w-[420px] pt-12">
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
          <div className="login-logo-enter relative h-[88px] w-[88px]">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-[var(--login-shadow-logo)]">
              <CircleLogo size={176} />
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

        <LoginCard asForm={asForm} onSubmit={onSubmit} shakeSignal={shakeSignal}>
          {children}
        </LoginCard>
      </div>
    </div>
  );
}

export function LoginLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary text-sm text-text-on-primary/80">
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
        <CircleLogo size={80} />
      </div>
      <LoginSpinner className="text-text-on-primary" />
      <p>{message}</p>
    </div>
  );
}
