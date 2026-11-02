"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect } from "react";
import { X } from "lucide-react";

import rocchiaLogo from "@/assets/rocchia-logo.png";
import { useAuth } from "@/context/auth-context";
import { isNavActive, navGroups, type NavItem } from "@/config/navigation";
import { prefetchClientesList } from "@/lib/api/clientes-list";
import { canManageUsers } from "@/lib/auth/roles";

const navLinkFocus =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--login-accent)]";

function visibleItems(items: NavItem[], canAdmin: boolean) {
  return items.filter((item) => !item.adminOnly || canAdmin);
}

const SidebarNav = memo(function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const canAdmin = canManageUsers(user);

  return (
    <>
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[var(--login-accent)]">
          <Image
            src={rocchiaLogo}
            alt=""
            width={80}
            height={80}
            sizes="40px"
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold tracking-tight text-text-on-primary">Rocchia</p>
          <p className="text-[11px] tracking-wide text-[var(--login-accent)]">Jurídico · Inmobiliario</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-5">
        {navGroups.map((group) => {
          const items = visibleItems(group.items, canAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nav-subtitle)]">
                {group.label}
              </p>
              {items.map(({ label, href, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={() => {
                      if (href === "/clientes" && token) {
                        void prefetchClientesList(token);
                      }
                    }}
                    className={`flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${navLinkFocus} ${
                      active
                        ? "bg-white/15 text-text-on-primary shadow-[inset_3px_0_0_var(--login-accent)]"
                        : "text-[var(--nav-muted)] hover:bg-white/10 hover:text-text-on-primary"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    {label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </>
  );
});

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  return (
    <>
      <aside className="hidden w-[248px] shrink-0 flex-col bg-primary px-3 py-6 xl:flex">
        <SidebarNav />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1a2b3266]"
            aria-label="Cerrar menú"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-dvh max-h-dvh w-[min(280px,88vw)] flex-col overflow-y-auto bg-primary px-3 py-6 shadow-xl">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-4 right-4 text-text-on-primary/80 hover:text-text-on-primary"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
