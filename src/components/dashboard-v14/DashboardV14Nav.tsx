"use client";

import Image from "next/image";
import { Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import rocchiaLogo from "@/assets/rocchia-logo.png";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/dashboard-v14/ThemeToggle";
import { useOpenMobileNav } from "@/context/mobile-nav-context";

export function DashboardV14Nav({
  search,
  onSearch,
}: {
  search: string;
  onSearch: (value: string) => void;
}) {
  const openNav = useOpenMobileNav();

  return (
    <div className="sticky top-1 z-40 -mt-1 mb-0.5">
      <div className="glass-card flex flex-col gap-1.5 px-2 py-1 sm:flex-row sm:items-center sm:gap-2 sm:px-3">
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openNav}
            className="rounded-md p-1 text-text-secondary hover:bg-bg-page xl:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.28 }}
              className="logo-shimmer rounded-full p-px"
            >
              <div className="h-7 w-7 overflow-hidden rounded-full border border-border bg-bg-card">
                <Image src={rocchiaLogo} alt="Rocchia" width={56} height={56} className="h-full w-full object-cover" />
              </div>
            </motion.div>
            <span className="text-[13px] font-bold leading-none text-text-primary">Rocchia</span>
          </Link>
        </span>

        <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:justify-end">
          <label className="relative order-last w-full min-w-0 sm:order-none sm:min-w-[12rem] sm:flex-1 sm:max-w-md">
            <span className="sr-only">Buscar en bandeja</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar inmueble, cliente o módulo..."
              className="h-7 w-full rounded-md border border-border/80 bg-bg-page/80 py-0 pr-3 pl-8 text-[13px] leading-none text-text-primary outline-none placeholder:text-text-secondary focus:border-primary/35 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <ThemeToggle size="compact" />
          <NotificationBell compact />
        </div>
      </div>
    </div>
  );
}
