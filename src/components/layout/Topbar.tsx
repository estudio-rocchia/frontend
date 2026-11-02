"use client";

import { Menu } from "lucide-react";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/auth-context";
import { userInitials } from "@/config/navigation";

export function Topbar({ onMenuClick, onSky = false }: { onMenuClick?: () => void; onSky?: boolean }) {
  const { user, logout } = useAuth();
  const displayName = user?.username ?? "Usuario";

  return (
    <header
      className={`relative z-20 flex min-h-16 shrink-0 items-center gap-3 px-4 py-3 sm:px-5 xl:px-6 ${
        onSky
          ? "border-b border-white/10 bg-transparent"
          : "border-b border-border/80 bg-bg-card shadow-[0_1px_0_rgba(26,43,50,0.04)]"
      }`}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className={`shrink-0 rounded-md p-2 xl:hidden ${
          onSky
            ? "text-white/80 hover:bg-white/10 hover:text-white"
            : "text-text-secondary hover:bg-bg-page hover:text-text-primary"
        }`}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationBell tone={onSky ? "light" : "default"} />
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 sm:pr-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold tracking-wide text-text-on-primary ring-2 ring-[var(--login-accent)]"
            aria-hidden
          >
            {userInitials(displayName)}
          </span>
          <span
            className={`hidden max-w-[140px] truncate text-[13px] font-semibold sm:inline ${
              onSky ? "text-white" : "text-text-primary"
            }`}
          >
            {displayName}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className={`rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
            onSky
              ? "text-white/80 hover:bg-white/10 hover:text-white"
              : "text-text-secondary hover:bg-bg-page hover:text-text-primary"
          }`}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
