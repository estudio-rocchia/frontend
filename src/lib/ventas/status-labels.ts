import type { VentaEstado } from "@/lib/api/types";

const VENTA_ESTADO_LABELS: Record<VentaEstado, string> = {
  boleto: "Venta en curso",
  deeds_pending: "Pend. escritura",
  completed: "Completada",
  cancelled: "Cancelada",
};

const OFERTA_ESTADO_LABELS: Record<string, string> = {
  available: "Disponible",
  published: "Publicado",
  reserved: "Reservado",
  sold: "Vendido",
  off_market: "Fuera de mercado",
  rented: "Alquilado",
  missing_documentoation: "Falta documentación",
};

export function ventaEstadoLabel(estado: VentaEstado): string {
  return VENTA_ESTADO_LABELS[estado] ?? estado;
}

export function ofertaEstadoLabel(code: string): string {
  return OFERTA_ESTADO_LABELS[code] ?? code;
}

export function ofertaEstadoVariant(
  code: string,
): "success" | "warning" | "danger" {
  if (code === "available" || code === "published" || code === "sold") return "success";
  if (code === "off_market") return "danger";
  return "warning";
}

export function ventaEstadoVariant(
  estado: VentaEstado,
): "success" | "warning" | "danger" {
  if (estado === "completed") return "success";
  if (estado === "cancelled") return "danger";
  return "warning";
}

export function cuotaEstadoLabel(code: string): string {
  switch (code) {
    case "paid":
      return "Pagada";
    case "late":
      return "Vencida";
    case "partial":
      return "Parcial";
    default:
      return "Pendiente";
  }
}

export function reciboEstadoLabel(estado: "issued" | "cancelled"): string {
  return estado === "cancelled" ? "Anulado" : "Emitido";
}

export function reciboEstadoVariant(
  estado: "issued" | "cancelled",
): "success" | "warning" | "danger" {
  if (estado === "cancelled") return "danger";
  return "success";
}
