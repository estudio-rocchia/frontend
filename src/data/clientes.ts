export type ClienteFilterId =
  | "todos"
  | "inquilinos"
  | "propietarios"
  | "juridico"
  | "visas"
  | "morosos";

export type ClienteVinculoId =
  | "inquilino"
  | "propietario"
  | "alquiler"
  | "juridico"
  | "visa"
  | "mora";

export interface ClienteVinculoBadge {
  id: ClienteVinculoId;
  label: string;
}

export interface ClienteRow {
  id: number;
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  vinculos: ClienteVinculoBadge[];
  estado: { label: string; variant: "success" | "warning" | "danger" };
  activo: boolean;
  esInquilino: boolean;
  esPropietario: boolean;
  enMora: boolean;
  porcentajeAdministracion: string | null;
}

export const clienteFilters: { id: ClienteFilterId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "inquilinos", label: "Inquilinos" },
  { id: "propietarios", label: "Propietarios" },
  { id: "juridico", label: "Jurídico" },
  { id: "visas", label: "Visas" },
  { id: "morosos", label: "Morosos" },
];

export const ADMIN_PORCENTAJE_OPTIONS = [6, 9, 12] as const;
