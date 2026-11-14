import type { DetalleInmuebleRecord } from "@/lib/api/types";

export type DeptoDetalleServiceFlags = {
  tieneLiving: boolean;
  tieneComedor: boolean;
  dormitorioSuite: boolean;
  tieneBalcon: boolean;
  tieneTerraza: boolean;
  tieneLavadero: boolean;
  tienePatioSeco: boolean;
  tienePatioVerde: boolean;
};

const DEPTO_SERVICE_KEYS = [
  "tieneLiving",
  "tieneComedor",
  "dormitorioSuite",
  "tieneBalcon",
  "tieneTerraza",
  "tieneLavadero",
  "tienePatioSeco",
  "tienePatioVerde",
] as const satisfies ReadonlyArray<keyof DeptoDetalleServiceFlags>;

export function showsDeptoDetalleAmenities(tipoInmuebleCode: string | null | undefined): boolean {
  return tipoInmuebleCode === "apartment" || tipoInmuebleCode === "tower";
}

function flag(
  services: Record<string, unknown> | undefined,
  key: keyof DeptoDetalleServiceFlags,
): boolean {
  return services?.[key] === true;
}

export function readDeptoDetalleServices(
  services: Record<string, unknown> | undefined,
): DeptoDetalleServiceFlags {
  return {
    tieneLiving: flag(services, "tieneLiving"),
    tieneComedor: flag(services, "tieneComedor"),
    dormitorioSuite: flag(services, "dormitorioSuite"),
    tieneBalcon: flag(services, "tieneBalcon"),
    tieneTerraza: flag(services, "tieneTerraza"),
    tieneLavadero: flag(services, "tieneLavadero"),
    tienePatioSeco: flag(services, "tienePatioSeco"),
    tienePatioVerde: flag(services, "tienePatioVerde"),
  };
}

export function writeDeptoDetalleServices(
  base: Record<string, unknown> | undefined,
  flags: DeptoDetalleServiceFlags,
): Record<string, unknown> {
  const next = { ...(base ?? {}) };
  for (const key of DEPTO_SERVICE_KEYS) {
    if (flags[key]) {
      next[key] = true;
    } else {
      delete next[key];
    }
  }
  return next;
}

export function formatDeptoDetalleSummaryParts(
  detalle: DetalleInmuebleRecord | null | undefined,
): string[] {
  if (!detalle) return [];
  const services = detalle.services;
  const parts: string[] = [];

  if (flag(services, "tieneLiving")) parts.push("Living");
  if (flag(services, "tieneComedor")) parts.push("Comedor");
  if (flag(services, "dormitorioSuite")) parts.push("Suite");
  if (flag(services, "tieneBalcon")) parts.push("Balcón");
  if (flag(services, "tieneTerraza")) parts.push("Terraza");
  if (flag(services, "tieneLavadero")) parts.push("Lavadero");
  if (flag(services, "tienePatioSeco")) parts.push("Patio seco");
  if (flag(services, "tienePatioVerde")) parts.push("Patio verde");

  return parts;
}
