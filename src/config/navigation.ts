import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  Handshake,
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

export const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Alquileres", href: "/alquileres", icon: KeyRound },
  { label: "Índices", href: "/indices", icon: TrendingUp },
  { label: "Ventas", href: "/ventas", icon: Handshake },
  { label: "Jurídico", href: "/juridico", icon: Scale },
  { label: "Visas", href: "/visas", icon: Stamp },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Usuarios", href: "/usuarios", icon: ShieldCheck, adminOnly: true },
  { label: "Calendario", href: "/calendario", icon: CalendarDays },
];
