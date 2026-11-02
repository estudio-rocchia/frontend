import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Handshake,
  KeyRound,
  LayoutDashboard,
  Scale,
  ShieldCheck,
  Stamp,
  TrendingUp,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Operación",
    items: [
      { label: "Inicio", href: "/", icon: LayoutDashboard },
      { label: "Alquileres", href: "/alquileres", icon: KeyRound },
      { label: "Ventas", href: "/ventas", icon: Handshake },
      { label: "Clientes", href: "/clientes", icon: Users },
    ],
  },
  {
    label: "Estudio",
    items: [
      { label: "Jurídico", href: "/juridico", icon: Scale },
      { label: "Visas", href: "/visas", icon: Stamp },
      { label: "Calendario", href: "/calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Índices", href: "/indices", icon: TrendingUp },
      { label: "Usuarios", href: "/usuarios", icon: ShieldCheck, adminOnly: true },
    ],
  },
];

export const mainNav: NavItem[] = navGroups.flatMap((group) => group.items);

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function userInitials(username: string): string {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase() || "?";
}
