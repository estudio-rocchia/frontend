import { addYears } from "@/lib/alquileres/deposito-plan";

/** Primer día del mes (ISO). */
export function firstDayOfMonthIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Opción B (arranque operativo): cobranza desde el mes actual.
 * Las fechas legales del contrato van en notas.
 */
export function defaultOperationalContractDates(asOf = new Date()): {
  fechaInicio: string;
  fechaFin: string;
} {
  const fechaInicio = firstDayOfMonthIso(asOf);
  return { fechaInicio, fechaFin: addYears(fechaInicio, 2) };
}

/** Mes desde el cual se proyectan cuotas (contratos legacy con `cobranzaDesde` en DB). */
export function billingPeriodStartIso(contrato: {
  fechaInicio: string;
  cobranzaDesde?: string | null;
}): string {
  const desde = contrato.cobranzaDesde?.trim();
  if (desde && desde > contrato.fechaInicio) {
    return desde;
  }
  return contrato.fechaInicio;
}
