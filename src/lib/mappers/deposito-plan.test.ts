import { describe, expect, it } from "vitest";

import type { MovimientoDepositoRecord } from "@/lib/api/types";
import {
  movimientoDepositoMontoAnterior,
  movimientoDepositoMontoAnteriorFromReason,
} from "@/lib/mappers/deposito-plan";

function movimiento(
  partial: Pick<MovimientoDepositoRecord, "id" | "tipoMovimiento" | "monto" | "reason"> &
    Partial<MovimientoDepositoRecord>,
): MovimientoDepositoRecord {
  return {
    contratoId: 1,
    codigoMoneda: "ARS",
    ocurridoEn: "2026-10-11T12:00:00Z",
    ...partial,
  };
}

describe("movimientoDepositoMontoAnterior", () => {
  it("reads the previous amount from the reason when present", () => {
    const mov = movimiento({
      id: 2,
      tipoMovimiento: "adjusted",
      monto: "708000.00",
      reason:
        "Actualización de depósito por ajuste de alquiler. Depósito anterior: 600000.00. Diferencia a cobrar: 108000.00",
    });

    expect(movimientoDepositoMontoAnteriorFromReason(mov.reason)).toBe("600000.00");
    expect(movimientoDepositoMontoAnterior(mov, [mov])).toBe("600000.00");
  });

  it("derives the previous amount from the difference when the reason omits it", () => {
    const mov = movimiento({
      id: 2,
      tipoMovimiento: "adjusted",
      monto: "708000.00",
      reason: "Actualización de depósito por ajuste de alquiler. Diferencia a cobrar: 108000.00",
    });

    expect(movimientoDepositoMontoAnterior(mov, [mov])).toBe("600000.00");
  });

  it("returns null for the initial constitution", () => {
    const mov = movimiento({
      id: 1,
      tipoMovimiento: "constituted",
      monto: "600000.00",
      reason: null,
    });

    expect(movimientoDepositoMontoAnterior(mov, [mov])).toBeNull();
  });
});
