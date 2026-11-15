import { describe, expect, it } from "vitest";

import type { OfertaRecord } from "@/lib/api/types";
import { alquilerNotasPrecioText, alquilerRequisitosText } from "@/lib/alquileres/oferta-fields";

function oferta(partial: Partial<OfertaRecord>): OfertaRecord {
  return {
    id: 1,
    inmuebleId: 1,
    tipoOperacionId: 2,
    tipoOperacionCode: "rent",
    estadoId: 1,
    estadoCode: "available",
    estadoRedesId: null,
    estadoRedesCode: null,
    montoPrecio: null,
    codigoMoneda: null,
    notasPrecio: null,
    formaPagoId: null,
    formaPagoCode: null,
    condicionesFinanciacion: null,
    activo: true,
    publicadoDesde: null,
    publicadoHasta: null,
    autorizadoPor: null,
    creadoEn: "",
    actualizadoEn: "",
    ...partial,
  };
}

describe("alquilerRequisitosText", () => {
  it("solo usa condiciones_financiacion", () => {
    expect(alquilerRequisitosText(oferta({ condicionesFinanciacion: "Contrato anual" }))).toBe(
      "Contrato anual",
    );
  });

  it("no reinterpreta notas_precio como requisitos", () => {
    expect(
      alquilerRequisitosText(oferta({ notasPrecio: "Precio a definir con el propietario" })),
    ).toBeNull();
  });
});

describe("alquilerNotasPrecioText", () => {
  it("muestra notas aunque no haya requisitos", () => {
    expect(
      alquilerNotasPrecioText(oferta({ notasPrecio: "Precio a definir con el propietario" })),
    ).toBe("Precio a definir con el propietario");
  });
});
