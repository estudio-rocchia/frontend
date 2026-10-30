import { Loader2 } from "lucide-react";

export function LoginSpinner({ className = "text-login-accent" }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin ${className}`} aria-hidden />;
}
