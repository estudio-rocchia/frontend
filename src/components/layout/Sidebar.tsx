"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";

import rocchiaLogo from "@/assets/rocchia-logo.png";
import { useAuth } from "@/context/auth-context";
import { isNavActive, navGroups, userInitials, type NavItem } from "@/config/navigation";
import { fetchDashboardResumen } from "@/lib/api";
import { invalidateCache, withCache } from "@/lib/api/cache";
import { subscribeDashboardAlertsInvalidate } from "@/lib/dashboard-alerts-events";
import { prefetchClientesList } from "@/lib/api/clientes-list";
import { canManageUsers } from "@/lib/auth/roles";

const navLinkFocus =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C2CB]";

const itemClass =
  "group flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-100 ease-out motion-reduce:transition-none " +
  navLinkFocus;

function visibleItems(items: NavItem[], canAdmin: boolean) {
  return items.filter((item) => !item.adminOnly || canAdmin);
}

function useAlquileresMoraCount(token: string | null) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setCount(null);
      return;
    }
    let cancelled = false;
    const cacheKey = `dashboard-resumen:${token}:30`;

    function load(force: boolean) {
      if (force) invalidateCache(cacheKey);
      const request = force
        ? fetchDashboardResumen(token!, 30)
        : withCache(cacheKey, () => fetchDashboardResumen(token!, 30), { ttlMs: 45_000 });
      void request
        .then((resumen) => {
          if (!cancelled) setCount(resumen.tarjetas.enMora.count);
        })
        .catch(() => {
          if (!cancelled && !force) setCount(null);
        });
    }

    load(false);
    const unsubscribe = subscribeDashboardAlertsInvalidate(() => load(true));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [token]);

  return count;
}

const SidebarNav = memo(function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const canAdmin = canManageUsers(user);
  const moraCount = useAlquileresMoraCount(token);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-7 flex items-center gap-3 px-1.5">
        <div className="relative h-10 w-10 shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-white ring-2 ring-[#00C2CB]">
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
          <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-[#FBC7FB] ring-2 ring-[#107077]" />
        </div>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold tracking-tight text-white">Rocchia</p>
          <p className="text-[11px] text-white/70">Jurídico · Inmobiliario</p>
        </div>
      </div>

      <nav className="rocchia-scroll flex flex-1 flex-col gap-6 overflow-y-auto">
        {navGroups.map((group) => {
          const items = visibleItems(group.items, canAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3.5 pb-1.5 text-[11px] font-medium tracking-wide text-white/40 uppercase">
                {group.label}
              </p>
              {items.map(({ label, href, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                const alertCount = href === "/alquileres" && moraCount && moraCount > 0 ? moraCount : null;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={alertCount ? `${label}, ${alertCount} en mora` : undefined}
                    onMouseEnter={() => {
                      if (href === "/clientes" && token) {
                        void prefetchClientesList(token);
                      }
                    }}
                    className={`${itemClass} ${
                      active
                        ? "border-white/10 bg-white/15 font-semibold text-white backdrop-blur-sm"
                        : "border-transparent font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      className="h-[18px] w-[18px] shrink-0 transition-transform duration-100 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      strokeWidth={1.75}
                    />
                    <span className="min-w-0 truncate">{label}</span>
                    {alertCount ? (
                      <span className="ml-auto rounded-full bg-[#FBC7FB] px-1.5 py-0.5 text-[11px] font-semibold text-[#010400] tabular-nums">
                        {alertCount > 99 ? "99+" : alertCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
});

const roleLabel: Record<string, string> = {
  admin: "Admin",
  staff: "Equipo",
  readonly: "Lectura",
};

const SidebarAccount = memo(function SidebarAccount() {
  const { user, logout } = useAuth();
  const displayName = user?.username ?? "Usuario";
  const role = user?.roles[0];
  const roleName = role ? (roleLabel[role] ?? role) : null;

  return (
    <div className="mt-4 flex items-center gap-2.5 border-t border-white/10 px-1.5 pt-4">
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold text-white">
        <span className="sr-only">{displayName}{roleName ? `, ${roleName}` : ""}</span>
        <span aria-hidden>{userInitials(displayName)}</span>
        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-[#45B3A6] ring-2 ring-[#107077]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-white">{displayName}</span>
        {roleName ? <span className="block truncate text-[11px] text-white/60">{roleName}</span> : null}
      </span>
      <button
        type="button"
        onClick={logout}
        className="rounded-md p-2 text-white/70 transition-all duration-100 ease-out hover:bg-white/10 hover:text-white motion-reduce:transition-none"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
});

function SidebarFrame({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <SidebarNav onNavigate={onNavigate} />
      <SidebarAccount />
    </>
  );
}

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
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-rocchia-teal-hover/40 bg-primary px-3 py-6 xl:flex">
        <SidebarFrame />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#010400]/40"
            aria-label="Cerrar menú"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-dvh max-h-dvh w-[min(280px,88vw)] flex-col overflow-hidden bg-primary px-3 py-6">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-4 right-3 rounded-md p-2 text-white/70 transition-all duration-100 ease-out hover:bg-white/10 hover:text-white motion-reduce:transition-none"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex min-h-0 flex-1 flex-col pr-8">
              <SidebarFrame onNavigate={onMobileClose} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
