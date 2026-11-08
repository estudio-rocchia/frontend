"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/dashboard-v14/ThemeToggle";
import { useAuth } from "@/context/auth-context";
import { useOpenMobileNav } from "@/context/mobile-nav-context";
import { ButtonOutline } from "@/components/ui/Button";
import { mainNav } from "@/config/navigation";

function pageTitle(pathname: string): string {
  if (pathname === "/") return "";
  const item = mainNav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return item?.label ?? "Rocchia";
}

function userMonogram(username: string): string {
  return (username.split("@")[0] ?? username).slice(0, 2).toUpperCase() || "US";
}

export function WorkspaceFloatingBar() {
  const pathname = usePathname();
  const openNav = useOpenMobileNav();
  const { user, logout } = useAuth();
  const displayName = user?.username?.split("@")[0] ?? "Usuario";

  if (pathname === "/") return null;

  const title = pageTitle(pathname);

  return (
    <div className="sticky top-1 z-40 mb-2 px-4 pt-1 sm:px-5 xl:px-7">
      <div className="glass-card flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={openNav}
          className="shrink-0 rounded-xl p-2 text-text-secondary hover:bg-bg-page xl:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title ? <p className="text-sm font-bold text-text-primary">{title}</p> : null}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-bg-page/90 py-1 pl-1 pr-2 sm:flex sm:pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-sky text-[11px] font-bold text-text-primary">
              {userMonogram(user?.username ?? "Usuario")}
            </div>
            <span className="max-w-[100px] truncate text-[13px] font-semibold text-text-primary md:max-w-none">
              {displayName}
            </span>
          </div>
          <ButtonOutline type="button" onClick={logout} className="rounded-xl px-3 py-2 text-xs sm:px-4">
            Salir
          </ButtonOutline>
        </div>
      </div>
    </div>
  );
}
