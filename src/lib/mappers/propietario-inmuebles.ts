import {
  fetchContratos,
  fetchInmueblePropietarios,
  fetchInmuebles,
} from "@/lib/api";
import type { ContratoListItem, InmuebleRecord, PersonaRecord } from "@/lib/api/types";
import { formatMoney, personaDisplayName } from "@/lib/format";

export interface InmuebleSinAlquiler {
  inmuebleId: number;
  code: string;
  title: string;
  direccion: string | null;
  propietarioIds: number[];
  propietarioLabel: string;
}

export interface PropiedadAdministrada {
  inmuebleId: number;
  code: string;
  title: string;
  direccion: string | null;
  contratoActivo: ContratoListItem | null;
}

export interface PropiedadesPersonaResult {
  propiedades: PropiedadAdministrada[];
  linkedInmuebleIds: Set<number>;
  inmuebles: InmuebleRecord[];
}

export async function loadPropiedadesAdministradas(
  token: string,
  personaId: number,
): Promise<PropiedadesPersonaResult> {
  const [inmueblesRes, contratosRes] = await Promise.all([
    fetchInmuebles(token, { limit: 200 }),
    fetchContratos(token, { estado: "active", limit: 200 }),
  ]);

  const propiedades: PropiedadAdministrada[] = [];
  const linkedInmuebleIds = new Set<number>();

  await Promise.all(
    inmueblesRes.items.map(async (inmueble) => {
      try {
        const propietariosRes = await fetchInmueblePropietarios(token, inmueble.id);
        const esPropietario = propietariosRes.items.some((row) => row.personaId === personaId);
        if (!esPropietario) return;

        linkedInmuebleIds.add(inmueble.id);
        propiedades.push({
          inmuebleId: inmueble.id,
          code: inmueble.code,
          title: inmueble.title,
          direccion: inmueble.direccion,
          contratoActivo: contratosRes.items.find((contrato) => contrato.inmuebleId === inmueble.id) ?? null,
        });
      } catch {
        // sin permiso o inmueble sin propietarios
      }
    }),
  );

  propiedades.sort((a, b) => a.code.localeCompare(b.code, "es"));

  return {
    propiedades,
    linkedInmuebleIds,
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
  const results: InmuebleSinAlquiler[] = [];

  await Promise.all(
    inmueblesRes.items
      .filter((inmueble) => !alquiladosIds.has(inmueble.id))
      .map(async (inmueble) => {
        let propietarioIds: number[] = [];
        try {
          const propietariosRes = await fetchInmueblePropietarios(token, inmueble.id);
          propietarioIds = propietariosRes.items.map((row) => row.personaId);
        } catch {
          // sin permiso
        }

        const propietarioLabel = propietarioIds
          .map((personaId) => personaDisplayName(personaById.get(personaId) ?? {}))
          .filter((name) => name !== "—")
          .join(" · ");

        results.push({
          inmuebleId: inmueble.id,
          code: inmueble.code,
          title: inmueble.title,
          direccion: inmueble.direccion,
          propietarioIds,
          propietarioLabel: propietarioLabel || "Sin propietario asignado",
        });
      }),
  );

  results.sort((a, b) => a.code.localeCompare(b.code, "es"));
  return results;
}

export async function loadAllPropietarioPersonaIds(token: string): Promise<number[]> {
  const inmueblesRes = await fetchInmuebles(token, { limit: 200 });
  const ids = new Set<number>();

  await Promise.all(
    inmueblesRes.items.map(async (inmueble) => {
      try {
        const propietariosRes = await fetchInmueblePropietarios(token, inmueble.id);
        for (const row of propietariosRes.items) {
          ids.add(row.personaId);
        }
      } catch {
        // sin permiso
      }
    }),
  );

  return [...ids];
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
