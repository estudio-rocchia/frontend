import type { DashboardAlertRow, DashboardAlertTier } from "@/data/dashboard-contracts";
import type { CitaEstado, DashboardResumen } from "@/lib/api/types";
import { citaDurationLabel, citaEstadoLabel, citaTimeLabel } from "@/lib/calendar/labels";
import { formatDateKey } from "@/lib/calendar/month";
import { citaTipoLabel } from "@/lib/calendar/tipos";
import { formatDateDisplay, formatMoney } from "@/lib/format";

const PRIORITY = {
  alquilerMora: 10,
  ventaCuotaVencida: 11,
  ventaEntregaPendiente: 12,
  alquilerCobrar: 20,
  ventaCuotaPorVencer: 21,
  alquilerAjuste: 30,
  ventaSinFinanciacion: 31,
  ventaCobroSinRecibo: 32,
  citaUrgente: 14,
  citaProxima: 22,
  alquilerRenovacion: 40,
} as const;

function alquilerHref(contratoId: number, tab?: "cobranzas"): string {
  return tab ? `/alquileres/${contratoId}?tab=${tab}` : `/alquileres/${contratoId}`;
}

function ventaHref(ventaId: number, tab?: "financiacion" | "cobranzas"): string {
  return tab ? `/ventas/${ventaId}?tab=${tab}` : `/ventas/${ventaId}`;
}

function tierFromPriority(priority: number): DashboardAlertTier {
  if (priority < 20) return "urgente";
  if (priority < 30) return "proximo";
  return "admin";
}

function citaProximaTitle(item: DashboardResumen["citasProximas"][number]): string {
  if (item.titulo?.trim()) return item.titulo.trim();
  if (item.inmuebleTitle?.trim()) return item.inmuebleTitle.trim();
  if (item.inmuebleCode) return item.inmuebleCode;
  return citaTipoLabel(item.tipo);
}

function citaProximaParty(item: DashboardResumen["citasProximas"][number]): string {
  if (item.visitanteNombre?.trim()) return item.visitanteNombre.trim();
  if (item.personaNombre?.trim()) return item.personaNombre.trim();
  if (item.asignadoUsername) return item.asignadoUsername;
  return "Sin asignar";
}

function citaProximaRelative(minutosHasta: number): string {
  if (minutosHasta < 60) {
    return `en ${minutosHasta} min`;
  }
  const horas = Math.floor(minutosHasta / 60);
  const mins = minutosHasta % 60;
  if (horas < 24) {
    return mins > 0 ? `en ${horas} h ${mins} min` : `en ${horas} h`;
  }
  const dias = Math.floor(horas / 24);
  const horasRestantes = horas % 24;
  return horasRestantes > 0 ? `en ${dias} día${dias === 1 ? "" : "s"} ${horasRestantes} h` : `en ${dias} día${dias === 1 ? "" : "s"}`;
}

function citaEstadoBadgeVariant(estado: CitaEstado): "success" | "warning" | "danger" {
  if (estado === "confirmada") return "success";
  if (estado === "cancelada") return "danger";
  return "warning";
}

function emptyVentas(resumen: DashboardResumen): DashboardResumen["ventas"] {
  return resumen.ventas ?? {
    tarjetas: {
      cuotaVencida: { count: 0 },
      cuotaPorVencer: { count: 0 },
      entregaPendiente: { count: 0 },
      sinFinanciacion: { count: 0 },
      cobroSinRecibo: { count: 0 },
    },
    cuotaVencida: [],
    cuotaPorVencer: [],
    entregaPendiente: [],
    sinFinanciacion: [],
    cobroSinRecibo: [],
  };
}

export function mapDashboardKpis(resumen: DashboardResumen) {
  const { tarjetas } = resumen;
  const cobrarHint =
    tarjetas.cobrarEsteMes.montoTotal && tarjetas.cobrarEsteMes.codigoMoneda
      ? formatMoney(tarjetas.cobrarEsteMes.montoTotal, tarjetas.cobrarEsteMes.codigoMoneda)
      : "Saldo del mes";
  const moraHint =
    tarjetas.enMora.montoTotal && tarjetas.enMora.codigoMoneda
      ? formatMoney(tarjetas.enMora.montoTotal, tarjetas.enMora.codigoMoneda)
      : "Saldo en mora";

  return [
    { label: "Alquileres en mora", value: String(tarjetas.enMora.count), hint: moraHint },
    { label: "Alquileres a cobrar", value: String(tarjetas.cobrarEsteMes.count), hint: cobrarHint },
    { label: "Ajustes pendientes", value: String(tarjetas.ajustePendiente.count), hint: "Índice ICL / IPC / CAC" },
    { label: "Renovaciones", value: String(tarjetas.renovacionProxima.count), hint: "Vencen en 20–30 días" },
  ];
}

