import type { DetalleInmuebleRecord } from "@/lib/api/types";
import { formatMeasurementDisplay } from "@/lib/format";
import {
  formatCasaDetalleSummaryParts,
  showsCasaDetalleAmenities,
  showsDuplexDetalleForm,
} from "@/lib/ventas/casa-detalle-services";
import { formatDuplexDetalleSummaryParts } from "@/lib/ventas/duplex-detalle-services";
import {
  formatDeptoDetalleSummaryParts,
  showsDeptoDetalleAmenities,
} from "@/lib/ventas/depto-detalle-services";
import {
  getTipoDetalleProfile,
  type DetalleEditorField,
} from "@/lib/ventas/detalle-por-tipo";
import { m2ToHectareasAres } from "@/lib/ventas/hectareas";

export function formatSuperficieTotalDisplay(
  superficieTotalM2: string | null | undefined,
  tipoInmuebleCode: string | null | undefined,
): string | null {
  const trimmed = superficieTotalM2?.trim();
  if (!trimmed) return null;
  const m2Display = formatMeasurementDisplay(trimmed);
  if (!m2Display) return null;
  if (tipoInmuebleCode === "hectares") {
    const { ha, ares } = m2ToHectareasAres(trimmed);
    const haDisplay = ha ? formatMeasurementDisplay(ha) : null;
    if (haDisplay) {
      return ares ? `${haDisplay} ha ${ares} a` : `${haDisplay} ha`;
    }
    if (ares) return `${ares} a`;
  }
  return `${m2Display} m²`;
}

export function formatMedidaMetros(value: string | null | undefined): string | null {
  const display = formatMeasurementDisplay(value);
  return display ? `${display} m` : null;
}

/** Texto descriptivo unificado: `description` del inmueble; cae a `observacion` legada del detalle. */
export function hasSuperficieCubierta(
  detalle: { superficieCubiertaM2?: string | null } | null | undefined,
): boolean {
  const raw = detalle?.superficieCubiertaM2?.trim();
  if (!raw) return false;
  const parsed = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0;
}

/** Lote/terreno con construcción (flag en services o m² cubiertos legados). */
export function hasConstruccionEnLote(
  detalle:
    | { superficieCubiertaM2?: string | null; services?: Record<string, unknown> }
    | null
    | undefined,
): boolean {
  if (detalle?.services?.tieneConstruccion === true) return true;
  return hasSuperficieCubierta(detalle);
}

export function formatSuperficieCubiertaDisplay(
  detalle: { superficieCubiertaM2?: string | null } | null | undefined,
): string | null {
  if (!hasSuperficieCubierta(detalle)) return null;
  const display = formatMeasurementDisplay(detalle?.superficieCubiertaM2);
  return display ? `${display} m² cub.` : null;
}

export function resolveCaracteristicasText(
  description: string | null | undefined,
  observacionLegacy: string | null | undefined,
): string | null {
  const desc = description?.trim();
  if (desc) return desc;
  const legacy = observacionLegacy?.trim();
  return legacy || null;
}

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
    case "superficieCubiertaM2": {
      const display = formatMeasurementDisplay(detalle.superficieCubiertaM2);
      return display ? `${display} m² cub.` : null;
    }
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
  if (showsDuplexDetalleForm(tipoInmuebleCode)) {
    parts.push(...formatDuplexDetalleSummaryParts(detalle));
  } else if (showsCasaDetalleAmenities(tipoInmuebleCode)) {
    parts.push(...formatCasaDetalleSummaryParts(detalle));
  }
  if (showsDeptoDetalleAmenities(tipoInmuebleCode)) {
    parts.push(...formatDeptoDetalleSummaryParts(detalle));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
