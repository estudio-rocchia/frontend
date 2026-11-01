import type { ClienteFilterId, ClienteRow, ClienteVinculoBadge } from "@/data/clientes";
import type { PersonaVinculoFilter } from "@/lib/api";
import type { ClientesKpis, InquilinosContext, PersonaRecord, PersonaVinculos } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";

export interface ClientesContext {
  inquilinoIds: Set<number>;
  propietarioIds: Set<number>;
  morosoIds: Set<number>;
}

function formatDocumento(persona: PersonaRecord): string {
  if (persona.numeroDocumento?.trim()) return persona.numeroDocumento.trim();
  if (persona.cuit?.trim()) return persona.cuit.trim();
  return "—";
}

function buildVinculosFromFlags(flags: PersonaVinculos): ClienteVinculoBadge[] {
  const badges: ClienteVinculoBadge[] = [];
  if (flags.inquilino) {
    badges.push({ id: "inquilino", label: "Inquilino" });
  }
  if (flags.propietario) {
    badges.push({ id: "propietario", label: "Propietario" });
    badges.push({ id: "alquiler", label: "Alquiler" });
  }
  if (flags.moroso) {
    badges.push({ id: "mora", label: "Mora" });
  }
  return badges;
}

function buildVinculos(personaId: number, context: ClientesContext): ClienteVinculoBadge[] {
  return buildVinculosFromFlags({
    inquilino: context.inquilinoIds.has(personaId),
    propietario: context.propietarioIds.has(personaId),
    moroso: context.morosoIds.has(personaId),
  });
}

function resolveVinculos(persona: PersonaRecord, context?: ClientesContext): PersonaVinculos {
  if (persona.vinculos) return persona.vinculos;
  if (!context) {
    return { inquilino: false, propietario: false, moroso: false };
  }
  return {
    inquilino: context.inquilinoIds.has(persona.id),
    propietario: context.propietarioIds.has(persona.id),
    moroso: context.morosoIds.has(persona.id),
  };
}

function buildEstado(persona: PersonaRecord, vinculos: PersonaVinculos) {
  if (vinculos.moroso) {
    return { label: "Alerta", variant: "danger" as const };
  }
  if (persona.activo === false) {
    return { label: "Inactivo", variant: "warning" as const };
  }
  return { label: "Activo", variant: "success" as const };
}

export function clienteFilterToVinculo(filter: ClienteFilterId): PersonaVinculoFilter | undefined {
  switch (filter) {
    case "inquilinos":
      return "inquilino";
    case "propietarios":
      return "propietario";
    case "morosos":
      return "moroso";
    default:
      return undefined;
  }
}

export function buildClientesContext(
  inquilinosContext: InquilinosContext,
  propietarioIds: Iterable<number>,
): ClientesContext {
  return {
    inquilinoIds: new Set(inquilinosContext.inquilinoIds),
    propietarioIds: new Set(propietarioIds),
    morosoIds: new Set(inquilinosContext.morosoInquilinoIds),
  };
}

export function mapClientesKpisFromCounts(kpis: ClientesKpis) {
  return [
    {
      label: "Total clientes",
      value: kpis.total.toLocaleString("es-AR"),
      hint: "Registro unificado",
    },
    {
      label: "Con contrato activo",
      value: kpis.inquilinos.toLocaleString("es-AR"),
      hint: "Inmobiliaria",
    },
    {
      label: "Propietarios",
      value: kpis.propietarios.toLocaleString("es-AR"),
      hint: "En administración",
    },
    {
      label: "En mora",
      value: kpis.morosos.toLocaleString("es-AR"),
      hint: "Requieren gestión",
    },
  ];
}

export function mapClientesKpisFromContext(
  totalPersonas: number,
  context: ClientesContext,
) {
  return mapClientesKpisFromCounts({
    total: Number.isFinite(totalPersonas) ? totalPersonas : 0,
    inquilinos: context.inquilinoIds.size,
    propietarios: context.propietarioIds.size,
    morosos: context.morosoIds.size,
  });
}

export function mapPersonaToClienteRow(
  persona: PersonaRecord,
  context?: ClientesContext,
): ClienteRow {
  const vinculos = resolveVinculos(persona, context);

  return {
    id: persona.id,
    nombre: personaDisplayName(persona),
    documento: formatDocumento(persona),
    email: persona.email?.trim() || "—",
    telefono: persona.phone?.trim() || "—",
    vinculos: buildVinculosFromFlags(vinculos),
    estado: buildEstado(persona, vinculos),
    activo: persona.activo ?? true,
    esInquilino: vinculos.inquilino,
    esPropietario: vinculos.propietario,
    enMora: vinculos.moroso,
    porcentajeAdministracion: persona.porcentajeAdministracion ?? null,
  };
}

export function mapClientesKpis(rows: ClienteRow[]) {
  const inquilinos = rows.filter((row) => row.esInquilino).length;
  const propietarios = rows.filter((row) => row.esPropietario).length;
  const morosos = rows.filter((row) => row.enMora).length;

  return [
    {
      label: "Total clientes",
      value: rows.length.toLocaleString("es-AR"),
      hint: "Registro unificado",
    },
    {
      label: "Con contrato activo",
      value: inquilinos.toLocaleString("es-AR"),
      hint: "Inmobiliaria",
    },
    {
      label: "Propietarios",
      value: propietarios.toLocaleString("es-AR"),
      hint: "En administración",
    },
    {
      label: "En mora",
      value: morosos.toLocaleString("es-AR"),
      hint: "Requieren gestión",
    },
  ];
}

export function filterClientes(rows: ClienteRow[], filter: ClienteFilterId): ClienteRow[] {
  switch (filter) {
    case "inquilinos":
      return rows.filter((row) => row.esInquilino);
    case "propietarios":
      return rows.filter((row) => row.esPropietario);
    case "morosos":
      return rows.filter((row) => row.enMora);
    case "juridico":
      return rows;
    case "visas":
      return [];
    default:
      return rows;
  }
}

export function searchClientes(rows: ClienteRow[], query: string): ClienteRow[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;

  return rows.filter((row) => {
    const haystack = [row.nombre, row.documento, row.email, row.telefono].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}

export function vinculoBadgeClass(id: ClienteVinculoBadge["id"]): string {
  switch (id) {
    case "mora":
      return "bg-danger-bg text-danger";
    case "propietario":
    case "alquiler":
      return "bg-primary-soft text-primary";
    case "juridico":
    case "visa":
      return "bg-warning-bg text-warning";
    default:
      return "bg-bg-page text-text-secondary";
  }
}
