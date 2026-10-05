"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useSearch } from "@/context/search-context";
import { ButtonOutline } from "@/components/ui/Button";

export function Topbar() {
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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-card px-6">
      <label className="flex w-[360px] max-w-full items-center gap-2.5 rounded-sm border border-border bg-bg-page px-3.5 py-2.5 focus-within:border-primary">
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-text-secondary hover:text-text-primary"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 rounded-full bg-primary-soft py-1.5 pl-1.5 pr-3">
          <div className="h-7 w-7 shrink-0 rounded-full bg-accent-sky" aria-hidden />
          <span className="text-[13px] font-semibold text-text-primary">{displayName}</span>
        </div>
        <ButtonOutline type="button" onClick={logout} className="py-2 text-xs">
          Salir
        </ButtonOutline>
      </div>
    </header>
  );
}
