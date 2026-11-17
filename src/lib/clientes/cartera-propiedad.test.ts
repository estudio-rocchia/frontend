import { describe, expect, it } from "vitest";

import type { PropiedadAdministradaRecord } from "@/lib/api/types";
import { honorariosPanelActivo } from "@/lib/clientes/cartera-propiedad";

function propiedad(
  partial: Partial<PropiedadAdministradaRecord> & Pick<PropiedadAdministradaRecord, "inmuebleId">,
): PropiedadAdministradaRecord {
  return {
    propietarioId: partial.propietarioId ?? partial.inmuebleId,
    code: partial.code ?? "K01",
    title: partial.title ?? "Casa demo",
    porcentajeAdministracion: "6",
    direccion: null,
    ofertaVenta: null,
    ofertaAlquiler: null,
    contratoActivo: null,
    honorariosAplicables: partial.honorariosAplicables ?? false,
    ...partial,
  };
}

describe("honorariosPanelActivo", () => {
  it("is active when the selected property is rented", () => {
    const selected = propiedad({
      inmuebleId: 1,
      contratoActivo: { id: 1, montoAlquiler: "500000", codigoMoneda: "ARS", contratoCode: "ALQ-1" },
    });
    expect(honorariosPanelActivo(selected, 2)).toBe(true);
  });

  it("is active when the selected property is listed for rent", () => {
    const selected = propiedad({
      inmuebleId: 2,
      ofertaAlquiler: { estadoCode: "available", montoPrecio: "400000", codigoMoneda: "ARS" },
    });
    expect(honorariosPanelActivo(selected, 1)).toBe(true);
  });

  it("stays blurred for sale-only properties even with rental items in the portfolio", () => {
    const selected = propiedad({
      inmuebleId: 3,
      ofertaVenta: { estadoCode: "available", montoPrecio: "80000", codigoMoneda: "USD" },
    });
    expect(honorariosPanelActivo(selected, 3)).toBe(false);
  });

  it("is inactive without a selection", () => {
    expect(honorariosPanelActivo(null, 2)).toBe(false);
  });
});
