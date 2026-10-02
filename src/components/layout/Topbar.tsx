"use client";

import { Bell, Search } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { ButtonOutline } from "@/components/ui/Button";

export function Topbar() {
  const { user, logout } = useAuth();
  const displayName = user?.username ?? "Usuario";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-card px-6">
      <div className="flex w-[360px] max-w-full items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3.5 py-2.5">
        <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" />
        <span className="truncate text-sm text-text-secondary">
          Buscar contratos, clientes, expedientes…
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-text-secondary hover:text-text-primary"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 rounded-full bg-primary-soft py-1.5 pl-1.5 pr-3">
          <div className="h-7 w-7 shrink-0 rounded-full bg-accent-sky" aria-hidden />
          <span className="text-[13px] font-semibold text-text-primary">{displayName}</span>
        </div>
        <ButtonOutline type="button" onClick={logout} className="py-2 text-xs">
          Salir
        </ButtonOutline>
      </div>
    </header>
  );
}
