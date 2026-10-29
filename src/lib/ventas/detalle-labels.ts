import type { DetalleInmuebleRecord } from "@/lib/api/types";
import {
  getTipoDetalleProfile,
  type DetalleEditorField,
} from "@/lib/ventas/detalle-por-tipo";

function formatFieldPart(field: DetalleEditorField, detalle: DetalleInmuebleRecord): string | null {
  switch (field) {
    case "bedrooms":
      return detalle.bedrooms != null ? `${detalle.bedrooms} dorm.` : null;
    case "bathrooms":
      return detalle.bathrooms != null
        ? `${detalle.bathrooms} baño${detalle.bathrooms === 1 ? "" : "s"}`
        : null;
    case "rooms":
      return detalle.rooms != null ? `${detalle.rooms} amb.` : null;
    case "superficieCubiertaM2":
      return detalle.superficieCubiertaM2 ? `${detalle.superficieCubiertaM2} m² cub.` : null;
    case "tieneCochera":
      if (!detalle.tieneCochera) return null;
      return detalle.lugaresCochera ? `${detalle.lugaresCochera} coch.` : "Cochera";
    case "lugaresCochera":
      return null;
    case "tienePileta":
      return detalle.tienePileta ? "Pileta" : null;
    case "tieneParrilla":
      return detalle.tieneParrilla ? "Parrilla" : null;
    case "tieneDeposito":
      return detalle.tieneDeposito ? "Depósito" : null;
    case "observacion":
      return null;
    default:
      return null;
  }
}

export function formatDetalleSummary(
  detalle: DetalleInmuebleRecord | null | undefined,
  tipoInmuebleCode?: string | null,
): string | null {
  if (!detalle) return null;
  const profile = getTipoDetalleProfile(tipoInmuebleCode);
  const parts = profile.summaryFields
    .map((field) => formatFieldPart(field, detalle))
    .filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}
