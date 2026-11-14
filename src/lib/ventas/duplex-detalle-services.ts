import type { DetalleInmuebleRecord } from "@/lib/api/types";
import { formatMeasurementDisplay, formatMeasurementInput } from "@/lib/format";

export type CoberturaCocheraDuplex = "cubierta" | "semicubierta" | "descubierta";

export type DuplexDetalleFlags = {
  tieneParrilla: boolean;
  tieneQuincho: boolean;
  tieneLavadero: boolean;
};

export type DuplexDetalleFormValue = DuplexDetalleServices & {
  superficieCubiertaM2: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  tieneCochera: boolean;
  lugaresCochera: string;
};

export type DuplexDetalleServices = DuplexDetalleFlags & {
  superficieSemicubiertaM2?: string;
  superficieDescubiertaM2?: string;
  cantidadPlantas?: number;
  detallePlantaBaja?: string;
  detallePlantaAlta?: string;
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

function readFlag(services: Record<string, unknown> | undefined, key: keyof DuplexDetalleFlags): boolean {
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

export function buildDuplexDetalleFormValue(
  detalle: DetalleInmuebleRecord | null | undefined,
): DuplexDetalleFormValue {
  const services = readDuplexDetalleServices(detalle?.services);
  const instalaciones = mergeExterioresInstalaciones(services);
  return {
    ...services,
    patioJardin: undefined,
    accesoCochera: undefined,
    lavaderoUbicacion: undefined,
    instalaciones: instalaciones || undefined,
    superficieCubiertaM2: formatMeasurementInput(detalle?.superficieCubiertaM2),
    rooms: detalle?.rooms != null ? String(detalle.rooms) : "",
    bedrooms: detalle?.bedrooms != null ? String(detalle.bedrooms) : "",
    bathrooms: detalle?.bathrooms != null ? String(detalle.bathrooms) : "",
    tieneCochera: detalle?.tieneCochera ?? false,
    lugaresCochera: detalle?.lugaresCochera != null ? String(detalle.lugaresCochera) : "",
    cantidadPlantas: services.cantidadPlantas ?? 2,
  };
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
    toilette: readNumber(services, "toilette") ?? undefined,
    tipoCoberturaCochera: cobertura,
    accesoCochera: readString(services, "accesoCochera"),
    patioJardin: readString(services, "patioJardin"),
    lavaderoUbicacion: readString(services, "lavaderoUbicacion"),
    instalaciones: readString(services, "instalaciones"),
    tieneParrilla: readFlag(services, "tieneParrilla"),
    tieneQuincho: readFlag(services, "tieneQuincho"),
    tieneLavadero: readFlag(services, "tieneLavadero"),
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

  return next;
}

const COBERTURA_LABEL: Record<CoberturaCocheraDuplex, string> = {
  cubierta: "Cochera cubierta",
  semicubierta: "Cochera semicubierta",
  descubierta: "Cochera descubierta",
};

export function formatDuplexDetalleSummaryParts(detalle: DetalleInmuebleRecord | null | undefined): string[] {
  if (!detalle) return [];
  const services = readDuplexDetalleServices(detalle.services);
  const parts: string[] = [];

  if (detalle.rooms != null) parts.push(`${detalle.rooms} amb.`);
  if (detalle.bedrooms != null) parts.push(`${detalle.bedrooms} dorm.`);
  if (detalle.bathrooms != null) parts.push(`${detalle.bathrooms} baño${detalle.bathrooms === 1 ? "" : "s"}`);
  if (services.toilette != null && services.toilette > 0) {
    parts.push(`${services.toilette} toilette`);
  }
  if (services.cantidadPlantas) parts.push(`${services.cantidadPlantas} plantas`);

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

  return parts;
}
