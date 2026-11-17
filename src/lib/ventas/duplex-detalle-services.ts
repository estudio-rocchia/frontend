import type { DetalleInmuebleRecord } from "@/lib/api/types";
import { formatMeasurementDisplay, formatMeasurementInput } from "@/lib/format";

export type CoberturaCocheraDuplex = "cubierta" | "semicubierta" | "descubierta";

export type DuplexDetalleFlags = {
  tieneParrilla: boolean;
  tieneQuincho: boolean;
  tieneLavadero: boolean;
};

export type DuplexPiso1Flags = {
  piso1Living: boolean;
  piso1Comedor: boolean;
  piso1Cocina: boolean;
  piso1Patio: boolean;
};

export type DuplexPiso2Flags = {
  piso2Suite: boolean;
  piso2Balcon: boolean;
  piso2BalconSemicubierto: boolean;
};

export type DuplexInstalacionFlags = {
  instalacionSplit: boolean;
  instalacionLavavajillas: boolean;
  tieneTermotanque: boolean;
  aberturasAluminio: boolean;
};

export type DuplexDetalleFormValue = Omit<
  DuplexDetalleServices,
  "piso1Bedrooms" | "piso1Bathrooms" | "piso2Bedrooms" | "piso2Bathrooms"
> & {
  superficieCubiertaM2: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  tieneCochera: boolean;
  lugaresCochera: string;
  piso1Bedrooms: string;
  piso1Bathrooms: string;
  piso2Bedrooms: string;
  piso2Bathrooms: string;
};

