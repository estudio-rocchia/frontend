import {
  fetchInmuebles,
  fetchInmueblesVacantesConPropietarios,
  fetchPropiedadesAdministradasPorPersona,
  fetchPropietarioPersonaIds,
} from "@/lib/api";
import type { InmuebleRecord, PersonaRecord, PropiedadAdministradaRecord } from "@/lib/api/types";
import { buildCarteraEstadoBadges, carteraOperacionDetalle } from "@/lib/clientes/cartera-propiedad";
import { formatMoney, personaDisplayName } from "@/lib/format";

export interface InmueblePropietarioResumen {
  propietarioId: number;
  personaId: number;
  porcentajeAdministracion: string;
}

export interface InmuebleSinAlquiler {
  inmuebleId: number;
  code: string;
  title: string;
  tipoName: string | null;
  localidadName: string | null;
  direccion: string | null;
  propietarioIds: number[];
  propietarios: InmueblePropietarioResumen[];
  propietarioLabel: string;
  tieneOfertaAlquiler: boolean;
  estadoOfertaAlquiler: string | null;
  origen: "cartel" | "administracion";
  enAdministracion: boolean;
  ofertaAlquilerId: number | null;
  estadoRedesId: number | null;
  estadoRedesCode: string | null;
}

export type PropiedadAdministrada = PropiedadAdministradaRecord;

export interface PropiedadesPersonaResult {
  propiedades: PropiedadAdministrada[];
  linkedInmuebleIds: Set<number>;
  inmuebles: InmuebleRecord[];
}

export async function loadPropiedadesAdministradas(
  token: string,
  personaId: number,
  options?: { includeInmueblesCatalog?: boolean },
): Promise<PropiedadesPersonaResult> {
  const propiedadesRes = await fetchPropiedadesAdministradasPorPersona(token, personaId);
  const propiedades = propiedadesRes.items;

  const inmueblesRes = options?.includeInmueblesCatalog
    ? await fetchInmuebles(token, { limit: 200 })
    : { items: [] as InmuebleRecord[] };

  return {
    propiedades,
    linkedInmuebleIds: new Set(propiedades.map((propiedad) => propiedad.inmuebleId)),
    inmuebles: inmueblesRes.items,
  };
}

export async function loadInmueblesCatalog(token: string): Promise<InmuebleRecord[]> {
  const inmueblesRes = await fetchInmuebles(token, { limit: 200 });
  return inmueblesRes.items;
}

export { vacanteComercializacionLabel as vacanteElegibilidadLabel } from "@/lib/alquileres/inmuebles-vacantes";

export async function loadInmueblesSinAlquiler(
  token: string,
  personas: PersonaRecord[],
): Promise<InmuebleSinAlquiler[]> {
  const vacantesRes = await fetchInmueblesVacantesConPropietarios(token);
  const personaById = new Map(personas.map((persona) => [persona.id, persona]));

  const results: InmuebleSinAlquiler[] = vacantesRes.items.map((inmueble) => {
    const links = inmueble.propietarios.map((row) => ({
      propietarioId: row.propietarioId,
      personaId: row.personaId,
      porcentajeAdministracion: row.porcentajeAdministracion,
    }));
    const propietarioIds = links.map((row) => row.personaId);
    const propietarioLabel = propietarioIds
      .map((personaId) => {
        const persona = personaById.get(personaId);
        const name = persona ? personaDisplayName(persona) : null;
        const link = links.find((row) => row.personaId === personaId);
        const pct = link?.porcentajeAdministracion ?? "6";
        const pctLabel = `${Number(pct).toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
        return name ? `${name} (${pctLabel})` : pctLabel;
      })
      .filter((label) => label !== "—")
      .join(" · ");

    return {
      inmuebleId: inmueble.inmuebleId,
      code: inmueble.code,
      title: inmueble.displayLabel ?? inmueble.title ?? inmueble.code,
      tipoName: inmueble.tipoName ?? null,
      localidadName: inmueble.localidadName ?? null,
      direccion: inmueble.direccion,
      propietarioIds,
      propietarios: links,
      propietarioLabel: propietarioLabel || "Sin propietario asignado",
      tieneOfertaAlquiler: inmueble.tieneOfertaAlquiler,
      estadoOfertaAlquiler: inmueble.estadoOfertaAlquiler,
      origen: inmueble.origen,
      enAdministracion: inmueble.enAdministracion,
      ofertaAlquilerId: inmueble.ofertaAlquilerId,
      estadoRedesId: inmueble.estadoRedesId,
      estadoRedesCode: inmueble.estadoRedesCode,
    };
  });

  results.sort((a, b) => a.code.localeCompare(b.code, "es"));
  return results;
}

export async function loadAllPropietarioPersonaIds(token: string): Promise<number[]> {
  const response = await fetchPropietarioPersonaIds(token);
  return response.personaIds;
}

export function propiedadAdministradaLabel(propiedad: PropiedadAdministrada): {
  titulo: string;
  detalle: string;
  etiqueta: string;
} {
  if (propiedad.contratoActivo) {
    return {
      titulo: `${propiedad.title} · Alquiler activo`,
      detalle: `${formatMoney(propiedad.contratoActivo.montoAlquiler, propiedad.contratoActivo.codigoMoneda)} · ${propiedad.contratoActivo.contratoCode ?? propiedad.code}`,
      etiqueta: "En administración con contrato",
    };
  }

  const direccion = propiedad.direccion?.trim();
  const operacion = carteraOperacionDetalle(propiedad);
  const estados = buildCarteraEstadoBadges(propiedad)
    .map((badge) => badge.label)
    .join(" · ");
  const detalleParts = [direccion, operacion, estados].filter(Boolean);
  return {
    titulo: `${propiedad.title} (${propiedad.code})`,
    detalle: detalleParts.length > 0 ? detalleParts.join(" · ") : "Sin operación activa",
    etiqueta: estados,
  };
}
