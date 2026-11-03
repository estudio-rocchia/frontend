"use client";

import { LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { isNavActive, navGroups, userInitials } from "@/config/navigation";
import { useAuth } from "@/context/auth-context";

function sectionCrumb(pathname: string) {
  let best: { group: string; section: string; href: string } | null = null;
  for (const group of navGroups) {
    for (const item of group.items) {
      if (!isNavActive(pathname, item.href)) continue;
      if (!best || item.href.length > best.href.length) {
        best = { group: group.label, section: item.label, href: item.href };
      }
    }
  }
  return best ?? { group: "Operación", section: "Inicio", href: "/" };
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const crumb = sectionCrumb(pathname);
  const displayName = user?.username ?? "Usuario";

  return (
    <header className="flex shrink-0 items-center gap-3 bg-bg-page px-4 py-3 sm:px-5 xl:px-7">
      <button
        type="button"
        onClick={onMenuClick}
        className="shrink-0 rounded-md p-2 text-text-secondary hover:bg-bg-cream hover:text-text-primary xl:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="Ubicación" className="min-w-0 text-[13px]">
        <span className="text-text-secondary">{crumb.group}</span>
        <span className="px-1.5 text-text-secondary/50" aria-hidden>
          /
        </span>
        <span className="font-medium text-text-primary">{crumb.section}</span>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationBell />
        <div className="flex items-center gap-2.5 py-1 pl-1">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-text-on-primary">
            <span className="sr-only">{displayName}, sesión activa</span>
            <span aria-hidden>{userInitials(displayName)}</span>
            <span
              className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-[#45B3A6] ring-2 ring-bg-page"
              aria-hidden
            />
          </span>
          <span className="hidden max-w-[140px] truncate text-[13px] font-semibold text-text-primary sm:inline">
            {displayName}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-text-secondary transition-colors duration-100 ease-out hover:bg-bg-cream hover:text-text-primary motion-reduce:transition-none"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          Salir
        </button>
      </div>
    </header>
  );
}