function parsePisoCount(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Convierte el formulario a servicios persistibles (conteos por piso como número). */
export function duplexFormToServices(form: DuplexDetalleFormValue): DuplexDetalleServices {
  const synced = syncDuplexFormTotals(form);
  return {
    ...synced,
    piso1Bedrooms: parsePisoCount(form.piso1Bedrooms),
    piso1Bathrooms: parsePisoCount(form.piso1Bathrooms),
    piso2Bedrooms: parsePisoCount(form.piso2Bedrooms),
    piso2Bathrooms: parsePisoCount(form.piso2Bathrooms),
  };
}

export type DuplexDetalleServices = DuplexDetalleFlags &
  DuplexPiso1Flags &
  DuplexPiso2Flags &
  DuplexInstalacionFlags & {
    superficieSemicubiertaM2?: string;
    superficieDescubiertaM2?: string;
    cantidadPlantas?: number;
    /** Texto libre — 1er piso (clave legacy `detallePlantaBaja`). */
    detallePlantaBaja?: string;
    /** Texto libre — 2do piso (clave legacy `detallePlantaAlta`). */
    detallePlantaAlta?: string;
    piso1Bedrooms?: number;
    piso1Bathrooms?: number;
    piso2Bedrooms?: number;
    piso2Bathrooms?: number;
    toilette?: number;
    tipoCoberturaCochera?: CoberturaCocheraDuplex;
    accesoCochera?: string;
    patioJardin?: string;
    lavaderoUbicacion?: string;
    instalaciones?: string;
  };

const FLAG_KEYS = ["tieneParrilla", "tieneQuincho", "tieneLavadero"] as const satisfies ReadonlyArray<
  keyof DuplexDetalleFlags
>;

const PISO1_FLAG_KEYS = ["piso1Living", "piso1Comedor", "piso1Cocina", "piso1Patio"] as const satisfies ReadonlyArray<
  keyof DuplexPiso1Flags
>;

const PISO2_FLAG_KEYS = [
  "piso2Suite",
  "piso2Balcon",
  "piso2BalconSemicubierto",
] as const satisfies ReadonlyArray<keyof DuplexPiso2Flags>;

const INSTALACION_FLAG_KEYS = [
  "instalacionSplit",
  "instalacionLavavajillas",
  "tieneTermotanque",
  "aberturasAluminio",
] as const satisfies ReadonlyArray<keyof DuplexInstalacionFlags>;

function readString(services: Record<string, unknown> | undefined, key: string): string {
  const raw = services?.[key];
  return typeof raw === "string" ? raw : "";
}

function readNumber(services: Record<string, unknown> | undefined, key: string): number | null {
  const raw = services?.[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readFlag(services: Record<string, unknown> | undefined, key: string): boolean {
  return services?.[key] === true;
}

function mergeExterioresInstalaciones(services: DuplexDetalleServices): string {
  const parts = [
    services.patioJardin,
    services.accesoCochera,
    services.lavaderoUbicacion,
    services.instalaciones,
  ].filter((part) => part?.trim());
  return parts.join(" · ");
}

export function sumDuplexPisoTotals(services: Pick<DuplexDetalleServices, "piso1Bedrooms" | "piso1Bathrooms" | "piso2Bedrooms" | "piso2Bathrooms">): {
  bedrooms: number | null;
  bathrooms: number | null;
} {
  const hasPiso =
    services.piso1Bedrooms != null ||
    services.piso2Bedrooms != null ||
    services.piso1Bathrooms != null ||
    services.piso2Bathrooms != null;
  if (!hasPiso) return { bedrooms: null, bathrooms: null };
  const bedrooms = (services.piso1Bedrooms ?? 0) + (services.piso2Bedrooms ?? 0);
  const bathrooms = (services.piso1Bathrooms ?? 0) + (services.piso2Bathrooms ?? 0);
  return { bedrooms: bedrooms > 0 ? bedrooms : null, bathrooms: bathrooms > 0 ? bathrooms : null };
}

export function syncDuplexFormTotals(value: DuplexDetalleFormValue): DuplexDetalleFormValue {
  const piso1Bedrooms = value.piso1Bedrooms.trim() ? Number.parseInt(value.piso1Bedrooms, 10) : null;
  const piso2Bedrooms = value.piso2Bedrooms.trim() ? Number.parseInt(value.piso2Bedrooms, 10) : null;
  const piso1Bathrooms = value.piso1Bathrooms.trim() ? Number.parseInt(value.piso1Bathrooms, 10) : null;
  const piso2Bathrooms = value.piso2Bathrooms.trim() ? Number.parseInt(value.piso2Bathrooms, 10) : null;
  const hasPiso =
    piso1Bedrooms != null ||
    piso2Bedrooms != null ||
    piso1Bathrooms != null ||
    piso2Bathrooms != null;
  if (!hasPiso) return value;
  const bedrooms = (piso1Bedrooms ?? 0) + (piso2Bedrooms ?? 0);
  const bathrooms = (piso1Bathrooms ?? 0) + (piso2Bathrooms ?? 0);
  return {
    ...value,
    bedrooms: bedrooms > 0 ? String(bedrooms) : "",
    bathrooms: bathrooms > 0 ? String(bathrooms) : "",
  };
}

export function buildDuplexDetalleFormValue(
  detalle: DetalleInmuebleRecord | null | undefined,
): DuplexDetalleFormValue {
  const services = readDuplexDetalleServices(detalle?.services);
  const instalaciones = mergeExterioresInstalaciones(services);
  const pisoTotals = sumDuplexPisoTotals(services);
  return syncDuplexFormTotals({
    ...services,
    patioJardin: undefined,
    accesoCochera: undefined,
    lavaderoUbicacion: undefined,
    instalaciones: instalaciones || undefined,
    superficieCubiertaM2: formatMeasurementInput(detalle?.superficieCubiertaM2),
    rooms: detalle?.rooms != null ? String(detalle.rooms) : "",
    bedrooms:
      pisoTotals.bedrooms != null
        ? String(pisoTotals.bedrooms)
        : detalle?.bedrooms != null
          ? String(detalle.bedrooms)
          : "",
    bathrooms:
      pisoTotals.bathrooms != null
        ? String(pisoTotals.bathrooms)
        : detalle?.bathrooms != null
          ? String(detalle.bathrooms)
          : "",
    tieneCochera: detalle?.tieneCochera ?? false,
    lugaresCochera: detalle?.lugaresCochera != null ? String(detalle.lugaresCochera) : "",
    cantidadPlantas: services.cantidadPlantas ?? 2,
    piso1Bedrooms: services.piso1Bedrooms != null ? String(services.piso1Bedrooms) : "",
    piso1Bathrooms: services.piso1Bathrooms != null ? String(services.piso1Bathrooms) : "",
    piso2Bedrooms: services.piso2Bedrooms != null ? String(services.piso2Bedrooms) : "",
    piso2Bathrooms: services.piso2Bathrooms != null ? String(services.piso2Bathrooms) : "",
  });
}

export function readDuplexDetalleServices(
  services: Record<string, unknown> | undefined,
): DuplexDetalleServices {
  const tipoCobertura = readString(services, "tipoCoberturaCochera");
  const cobertura: CoberturaCocheraDuplex | undefined =
    tipoCobertura === "cubierta" || tipoCobertura === "semicubierta" || tipoCobertura === "descubierta"
      ? tipoCobertura
      : undefined;

  return {
    superficieSemicubiertaM2: readString(services, "superficieSemicubiertaM2"),
    superficieDescubiertaM2: readString(services, "superficieDescubiertaM2"),
    cantidadPlantas: readNumber(services, "cantidadPlantas") ?? undefined,
    detallePlantaBaja: readString(services, "detallePlantaBaja"),
    detallePlantaAlta: readString(services, "detallePlantaAlta"),
    piso1Bedrooms: readNumber(services, "piso1Bedrooms") ?? undefined,
    piso1Bathrooms: readNumber(services, "piso1Bathrooms") ?? undefined,
    piso2Bedrooms: readNumber(services, "piso2Bedrooms") ?? undefined,
    piso2Bathrooms: readNumber(services, "piso2Bathrooms") ?? undefined,
    toilette: readNumber(services, "toilette") ?? undefined,
    tipoCoberturaCochera: cobertura,
    accesoCochera: readString(services, "accesoCochera"),
    patioJardin: readString(services, "patioJardin"),
    lavaderoUbicacion: readString(services, "lavaderoUbicacion"),
    instalaciones: readString(services, "instalaciones"),
    tieneParrilla: readFlag(services, "tieneParrilla"),
    tieneQuincho: readFlag(services, "tieneQuincho"),
    tieneLavadero: readFlag(services, "tieneLavadero"),
    piso1Living: readFlag(services, "piso1Living"),
    piso1Comedor: readFlag(services, "piso1Comedor"),
    piso1Cocina: readFlag(services, "piso1Cocina"),
    piso1Patio: readFlag(services, "piso1Patio"),
    piso2Suite: readFlag(services, "piso2Suite"),
    piso2Balcon: readFlag(services, "piso2Balcon"),
    piso2BalconSemicubierto: readFlag(services, "piso2BalconSemicubierto"),
    instalacionSplit: readFlag(services, "instalacionSplit"),
    instalacionLavavajillas: readFlag(services, "instalacionLavavajillas"),
    tieneTermotanque: readFlag(services, "tieneTermotanque"),
    aberturasAluminio: readFlag(services, "aberturasAluminio"),
  };
}

export function writeDuplexDetalleServices(
  base: Record<string, unknown> | undefined,
  data: DuplexDetalleServices,
): Record<string, unknown> {
  const next = { ...(base ?? {}) };

  const setOrDelete = (key: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === "") {
      delete next[key];
      return;
    }
    next[key] = value;
  };

  setOrDelete("superficieSemicubiertaM2", data.superficieSemicubiertaM2?.trim());
  setOrDelete("superficieDescubiertaM2", data.superficieDescubiertaM2?.trim());
  setOrDelete("cantidadPlantas", data.cantidadPlantas);
  setOrDelete("detallePlantaBaja", data.detallePlantaBaja?.trim());
  setOrDelete("detallePlantaAlta", data.detallePlantaAlta?.trim());
  setOrDelete("piso1Bedrooms", data.piso1Bedrooms);
  setOrDelete("piso1Bathrooms", data.piso1Bathrooms);
  setOrDelete("piso2Bedrooms", data.piso2Bedrooms);
  setOrDelete("piso2Bathrooms", data.piso2Bathrooms);
  setOrDelete("toilette", data.toilette);
  setOrDelete("tipoCoberturaCochera", data.tipoCoberturaCochera);
  setOrDelete("instalaciones", data.instalaciones?.trim());
  if (data.instalaciones?.trim()) {
    delete next.accesoCochera;
    delete next.patioJardin;
    delete next.lavaderoUbicacion;
  } else {
    setOrDelete("accesoCochera", data.accesoCochera?.trim());
    setOrDelete("patioJardin", data.patioJardin?.trim());
    setOrDelete("lavaderoUbicacion", data.lavaderoUbicacion?.trim());
  }

  for (const key of FLAG_KEYS) {
    if (data[key]) next[key] = true;
    else delete next[key];
  }
  for (const key of PISO1_FLAG_KEYS) {
    if (data[key]) next[key] = true;
    else delete next[key];
  }
  for (const key of PISO2_FLAG_KEYS) {
    if (data[key]) next[key] = true;
    else delete next[key];
  }
  for (const key of INSTALACION_FLAG_KEYS) {
    if (data[key]) next[key] = true;
    else delete next[key];
  }

  return next;
}

const COBERTURA_LABEL: Record<CoberturaCocheraDuplex, string> = {
  cubierta: "Cochera cubierta",
  semicubierta: "Cochera semicubierta",
  descubierta: "Cochera descubierta",
};

function formatPisoSummary(
  label: string,
  bedrooms?: number,
  bathrooms?: number,
): string | null {
  const parts: string[] = [];
  if (bedrooms != null && bedrooms > 0) parts.push(`${bedrooms} dorm.`);
  if (bathrooms != null && bathrooms > 0) parts.push(`${bathrooms} baño${bathrooms === 1 ? "" : "s"}`);
  if (parts.length === 0) return null;
  return `${label}: ${parts.join(", ")}`;
}

export type DuplexDetalleResumenDisplay = {
  superficieCubierta: string | null;
  superficieSemicubierta: string | null;
  superficieDescubierta: string | null;
  ambientes: string | null;
  dormitorios: string | null;
  banos: string | null;
  equipamiento: string | null;
  piso1Encabezado: string | null;
  piso1Distribucion: string | null;
  detallePiso1: string | null;
  piso2Encabezado: string | null;
  piso2Distribucion: string | null;
  detallePiso2: string | null;
  instalaciones: string | null;
};

function joinChipLabels(items: string[]): string | null {
  return items.length > 0 ? items.join(" · ") : null;
}

function resolveInstalacionesText(services: DuplexDetalleServices): string | null {
  const primary = services.instalaciones?.trim();
  if (primary) return primary;
  const merged = mergeExterioresInstalaciones(services).trim();
  return merged || null;
}

export function buildDuplexDetalleResumenDisplay(
  detalle: DetalleInmuebleRecord | null | undefined,
): DuplexDetalleResumenDisplay | null {
  if (!detalle) return null;
  const services = readDuplexDetalleServices(detalle.services);
  const pisoTotals = sumDuplexPisoTotals(services);

  const equipamiento = joinChipLabels(
    formatDuplexDetalleSummaryParts(detalle).filter(
      (part) =>
        !part.startsWith("1er piso:") &&
        !part.startsWith("2do piso:") &&
        !part.includes(" m² ") &&
        !part.includes(" dorm.") &&
        !part.includes(" baño") &&
        !part.includes(" amb.") &&
        !part.includes(" pisos") &&
        !part.includes("toilette"),
    ),
  );

  return {
    superficieCubierta: formatMeasurementDisplay(detalle.superficieCubiertaM2),
    superficieSemicubierta: formatMeasurementDisplay(services.superficieSemicubiertaM2),
    superficieDescubierta: formatMeasurementDisplay(services.superficieDescubiertaM2),
    ambientes: detalle.rooms != null ? String(detalle.rooms) : null,
    dormitorios:
      pisoTotals.bedrooms != null
        ? String(pisoTotals.bedrooms)
        : detalle.bedrooms != null
          ? String(detalle.bedrooms)
          : null,
    banos:
      pisoTotals.bathrooms != null
        ? String(pisoTotals.bathrooms)
        : detalle.bathrooms != null
          ? String(detalle.bathrooms)
          : null,
    equipamiento,
    piso1Encabezado: formatPisoSummary("1er piso", services.piso1Bedrooms, services.piso1Bathrooms),
    piso1Distribucion: joinChipLabels([
      services.piso1Living ? "Living" : "",
      services.piso1Comedor ? "Comedor" : "",
      services.piso1Cocina ? "Cocina" : "",
      services.piso1Patio ? "Patio" : "",
    ].filter(Boolean)),
    detallePiso1: services.detallePlantaBaja?.trim() || null,
    piso2Encabezado: formatPisoSummary("2do piso", services.piso2Bedrooms, services.piso2Bathrooms),
    piso2Distribucion: joinChipLabels([
      services.piso2Suite ? "Suite" : "",
      services.piso2BalconSemicubierto ? "Balcón semicubierto" : "",
      services.piso2Balcon ? "Balcón" : "",
    ].filter(Boolean)),
    detallePiso2: services.detallePlantaAlta?.trim() || null,
    instalaciones: resolveInstalacionesText(services),
  };
}

export function formatDuplexDetalleSummaryParts(detalle: DetalleInmuebleRecord | null | undefined): string[] {
  if (!detalle) return [];
  const services = readDuplexDetalleServices(detalle.services);
  const parts: string[] = [];

  const piso1 = formatPisoSummary("1er piso", services.piso1Bedrooms, services.piso1Bathrooms);
  const piso2 = formatPisoSummary("2do piso", services.piso2Bedrooms, services.piso2Bathrooms);
  if (piso1) parts.push(piso1);
  if (piso2) parts.push(piso2);

  const pisoTotals = sumDuplexPisoTotals(services);
  if (pisoTotals.bedrooms == null && detalle.bedrooms != null) {
    parts.push(`${detalle.bedrooms} dorm.`);
  }
  if (pisoTotals.bathrooms == null && detalle.bathrooms != null) {
    parts.push(`${detalle.bathrooms} baño${detalle.bathrooms === 1 ? "" : "s"}`);
  }
  if (detalle.rooms != null) parts.push(`${detalle.rooms} amb.`);
  if (services.toilette != null && services.toilette > 0) {
    parts.push(`${services.toilette} toilette`);
  }
  if (services.cantidadPlantas) parts.push(`${services.cantidadPlantas} pisos`);

  const cub = formatMeasurementDisplay(detalle.superficieCubiertaM2);
  if (cub) parts.push(`${cub} m² cub.`);
  const semi = formatMeasurementDisplay(services.superficieSemicubiertaM2);
  if (semi) parts.push(`${semi} m² semi.`);
  const desc = formatMeasurementDisplay(services.superficieDescubiertaM2);
  if (desc) parts.push(`${desc} m² desc.`);

  if (detalle.tieneCochera) {
    parts.push(detalle.lugaresCochera ? `${detalle.lugaresCochera} coch.` : "Cochera");
    if (services.tipoCoberturaCochera) parts.push(COBERTURA_LABEL[services.tipoCoberturaCochera]);
  }
  if (services.tieneParrilla) parts.push("Parrilla");
  if (services.tieneQuincho) parts.push("Quincho");
  if (services.tieneLavadero) parts.push("Lavadero");
  if (services.piso2Suite) parts.push("Suite");
  if (services.piso2BalconSemicubierto) parts.push("Balcón semicubierto");
  else if (services.piso2Balcon) parts.push("Balcón");
  if (services.instalacionSplit) parts.push("Split preparado");
  if (services.instalacionLavavajillas) parts.push("Lavavajillas");
  if (services.tieneTermotanque) parts.push("Termotanque");
  if (services.aberturasAluminio) parts.push("Aberturas aluminio");

  return parts;
}