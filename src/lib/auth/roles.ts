import type { AuthUser } from "@/lib/api/types";

export const ADMIN_ROLE = "admin";

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.roles.includes(ADMIN_ROLE) ?? false;
}

export function canManageUsers(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}

/** Reporte de balance: roles admin y staff (permiso reporte.view en backend). */
export function canViewReportes(user: AuthUser | null | undefined): boolean {
  return user?.roles.some((role) => role === ADMIN_ROLE || role === "staff") ?? false;
}
