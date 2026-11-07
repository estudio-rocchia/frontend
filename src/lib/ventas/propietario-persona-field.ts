import type { PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import { propietarioDisplay } from "@/lib/ventas/catalog-helpers";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";

type PropietarioLike = {
  personaId: number;
  persona?: { displayName: string | null } | null;
  nombre?: string | null;
  apellido?: string | null;
  razonSocial?: string | null;
};

/** Primer propietario del inmueble como parte existente (p. ej. vendedor en una venta). */
export function personaFieldFromPropietario(
  propietario: PropietarioLike | null | undefined,
): PersonaFieldValue | null {
  if (!propietario?.personaId || propietario.personaId <= 0) return null;
  const label = propietarioDisplay([propietario]);
  if (label === VENTA_EMPTY_FIELD) return null;
  return { mode: "existing", personaId: propietario.personaId, label };
}
