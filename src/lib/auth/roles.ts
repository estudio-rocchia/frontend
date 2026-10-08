import type { AuthUser } from "@/lib/api/types";

export const ADMIN_ROLE = "admin";

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.roles.includes(ADMIN_ROLE) ?? false;
}

export function canManageUsers(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}
