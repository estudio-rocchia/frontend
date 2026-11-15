import type { PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import {
  isEmptyPersonaField,
  isNewPersonaFieldValid,
} from "@/components/alquileres/PersonaSelectField";
import {
  addInmueblePropietario,
  createPersona,
  removeInmueblePropietario,
} from "@/lib/api";

export async function syncCatalogPropietario(params: {
  token: string;
  inmuebleId: number;
  currentPropietarioId: number | null;
  currentPersonaId: number | null;
  field: PersonaFieldValue;
}): Promise<void> {
  const { token, inmuebleId, currentPropietarioId, currentPersonaId, field } = params;

  if (isEmptyPersonaField(field)) {
    if (currentPropietarioId != null) {
      await removeInmueblePropietario(token, inmuebleId, currentPropietarioId);
    }
    return;
  }

  if (!isNewPersonaFieldValid(field)) {
    throw new Error("Elegí un propietario válido.");
  }

  let targetPersonaId: number;
  if (field.mode === "existing") {
    targetPersonaId = field.personaId;
  } else {
    const persona = await createPersona(token, {
      tipoPersona: "natural",
      nombre: field.nombre.trim() || "Sin nombre",
      apellido: field.apellido.trim() || null,
    });
    targetPersonaId = persona.id;
  }

  if (currentPersonaId === targetPersonaId) return;

  if (currentPropietarioId != null) {
    await removeInmueblePropietario(token, inmuebleId, currentPropietarioId);
  }
  await addInmueblePropietario(token, inmuebleId, { personaId: targetPersonaId });
}
