"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/context/auth-context";
import { canManageUsers } from "@/lib/auth/roles";
import { pagePaddingClass } from "@/lib/layout";

export function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = canManageUsers(user);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/");
    }
  }, [loading, allowed, router]);

  if (loading) {
    return (
      <div className={`${pagePaddingClass} text-sm text-text-secondary`}>Cargando…</div>
    );
  }

  if (!allowed) {
    return (
      <div className={`flex flex-col gap-3 ${pagePaddingClass}`}>
        <h1 className="text-[22px] font-bold text-text-primary">Acceso restringido</h1>
        <p className="text-sm text-text-secondary">
          Solo los administradores pueden gestionar usuarios y roles.
        </p>
        <Link href="/" className="text-sm font-semibold text-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return children;
}
