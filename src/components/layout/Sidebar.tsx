"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect } from "react";
import { X } from "lucide-react";

import rocchiaLogo from "@/assets/rocchia-logo.png";
import { useAuth } from "@/context/auth-context";
import { mainNav } from "@/config/navigation";
import { prefetchClientesList } from "@/lib/api/clientes-list";
import { canManageUsers } from "@/lib/auth/roles";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SidebarNav = memo(function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const navItems = mainNav.filter((item) => !item.adminOnly || canManageUsers(user));

  return (
    <>
      <div className="flex items-center gap-2.5 pb-5">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white/25">
          <Image
            src={rocchiaLogo}
            alt=""
            width={88}
            height={88}
            sizes="44px"
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-lg font-bold text-text-on-primary">Rocchia</span>
      </div>
      <p className="mb-2 text-[11px] text-[var(--nav-subtitle)]">Jurídico · Inmobiliario</p>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              onMouseEnter={() => {
                if (href === "/clientes" && token) {
                  void prefetchClientesList(token);
                }
              }}
              className={`flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "text-text-on-primary"
                  : "text-[var(--nav-muted)] hover:text-text-on-primary/90"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {label}
            </Link>
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
      <aside className="hidden w-[240px] shrink-0 flex-col gap-2 bg-primary px-4 py-6 xl:flex">
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
          <aside className="relative flex h-full w-[min(280px,88vw)] flex-col gap-2 bg-primary px-4 py-6 shadow-xl">
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
