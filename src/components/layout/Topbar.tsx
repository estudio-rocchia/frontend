"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useSearch } from "@/context/search-context";
import { ButtonOutline } from "@/components/ui/Button";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { query, setQuery, clearQuery } = useSearch();
  const pathname = usePathname();
  const displayName = user?.username ?? "Usuario";
  const searchEnabled = pathname === "/alquileres" || pathname.startsWith("/alquileres/");

  useEffect(() => {
    if (!searchEnabled) {
      clearQuery();
    }
  }, [searchEnabled, clearQuery]);

  return (
    <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-bg-card px-4 py-3 sm:px-5 xl:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="shrink-0 rounded-sm p-2 text-text-secondary hover:bg-bg-page hover:text-text-primary xl:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <label className="order-3 flex w-full min-w-0 items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3 py-2.5 focus-within:border-primary sm:order-none sm:w-auto sm:flex-1 sm:max-w-md xl:max-w-[360px]">
        <Search className="h-[18px] w-[18px] shrink-0 text-text-secondary" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar contratos, clientes…"
          disabled={!searchEnabled}
          aria-label="Buscar contratos y clientes"
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="text-text-secondary hover:text-text-primary"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>
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
