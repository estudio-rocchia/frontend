import type { ContractRow } from "@/data/dashboard-contracts";
import type { DashboardResumen } from "@/lib/api/types";
import { formatDateDisplay, formatMoney } from "@/lib/format";

function statusFromCode(code: string | undefined): ContractRow["status"] {
  if (code === "late") return { label: "En mora", variant: "danger" };
  if (code === "paid") return { label: "Al día", variant: "success" };
  return { label: "Pendiente", variant: "warning" };
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
    {
      label: "Contratos a cobrar este mes",
      value: String(tarjetas.cobrarEsteMes.count),
      hint: cobrarHint,
    },
    {
      label: "Alquileres en mora post día 10",
      value: String(tarjetas.enMora.count),
      hint: moraHint,
    },
    {
      label: "Contratos con ajuste pendiente",
      value: String(tarjetas.ajustePendiente.count),
      hint: "Índice ICL/IPC/CAC",
    },
    {
      label: "Renovaciones próximas",
      value: String(tarjetas.renovacionProxima.count),
      hint: "Vencen en 20–30 días",
    },
  ];
}

export function mapDashboardContracts(resumen: DashboardResumen): ContractRow[] {
  const rows: ContractRow[] = [];

  for (const item of resumen.enMora) {
    rows.push({
      property: item.inmuebleTitle,
      tenant: item.inquilinoNombre,
      owner: "—",
      amount: formatMoney(item.saldoTotal, item.codigoMoneda),
      index: "—",
      dueDate: formatDateDisplay(item.fechaVencimiento),
      status: { label: "En mora", variant: "danger" },
      action: "Gestionar",
    });
  }

  for (const item of resumen.cobrarEsteMes) {
    if (rows.some((r) => r.property === item.inmuebleTitle && r.tenant === item.inquilinoNombre)) {
      continue;
    }
    rows.push({
      property: item.inmuebleTitle,
      tenant: item.inquilinoNombre,
      owner: "—",
      amount: formatMoney(item.saldoTotal, item.codigoMoneda),
      index: "—",
      dueDate: formatDateDisplay(item.fechaVencimiento),
      status: { label: "A cobrar", variant: "warning" },
      action: "Cobrar",
    });
  }

  for (const item of resumen.renovacionProxima) {
    rows.push({
      property: item.inmuebleTitle,
      tenant: item.inquilinoNombre,
      owner: "—",
      amount: formatMoney(item.montoAlquiler, item.codigoMoneda),
      index: "—",
      dueDate: formatDateDisplay(item.fechaFin),
      status: { label: "Renovación", variant: "warning" },
      action: "Revisar",
    });
  }

  return rows.slice(0, 20);
}