export function mapDashboardVentasKpis(resumen: DashboardResumen) {
  const ventas = emptyVentas(resumen);
  const { tarjetas } = ventas;
  const vencidaHint =
    tarjetas.cuotaVencida.montoTotal && tarjetas.cuotaVencida.codigoMoneda
      ? formatMoney(tarjetas.cuotaVencida.montoTotal, tarjetas.cuotaVencida.codigoMoneda)
      : "Saldo vencido";
  const porVencerHint =
    tarjetas.cuotaPorVencer.montoTotal && tarjetas.cuotaPorVencer.codigoMoneda
      ? formatMoney(tarjetas.cuotaPorVencer.montoTotal, tarjetas.cuotaPorVencer.codigoMoneda)
      : "Próximos 7 días";

  return [
    { label: "Cuotas vencidas", value: String(tarjetas.cuotaVencida.count), hint: vencidaHint },
    { label: "Cuotas por vencer", value: String(tarjetas.cuotaPorVencer.count), hint: porVencerHint },
    { label: "Entregas pendientes", value: String(tarjetas.entregaPendiente.count), hint: "Sin cobrar al inicio" },
    { label: "Sin financiación", value: String(tarjetas.sinFinanciacion.count), hint: "Ventas sin plan" },
  ];
}

export function mapDashboardAlerts(resumen: DashboardResumen): DashboardAlertRow[] {
  const ventas = emptyVentas(resumen);
  const seenAlquileres = new Set<number>();
  const seenVentasEntrega = new Set<number>();
  const rows: Array<Omit<DashboardAlertRow, "tier">> = [];

  for (const item of resumen.enMora) {
    seenAlquileres.add(item.contratoId);
    rows.push({
      id: `alquiler-mora-${item.contratoId}-${item.cuotaId}`,
      modulo: "alquiler",
      moduloLabel: "Alquiler",
      href: alquilerHref(item.contratoId, "cobranzas"),
      property: item.inmuebleTitle,
      party: item.inquilinoNombre,
      amount: formatMoney(item.saldoTotal, item.codigoMoneda),
      dueDate: `${formatDateDisplay(item.fechaVencimiento)} · ${item.diasAtraso} día${item.diasAtraso === 1 ? "" : "s"} de atraso`,
      status: { label: "En mora", variant: "danger" },
      action: "Gestionar cobro",
      priority: PRIORITY.alquilerMora,
    });
  }

  for (const item of ventas.cuotaVencida) {
    rows.push({
      id: `venta-mora-${item.ventaId}-${item.cuotaId}`,
      modulo: "venta",
      moduloLabel: "Venta",
      href: ventaHref(item.ventaId, "financiacion"),
      property: item.inmuebleTitle,
      party: item.compradorNombre,
      amount: formatMoney(item.saldoTotal, item.codigoMoneda),
      dueDate: `${formatDateDisplay(item.fechaVencimiento)} · Cuota ${item.cuotaNumero}${item.diasAtraso ? ` · ${item.diasAtraso} día${item.diasAtraso === 1 ? "" : "s"} de atraso` : ""}`,
      status: { label: "Cuota vencida", variant: "danger" },
      action: "Cobrar cuota",
      priority: PRIORITY.ventaCuotaVencida,
    });
  }

  for (const item of ventas.entregaPendiente) {
    seenVentasEntrega.add(item.ventaId);
    rows.push({
      id: `venta-entrega-${item.ventaId}`,
      modulo: "venta",
      moduloLabel: "Venta",
      href: ventaHref(item.ventaId, "financiacion"),
      property: item.inmuebleTitle,
      party: item.compradorNombre,
      amount: formatMoney(item.saldoEntrega, item.codigoMoneda),
      dueDate: `Entrega inicial · faltan ${formatMoney(item.saldoEntrega, item.codigoMoneda)}`,
      status: { label: "Entrega pendiente", variant: "danger" },
      action: "Cobrar entrega",
      priority: PRIORITY.ventaEntregaPendiente,
    });
  }

  for (const item of resumen.cobrarEsteMes) {
    if (seenAlquileres.has(item.contratoId)) continue;
    seenAlquileres.add(item.contratoId);
    rows.push({
      id: `alquiler-cobrar-${item.contratoId}-${item.cuotaId}`,
      modulo: "alquiler",
      moduloLabel: "Alquiler",
      href: alquilerHref(item.contratoId, "cobranzas"),
      property: item.inmuebleTitle,
      party: item.inquilinoNombre,
      amount: formatMoney(item.saldoTotal, item.codigoMoneda),
      dueDate: formatDateDisplay(item.fechaVencimiento),
      status: { label: "A cobrar", variant: "warning" },
      action: "Cobrar",
      priority: PRIORITY.alquilerCobrar,
    });
  }

  for (const item of ventas.cuotaPorVencer) {
    rows.push({
      id: `venta-proximo-${item.ventaId}-${item.cuotaId}`,
      modulo: "venta",
      moduloLabel: "Venta",
      href: ventaHref(item.ventaId, "financiacion"),
      property: item.inmuebleTitle,
      party: item.compradorNombre,
      amount: formatMoney(item.saldoTotal, item.codigoMoneda),
      dueDate: `${formatDateDisplay(item.fechaVencimiento)} · Cuota ${item.cuotaNumero}${item.diasHastaVencimiento !== undefined ? ` · en ${item.diasHastaVencimiento} día${item.diasHastaVencimiento === 1 ? "" : "s"}` : ""}`,
      status: { label: "Cuota por vencer", variant: "warning" },
      action: "Ver cuota",
      priority: PRIORITY.ventaCuotaPorVencer,
    });
  }

  for (const item of resumen.ajustePendiente) {
    if (seenAlquileres.has(item.contratoId)) continue;
    seenAlquileres.add(item.contratoId);
    rows.push({
      id: `alquiler-ajuste-${item.contratoId}`,
      modulo: "alquiler",
      moduloLabel: "Alquiler",
      href: alquilerHref(item.contratoId),
      property: item.inmuebleTitle,
      party: item.inquilinoNombre,
      amount: formatMoney(item.montoAlquiler, item.codigoMoneda),
      dueDate: item.ultimoAjusteEn ? `Último ajuste ${formatDateDisplay(item.ultimoAjusteEn)}` : "Sin ajuste registrado",
      status: { label: "Ajuste pendiente", variant: "warning" },
      action: "Ajustar",
      priority: PRIORITY.alquilerAjuste,
    });
  }

  for (const item of ventas.sinFinanciacion) {
    rows.push({
      id: `venta-sin-plan-${item.ventaId}`,
      modulo: "venta",
      moduloLabel: "Venta",
      href: ventaHref(item.ventaId),
      property: item.inmuebleTitle,
      party: item.compradorNombre,
      amount: formatMoney(item.montoPrecioVenta, item.codigoMoneda),
      dueDate: "Sin plan de cuotas configurado",
      status: { label: "Sin financiación", variant: "warning" },
      action: "Configurar plan",
      priority: PRIORITY.ventaSinFinanciacion,
    });
  }

  for (const item of ventas.cobroSinRecibo) {
    rows.push({
      id: `venta-recibo-${item.pagoId}`,
      modulo: "venta",
      moduloLabel: "Venta",
      href: ventaHref(item.ventaId, "cobranzas"),
      property: item.inmuebleTitle,
      party: item.compradorNombre,
      amount: formatMoney(item.monto, item.codigoMoneda),
      dueDate: `Cobro del ${formatDateDisplay(item.fechaPago)}`,
      status: { label: "Sin recibo", variant: "warning" },
      action: "Emitir recibo",
      priority: PRIORITY.ventaCobroSinRecibo,
    });
  }

  for (const item of resumen.renovacionProxima) {
    if (seenAlquileres.has(item.contratoId)) continue;
    seenAlquileres.add(item.contratoId);
    rows.push({
      id: `alquiler-renovacion-${item.contratoId}`,
      modulo: "alquiler",
      moduloLabel: "Alquiler",
      href: alquilerHref(item.contratoId),
      property: item.inmuebleTitle,
      party: item.inquilinoNombre,
      amount: formatMoney(item.montoAlquiler, item.codigoMoneda),
      dueDate: `${formatDateDisplay(item.fechaFin)} · en ${item.diasHastaVencimiento} días`,
      status: { label: "Renovación", variant: "warning" },
      action: "Revisar contrato",
      priority: PRIORITY.alquilerRenovacion,
    });
  }

  for (const item of resumen.citasProximas ?? []) {
    const programada = new Date(item.programadaEn);
    const fecha = programada.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const priority = item.minutosHasta <= 24 * 60 ? PRIORITY.citaUrgente : PRIORITY.citaProxima;
    rows.push({
      id: `cita-proxima-${item.citaId}`,
      modulo: "calendario",
      moduloLabel: "Calendario",
      href: `/calendario?fecha=${formatDateKey(new Date(item.programadaEn))}`,
      property: citaProximaTitle(item),
      party: citaProximaParty(item),
      amount: citaTimeLabel(item.programadaEn),
      dueDate: `${fecha} ${citaTimeLabel(item.programadaEn)} · ${citaProximaRelative(item.minutosHasta)} · ${citaDurationLabel(item.duracionMinutos)}`,
      status: { label: citaEstadoLabel(item.estado), variant: citaEstadoBadgeVariant(item.estado) },
      action: "Ver cita",
      priority,
    });
  }

  return rows
    .map((row) => ({ ...row, tier: tierFromPriority(row.priority) }))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 30);
}

export function filterUnreadAlerts(rows: DashboardAlertRow[], readIds: ReadonlySet<string>): DashboardAlertRow[] {
  return rows.filter((row) => !readIds.has(row.id));
}

export function countAlertsByTier(rows: DashboardAlertRow[]) {
  return {
    urgente: rows.filter((row) => row.tier === "urgente").length,
    proximo: rows.filter((row) => row.tier === "proximo").length,
    admin: rows.filter((row) => row.tier === "admin").length,
  };
}

export function mapDashboardContracts(resumen: DashboardResumen): DashboardAlertRow[] {
  return mapDashboardAlerts(resumen);
}

export function countDashboardUrgentes(resumen: DashboardResumen): number {
  const ventas = emptyVentas(resumen);
  return (
    resumen.tarjetas.enMora.count +
    resumen.tarjetas.cobrarEsteMes.count +
    ventas.tarjetas.cuotaVencida.count +
    ventas.tarjetas.entregaPendiente.count
  );
}
