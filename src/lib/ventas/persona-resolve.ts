import type { PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import { resolveTenantPersona } from "@/lib/alquileres/persona-resolve";

export async function resolvePartePersona(token: string, field: PersonaFieldValue) {
  return resolveTenantPersona(token, field);
}
