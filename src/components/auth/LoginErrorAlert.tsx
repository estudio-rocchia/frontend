import { AlertCircle } from "lucide-react";

import type { LoginErrorPresentation } from "@/lib/auth/login-errors";

export function LoginErrorAlert({
  id,
  error,
}: {
  id: string;
  error: LoginErrorPresentation;
}) {
  return (
    <div
      id={id}
      role="alert"
      className="login-alert-enter mt-4 flex gap-3 rounded-lg border border-danger/30 bg-danger-bg px-4 py-3.5"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-danger">{error.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-danger/90">{error.description}</p>
      </div>
    </div>
  );
}
