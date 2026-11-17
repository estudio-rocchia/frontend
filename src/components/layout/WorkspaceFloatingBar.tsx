"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/dashboard-v14/ThemeToggle";
import { useOpenMobileNav } from "@/context/mobile-nav-context";
import { mainNav } from "@/config/navigation";

function pageTitle(pathname: string): string {
  if (pathname === "/") return "";
  const item = mainNav.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return item?.label ?? "Rocchia";
}

export function WorkspaceFloatingBar() {
  const pathname = usePathname();
  const openNav = useOpenMobileNav();

  if (pathname === "/") return null;

  const title = pageTitle(pathname);

  return (
    <div className="sticky top-1 z-40 mb-0.5 px-4 pt-0 sm:px-5 xl:px-7">
      <div className="glass-card flex items-center gap-1.5 px-2 py-1 sm:px-3">
        <button
          type="button"
          onClick={openNav}
          className="shrink-0 rounded-md p-1 text-text-secondary hover:bg-bg-page xl:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </button>

        {title ? <p className="text-[13px] font-bold leading-none text-text-primary">{title}</p> : null}

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle size="compact" />
          <NotificationBell compact />
        </div>
      </div>
    </div>
  );
}
