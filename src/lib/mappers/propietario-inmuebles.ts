import {
  fetchInmueblePropietarios,
  fetchInmuebles,
  fetchPropiedadesAdministradasPorPersona,
  fetchPropietarioPersonaIds,
  fetchContratos,
} from "@/lib/api";
import type { InmuebleRecord, PersonaRecord, PropiedadAdministradaRecord } from "@/lib/api/types";
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
  direccion: string | null;
  propietarioIds: number[];
  propietarios: InmueblePropietarioResumen[];
  propietarioLabel: string;
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
): Promise<PropiedadesPersonaResult> {
  const [propiedadesRes, inmueblesRes] = await Promise.all([
    fetchPropiedadesAdministradasPorPersona(token, personaId),
    fetchInmuebles(token, { limit: 200 }),
  ]);

  const propiedades = propiedadesRes.items;

  return {
    propiedades,
    linkedInmuebleIds: new Set(propiedades.map((propiedad) => propiedad.inmuebleId)),
    inmuebles: inmueblesRes.items,
  };
}

export async function loadInmueblesSinAlquiler(
  token: string,
  personas: PersonaRecord[],
): Promise<InmuebleSinAlquiler[]> {
  const [inmueblesRes, contratosRes] = await Promise.all([
    fetchInmuebles(token, { limit: 200 }),
    fetchContratos(token, { estado: "active", limit: 200 }),
  ]);

  const alquiladosIds = new Set(contratosRes.items.map((contrato) => contrato.inmuebleId));
  const personaById = new Map(personas.map((persona) => [persona.id, persona]));
  const vacantes = inmueblesRes.items.filter((inmueble) => !alquiladosIds.has(inmueble.id));

  const propietariosByInmueble = await Promise.all(
    vacantes.map(async (inmueble) => {
      try {
        const propietariosRes = await fetchInmueblePropietarios(token, inmueble.id);
        return { inmueble, propietarios: propietariosRes.items };
      } catch {
        return { inmueble, propietarios: [] };
      }
    }),
  );

  const results: InmuebleSinAlquiler[] = propietariosByInmueble.map(({ inmueble, propietarios }) => {
    const links = propietarios.map((row) => ({
      propietarioId: row.id,
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
      inmuebleId: inmueble.id,
      code: inmueble.code,
      title: inmueble.title,
      direccion: inmueble.direccion,
      propietarioIds,
      propietarios: links,
      propietarioLabel: propietarioLabel || "Sin propietario asignado",
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
  return {
    titulo: `${propiedad.title} (${propiedad.code})`,
    detalle: direccion ? `${direccion} · Sin alquiler activo` : "En administración · Sin alquiler activo",
    etiqueta: "En administración",
  };
}
