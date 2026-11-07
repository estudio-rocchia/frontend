import type { ClienteHistorialModulo } from "@/lib/api/types";

export type ClienteHistorialFilter = "todos" | ClienteHistorialModulo;

export const historialFilters: { id: ClienteHistorialFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "alquiler", label: "Alquileres" },
  { id: "venta", label: "Ventas" },
  { id: "juridico", label: "Jurídico" },
  { id: "visa", label: "Visas" },
  { id: "cliente", label: "Cliente" },
];

export const historialModuloLabel: Record<ClienteHistorialModulo, string> = {
  cliente: "Cliente",
  alquiler: "Alquileres",
  venta: "Ventas",
  juridico: "Jurídico",
  visa: "Visas",
};

export function historialModuloBadgeClass(modulo: ClienteHistorialModulo): string {
  switch (modulo) {
    case "alquiler":
      return "bg-primary-soft text-primary";
    case "venta":
      return "bg-success-bg text-success";
    case "juridico":
    case "visa":
      return "bg-warning-bg text-warning";
    default:
      return "bg-bg-page text-text-secondary";
  }
}
