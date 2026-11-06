import type { CierreReporte } from "@/lib/api/types";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { formatMoney, formatMonthYear } from "@/lib/format";

function cellMontos(m: { ARS: number; USD: number }): [string, string] {
  return [
    m.ARS > 0 ? formatMoney(String(m.ARS), "ARS") : "0",
    m.USD > 0 ? formatMoney(String(m.USD), "USD") : "0",
  ];
}

export function exportCierreCsv(reporte: CierreReporte) {
  const rows: string[][] = [];
  const { desde, hasta } = reporte.periodo;

  rows.push(["Balance — Estudio Rocchia"]);
  rows.push(["Período", `${desde} – ${hasta}`]);
  rows.push([]);

  rows.push(["Ingresos del estudio", "ARS", "USD"]);
  const ing = reporte.ingresosEstudio;
  const ingresosRows: Array<[string, { ARS: number; USD: number }]> = [
    ["Honorarios administración de alquileres", ing.honorariosAdministracion],
    ["Honorarios visas", ing.honorariosVisas],
    ["Honorarios jurídicos", ing.honorariosJuridicos],
    ["Cobros ventas", ing.cobrosVentas],
    ["Mora", ing.mora],
    ["Total", ing.total],
  ];
  for (const [label, montos] of ingresosRows) {
    rows.push([label, ...cellMontos(montos)]);
  }
  rows.push([]);

  rows.push(["Movimientos administrados", "ARS", "USD"]);
  const mov = reporte.movimientosAdministrados;
  for (const [label, montos] of [
    ["Alquileres liquidados", mov.alquileresLiquidados],
    ["Aranceles consulares", mov.arancelesConsulares],
    ["Gastos jurídicos", mov.gastosJuridicos],
  ] as const) {
    rows.push([label, ...cellMontos(montos)]);
  }
  rows.push([]);

  rows.push(["Pendiente a la fecha", "ARS", "USD"]);
  const pen = reporte.pendientes;
  for (const [label, montos] of [
    ["Cuotas alquiler en mora", pen.alquileresEnMora],
    ["Cuotas venta por cobrar", pen.ventasPorCobrar],
    ["Total pendiente", pen.total],
  ] as const) {
    rows.push([label, ...cellMontos(montos)]);
  }
  rows.push([]);

  if (reporte.formaPago.length > 0) {
    rows.push(["Forma de pago", "ARS", "USD"]);
    for (const item of reporte.formaPago) {
      rows.push([item.name, ...cellMontos(item.montos)]);
    }
    rows.push([]);
  }

  if (reporte.porPropietario.length > 0) {
    rows.push(["Por propietario", "Honorarios ARS", "Honorarios USD", "Alquileres ARS", "Alquileres USD"]);
    for (const p of reporte.porPropietario) {
      rows.push([
        p.nombre,
        String(p.honorarios.ARS),
        String(p.honorarios.USD),
        String(p.alquileresLiquidados.ARS),
        String(p.alquileresLiquidados.USD),
      ]);
    }
    rows.push([]);
  }

  const mesAMes = reporte.liquidacionesMesAMes;
  if (mesAMes.porPropietario.length > 0 && mesAMes.meses.length > 0) {
    const monthHeaders = mesAMes.meses.map((mes) => formatMonthYear(mes.anioPeriodo, mes.mesPeriodo));

    for (const currency of ["ARS", "USD"] as const) {
      rows.push([`Alquileres liquidados mes a mes (${currency})`, ...monthHeaders, "Total"]);
      for (const p of mesAMes.porPropietario) {
        const cells = p.alquileresPorMes.map((item) => (item[currency] > 0 ? String(item[currency]) : ""));
        const total = p.alquileresPorMes.reduce((acc, item) => acc + item[currency], 0);
        rows.push([p.nombre, ...cells, total > 0 ? String(total) : ""]);
      }
      const totalCells = mesAMes.totalesAlquileres.map((item) =>
        item[currency] > 0 ? String(item[currency]) : "",
      );
      const grandTotal = mesAMes.totalesAlquileres.reduce((acc, item) => acc + item[currency], 0);
      rows.push(["Total alquileres", ...totalCells, grandTotal > 0 ? String(grandTotal) : ""]);
      rows.push([]);

      rows.push([`Honorarios mes a mes (${currency})`, ...monthHeaders, "Total"]);
      for (const p of mesAMes.porPropietario) {
        const cells = p.honorariosPorMes.map((item) => (item[currency] > 0 ? String(item[currency]) : ""));
        const total = p.honorariosPorMes.reduce((acc, item) => acc + item[currency], 0);
        rows.push([p.nombre, ...cells, total > 0 ? String(total) : ""]);
      }
      const honorTotalCells = mesAMes.totalesHonorarios.map((item) =>
        item[currency] > 0 ? String(item[currency]) : "",
      );
      const honorGrandTotal = mesAMes.totalesHonorarios.reduce((acc, item) => acc + item[currency], 0);
      rows.push(["Total honorarios", ...honorTotalCells, honorGrandTotal > 0 ? String(honorGrandTotal) : ""]);
      rows.push([]);
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(buildCsv(rows), `balance-${desde}_${hasta}-${date}.csv`);
}
