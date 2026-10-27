import type { OwnerFieldValue, PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import { createPersona, fetchPersona } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";

export async function resolveTenantPersona(
  token: string,
  field: PersonaFieldValue,
): Promise<PersonaRecord> {
  if (field.mode === "existing") {
    return fetchPersona(token, field.personaId);
  }
  return createPersona(token, {
    tipoPersona: "natural",
    nombre: field.nombre.trim() || "Sin nombre",
    apellido: field.apellido.trim() || null,
  });
}

export async function resolveOwnerPersona(
  token: string,
  field: OwnerFieldValue,
): Promise<PersonaRecord> {
  if (field.mode === "existing") {
    return fetchPersona(token, field.personaId);
  }
  return createPersona(token, {
    tipoPersona: "natural",
    nombre: field.nombre.trim() || "Sin nombre",
    apellido: field.apellido.trim() || null,
  });
}

export function ownerPorcentajeAdministracion(field: OwnerFieldValue): number {
  if (field.mode === "new") return field.porcentajeAdministracion;
  return field.porcentajeAdministracion ?? 6;
}
