import type { OwnerFieldValue, PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import { createPersona, fetchPersona } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { parsePersonName } from "@/lib/format";

export async function resolveTenantPersona(
  token: string,
  field: PersonaFieldValue,
): Promise<PersonaRecord> {
  if (field.mode === "existing") {
    return fetchPersona(token, field.personaId);
  }
  const parts = parsePersonName(field.fullName);
  return createPersona(token, {
    tipoPersona: "natural",
    nombre: parts.nombre,
    apellido: parts.apellido,
  });
}

export async function resolveOwnerPersona(
  token: string,
  field: OwnerFieldValue,
): Promise<PersonaRecord> {
  if (field.mode === "existing") {
    return fetchPersona(token, field.personaId);
  }
  const parts = parsePersonName(field.fullName);
  return createPersona(token, {
    tipoPersona: "natural",
    nombre: parts.nombre,
    apellido: parts.apellido,
  });
}

export function ownerPorcentajeAdministracion(field: OwnerFieldValue): number {
  if (field.mode === "new") return field.porcentajeAdministracion;
  return field.porcentajeAdministracion ?? 6;
}

