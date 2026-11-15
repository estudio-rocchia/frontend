import type { PropiedadAdministradaRecord } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

export type CarteraFiltro =
  | "todas"
  | "alquiladas"
  | "para_alquiler"
  | "en_venta"
  | "alquiler_y_venta";

export type CarteraEstadoBadge = {
  label: string;
  className: string;
};

const LISTADO_ESTADOS = new Set(["available", "off_market"]);

export function tieneListadoAlquiler(propiedad: PropiedadAdministradaRecord): boolean {
  const estado = propiedad.ofertaAlquiler?.estadoCode;
  return estado != null && LISTADO_ESTADOS.has(estado);
}

export function tieneListadoVenta(propiedad: PropiedadAdministradaRecord): boolean {
  const estado = propiedad.ofertaVenta?.estadoCode;
  return estado != null && LISTADO_ESTADOS.has(estado);
}

export function esAlquilado(propiedad: PropiedadAdministradaRecord): boolean {
  return Boolean(propiedad.contratoActivo);
}

export function esVendido(propiedad: PropiedadAdministradaRecord): boolean {
  return propiedad.ofertaVenta?.estadoCode === "sold";
}

export function tieneAlquilerYVenta(propiedad: PropiedadAdministradaRecord): boolean {
  const alquiler = esAlquilado(propiedad) || tieneListadoAlquiler(propiedad);
  return alquiler && tieneListadoVenta(propiedad);
}

export function matchCarteraFiltro(
  propiedad: PropiedadAdministradaRecord,
  filtro: CarteraFiltro,
): boolean {
  switch (filtro) {
    case "todas":
      return true;
    case "alquiladas":
      return esAlquilado(propiedad);
    case "para_alquiler":
      return tieneListadoAlquiler(propiedad) && !esAlquilado(propiedad);
    case "en_venta":
      return tieneListadoVenta(propiedad);
    case "alquiler_y_venta":
      return tieneAlquilerYVenta(propiedad);
    default:
      return true;
  }
}

export function buildCarteraEstadoBadges(
  propiedad: PropiedadAdministradaRecord,
): CarteraEstadoBadge[] {
  const badges: CarteraEstadoBadge[] = [];

  if (esAlquilado(propiedad)) {
    badges.push({
      label: "Alquilado",
      className: "bg-success-bg text-success",
    });
  } else if (tieneListadoAlquiler(propiedad)) {
    badges.push({
      label: "Para alquiler",
      className: "bg-warning-bg text-warning",
    });
  }

  if (tieneListadoVenta(propiedad)) {
    badges.push({
      label: "En venta",
      className: "bg-primary-soft text-primary",
    });
  } else if (esVendido(propiedad)) {
    badges.push({
      label: "Vendido",
      className: "bg-bg-page text-text-secondary",
    });
  }

  if (badges.length === 0) {
    badges.push({
      label: "Sin operación",
      className: "bg-bg-page text-text-secondary",
    });
  }

  return badges;
}

export function carteraOperacionDetalle(propiedad: PropiedadAdministradaRecord): string | null {
  const parts: string[] = [];
  if (propiedad.contratoActivo) {
    parts.push(
      `${formatMoney(propiedad.contratoActivo.montoAlquiler, propiedad.contratoActivo.codigoMoneda)} · contrato activo`,
    );
  } else if (tieneListadoAlquiler(propiedad) && propiedad.ofertaAlquiler?.montoPrecio) {
    parts.push(
      `Alquiler ${formatMoney(propiedad.ofertaAlquiler.montoPrecio, propiedad.ofertaAlquiler.codigoMoneda ?? "ARS")}`,
    );
  }
  if (tieneListadoVenta(propiedad) && propiedad.ofertaVenta?.montoPrecio) {
    parts.push(
      `Venta ${formatMoney(propiedad.ofertaVenta.montoPrecio, propiedad.ofertaVenta.codigoMoneda ?? "USD")}`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function countCarteraPorFiltro(
  propiedades: PropiedadAdministradaRecord[],
): Record<CarteraFiltro, number> {
  return {
    todas: propiedades.length,
    alquiladas: propiedades.filter((p) => esAlquilado(p)).length,
    para_alquiler: propiedades.filter((p) => tieneListadoAlquiler(p) && !esAlquilado(p)).length,
    en_venta: propiedades.filter((p) => tieneListadoVenta(p)).length,
    alquiler_y_venta: propiedades.filter((p) => tieneAlquilerYVenta(p)).length,
  };
}

export function aceptaHonorariosAdministracion(propiedad: PropiedadAdministradaRecord): boolean {
  if (propiedad.honorariosAplicables != null) return propiedad.honorariosAplicables;
  return esAlquilado(propiedad) || tieneListadoAlquiler(propiedad);
}

export function countPropiedadesConHonorarios(propiedades: PropiedadAdministradaRecord[]): number {
  return propiedades.filter((p) => aceptaHonorariosAdministracion(p)).length;
}

const FILTROS_HONORARIOS_ACTIVOS: CarteraFiltro[] = [
  "alquiladas",
  "para_alquiler",
  "alquiler_y_venta",
];

export function honorariosPanelActivo(
  filtro: CarteraFiltro,
  conteos: Record<CarteraFiltro, number>,
  propiedadesConHonorarios: number,
): boolean {
  if (propiedadesConHonorarios === 0) return false;
  if (filtro === "en_venta" || filtro === "todas") return false;
  if (FILTROS_HONORARIOS_ACTIVOS.includes(filtro)) {
    return conteos[filtro] > 0;
  }
  return false;
}

