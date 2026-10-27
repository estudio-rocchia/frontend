"use client";

import { Menu } from "lucide-react";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/auth-context";
import { ButtonOutline } from "@/components/ui/Button";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const displayName = user?.username ?? "Usuario";

  return (
    <header className="flex min-h-16 shrink-0 items-center gap-2 border-b border-border bg-bg-card px-4 py-3 sm:gap-3 sm:px-5 xl:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="shrink-0 rounded-sm p-2 text-text-secondary hover:bg-bg-page hover:text-text-primary xl:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2 rounded-full bg-primary-soft py-1.5 pl-1.5 pr-2 sm:pr-3">
          <div className="h-7 w-7 shrink-0 rounded-full bg-accent-sky" aria-hidden />
          <span className="hidden max-w-[120px] truncate text-[13px] font-semibold text-text-primary sm:inline md:max-w-none">
            {displayName}
          </span>
        </div>
        <ButtonOutline type="button" onClick={logout} className="px-3 py-2 text-xs sm:px-[18px]">
          Salir
        </ButtonOutline>
      </div>
    </header>
  );
}
