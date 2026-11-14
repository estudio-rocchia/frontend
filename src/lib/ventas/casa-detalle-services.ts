import type { DetalleInmuebleRecord } from "@/lib/api/types";

export type CasaDetalleServiceFlags = {
  tieneLiving: boolean;
  tieneComedor: boolean;
  tieneCocina: boolean;
  plantaAlta: boolean;
  dormitorioSuite: boolean;
  tieneQuincho: boolean;
  tieneLavadero: boolean;
  tienePatioSeco: boolean;
  tienePatioVerde: boolean;
  tieneGaleria: boolean;
  tieneLocalComercial: boolean;
};

const CASA_SERVICE_KEYS = [
  "tieneLiving",
  "tieneComedor",
  "tieneCocina",
  "plantaAlta",
  "dormitorioSuite",
  "tieneQuincho",
  "tieneLavadero",
  "tienePatioSeco",
  "tienePatioVerde",
  "tieneGaleria",
  "tieneLocalComercial",
] as const satisfies ReadonlyArray<keyof CasaDetalleServiceFlags>;

const PARCELA_MEDIDAS_TIPOS = new Set(["lot", "salon", "commercial", "warehouse"]);

export function showsParcelaMedidas(tipoInmuebleCode: string | null | undefined): boolean {
  return (
    (tipoInmuebleCode != null && PARCELA_MEDIDAS_TIPOS.has(tipoInmuebleCode)) ||
    showsResidentialParcelaMedidas(tipoInmuebleCode)
  );
}

export function showsDuplexDetalleForm(tipoInmuebleCode: string | null | undefined): boolean {
  return tipoInmuebleCode === "duplex";
}

export function showsCasaDetalleAmenities(tipoInmuebleCode: string | null | undefined): boolean {
  return tipoInmuebleCode === "house";
}

function showsResidentialParcelaMedidas(tipoInmuebleCode: string | null | undefined): boolean {
  return (
    tipoInmuebleCode === "house" ||
    tipoInmuebleCode === "duplex" ||
    tipoInmuebleCode === "apartment"
  );
}

function flag(services: Record<string, unknown> | undefined, key: keyof CasaDetalleServiceFlags): boolean {
  return services?.[key] === true;
}

export function readCasaDetalleServices(
  services: Record<string, unknown> | undefined,
): CasaDetalleServiceFlags {
  return {
    tieneLiving: flag(services, "tieneLiving"),
    tieneComedor: flag(services, "tieneComedor"),
    tieneCocina: flag(services, "tieneCocina"),
    plantaAlta: flag(services, "plantaAlta"),
    dormitorioSuite: flag(services, "dormitorioSuite"),
    tieneQuincho: flag(services, "tieneQuincho"),
    tieneLavadero: flag(services, "tieneLavadero"),
    tienePatioSeco: flag(services, "tienePatioSeco"),
    tienePatioVerde: flag(services, "tienePatioVerde"),
    tieneGaleria: flag(services, "tieneGaleria"),
    tieneLocalComercial: flag(services, "tieneLocalComercial"),
  };
}

export function writeCasaDetalleServices(
  base: Record<string, unknown> | undefined,
  flags: CasaDetalleServiceFlags,
): Record<string, unknown> {
  const next = { ...(base ?? {}) };
  for (const key of CASA_SERVICE_KEYS) {
    if (flags[key]) {
      next[key] = true;
    } else {
      delete next[key];
    }
  }
  return next;
}

export function formatCasaDetalleSummaryParts(
  detalle: DetalleInmuebleRecord | null | undefined,
): string[] {
  if (!detalle) return [];
  const services = detalle.services;
  const parts: string[] = [];

  if (flag(services, "tieneLiving")) parts.push("Living");
  if (flag(services, "tieneComedor")) parts.push("Comedor");
  if (flag(services, "tieneCocina")) parts.push("Cocina");
  if (flag(services, "plantaAlta")) {
    parts.push("PB + PA");
  }
  if (flag(services, "dormitorioSuite")) parts.push("Suite");
  if (detalle.tieneDeposito) parts.push("Depósito");
  if (flag(services, "tieneQuincho")) parts.push("Quincho");
  if (flag(services, "tieneLavadero")) parts.push("Lavadero");
  if (flag(services, "tienePatioSeco")) parts.push("Patio seco");
  if (flag(services, "tienePatioVerde")) parts.push("Patio verde");
  if (flag(services, "tieneGaleria")) parts.push("Galería");
  if (flag(services, "tieneLocalComercial")) parts.push("Local comercial");

  return parts;
}
