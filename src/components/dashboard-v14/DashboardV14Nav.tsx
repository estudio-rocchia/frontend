"use client";

import Image from "next/image";
import { Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import rocchiaLogo from "@/assets/rocchia-logo.png";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/dashboard-v14/ThemeToggle";
import { useAuth } from "@/context/auth-context";
import { useOpenMobileNav } from "@/context/mobile-nav-context";
import { ButtonOutline } from "@/components/ui/Button";

export function DashboardV14Nav({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (value: string) => void;
}) {
  const openNav = useOpenMobileNav();
  const { user, logout } = useAuth();
  const displayName = user?.username?.split("@")[0] ?? "Usuario";
  const monogram = (user?.username?.split("@")[0] ?? "US").slice(0, 2).toUpperCase();

  return (
    <div className="sticky top-1 z-40 -mt-1 mb-1">
      <div className="glass-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-3.5">
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={openNav}
            className="rounded-xl p-2 text-text-secondary hover:bg-bg-page xl:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.28 }}
              className="logo-shimmer rounded-full p-0.5"
            >
              <div className="h-9 w-9 overflow-hidden rounded-full border border-border bg-bg-card">
                <Image src={rocchiaLogo} alt="Rocchia" width={72} height={72} className="h-full w-full object-cover" />
              </div>
            </motion.div>
            <span className="text-sm font-bold text-text-primary">Rocchia</span>
          </Link>
        </span>

        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <label className="relative order-last w-full min-w-0 sm:order-none sm:min-w-[12rem] sm:flex-1 sm:max-w-md">
            <span className="sr-only">Buscar en bandeja</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar inmueble, cliente o módulo..."
              className="w-full rounded-xl border border-border/80 bg-bg-page/80 py-2 pr-3 pl-9 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-bg-page/90 py-1 pl-1 pr-2 sm:flex sm:pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-sky text-[11px] font-bold text-text-primary">
              {monogram}
            </div>
            <span className="max-w-[88px] truncate text-[13px] font-semibold text-text-primary md:max-w-none">
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
