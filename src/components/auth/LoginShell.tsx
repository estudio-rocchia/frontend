import Image from "next/image";
import type { FormEvent, ReactNode } from "react";

import rocchiaLogo from "@/assets/rocchia-logo.png";
import { LoginSpinner } from "@/components/auth/LoginSpinner";
import { loginCardClass, loginTagline } from "@/lib/ui/login-styles";

function LoginCard({
  children,
  asForm,
  onSubmit,
}: {
  children: ReactNode;
  asForm?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const body = (
    <>
      {children}
      <p className="mt-8 text-center text-sm text-text-secondary/80">{loginTagline}</p>
    </>
  );

  const className = `dashboard-animate-in ${loginCardClass}`;

  if (asForm) {
    return (
      <form onSubmit={onSubmit} className={className}>
        {body}
      </form>
    );
  }

  return <div className={className}>{body}</div>;
}

export function LoginShell({
  children,
  asForm,
  onSubmit,
}: {
  children: ReactNode;
  asForm?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-10">
      <div className="relative w-full max-w-[420px] pt-12">
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
          <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full bg-white shadow-[var(--login-shadow-logo)] ring-4 ring-login-accent">
            <Image
              src={rocchiaLogo}
              alt="Rocchia"
              width={176}
              height={176}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <LoginCard asForm={asForm} onSubmit={onSubmit}>
          {children}
        </LoginCard>
      </div>
    </div>
  );
}

export function LoginLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary text-sm text-text-on-primary/80">
      <LoginSpinner className="text-text-on-primary" />
      <p>{message}</p>
    </div>
  );
}
