"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { isNavActive, navGroups } from "@/config/navigation";

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
  const crumb = sectionCrumb(pathname);

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

      <div className="ml-auto flex shrink-0 items-center">
        <NotificationBell />
      </div>
    </header>
  );
}
