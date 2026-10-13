import type { ClienteFilterId, ClienteRow, ClienteVinculoBadge } from "@/data/clientes";
import type { PersonaVinculoFilter } from "@/lib/api";
import type { InquilinosContext, PersonaRecord } from "@/lib/api/types";
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

function buildVinculos(personaId: number, context: ClientesContext): ClienteVinculoBadge[] {
  const badges: ClienteVinculoBadge[] = [];
  if (context.inquilinoIds.has(personaId)) {
    badges.push({ id: "inquilino", label: "Inquilino" });
  }
  if (context.propietarioIds.has(personaId)) {
    badges.push({ id: "propietario", label: "Propietario" });
    badges.push({ id: "alquiler", label: "Alquiler" });
  }
  if (context.morosoIds.has(personaId)) {
    badges.push({ id: "mora", label: "Mora" });
  }
  return badges;
}

function buildEstado(persona: PersonaRecord, context: ClientesContext) {
  if (context.morosoIds.has(persona.id)) {
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

export function mapClientesKpisFromContext(
  totalPersonas: number,
  context: ClientesContext,
) {
  const total = Number.isFinite(totalPersonas) ? totalPersonas : 0;
  return [
    {
      label: "Total clientes",
      value: total.toLocaleString("es-AR"),
      hint: "Registro unificado",
    },
    {
      label: "Con contrato activo",
      value: context.inquilinoIds.size.toLocaleString("es-AR"),
      hint: "Inmobiliaria",
    },
    {
      label: "Propietarios",
      value: context.propietarioIds.size.toLocaleString("es-AR"),
      hint: "En administración",
    },
    {
      label: "En mora",
      value: context.morosoIds.size.toLocaleString("es-AR"),
      hint: "Requieren gestión",
    },
  ];
}

export function mapPersonaToClienteRow(persona: PersonaRecord, context: ClientesContext): ClienteRow {
  const esInquilino = context.inquilinoIds.has(persona.id);
  const esPropietario = context.propietarioIds.has(persona.id);
  const enMora = context.morosoIds.has(persona.id);

  return {
    id: persona.id,
    nombre: personaDisplayName(persona),
    documento: formatDocumento(persona),
    email: persona.email?.trim() || "—",
    telefono: persona.phone?.trim() || "—",
    vinculos: buildVinculos(persona.id, context),
    estado: buildEstado(persona, context),
    activo: persona.activo ?? true,
    esInquilino,
    esPropietario,
    enMora,
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
