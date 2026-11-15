import { describe, expect, it } from "vitest";

import type { OfertaRecord } from "@/lib/api/types";
import {
  catalogOfertaPrecioDisplay,
  formatCatalogOfertaPrecio,
  parsePrecioPorHectareaFromNotas,
} from "@/lib/ventas/catalog-precio";

function oferta(partial: Partial<OfertaRecord>): OfertaRecord {
  return {
    id: 1,
    inmuebleId: 1,
    tipoOperacionId: 1,
    tipoOperacionCode: "venta",
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

describe("parsePrecioPorHectareaFromNotas", () => {
  it("lee US$ … la ha", () => {
    expect(parsePrecioPorHectareaFromNotas("US$ 800 la ha")).toEqual({
      amount: 800,
      currency: "USD",
    });
  });

  it("toma el último valor del historial en notas", () => {
    expect(
      parsePrecioPorHectareaFromNotas(
        "Precio por hectárea: 140.000 USD (negociable); 60.000 USD/ha 12/01/26.",
      ),
    ).toEqual({ amount: 60_000, currency: "USD" });
  });
});

describe("formatCatalogOfertaPrecio", () => {
  it("prioriza montoPrecio", () => {
    expect(
      formatCatalogOfertaPrecio(oferta({ montoPrecio: "90000", codigoMoneda: "USD" })),
    ).toBe("USD\u00a090.000");
  });

  it("formatea precio por hectárea sin monto", () => {
    expect(
      formatCatalogOfertaPrecio(oferta({ notasPrecio: "2.900 USD la ha" }), {
        tipoInmuebleCode: "hectares",
      }),
    ).toBe("USD\u00a02.900 / ha");
  });

  it("muestra notas cuando no hay monto ni precio unitario", () => {
    expect(
      formatCatalogOfertaPrecio(
        oferta({ notasPrecio: "178.000 / 200.000 USD por las 10 hectáreas" }),
        { tipoInmuebleCode: "hectares" },
      ),
    ).toBe("178.000 / 200.000 USD por las 10 hectáreas");
  });

  it("devuelve Sin precio si no hay datos", () => {
    expect(formatCatalogOfertaPrecio(oferta({}))).toBe("Sin precio");
  });
});

describe("catalogOfertaPrecioDisplay", () => {
  it("usa etiqueta Precio por hectárea", () => {
    expect(
      catalogOfertaPrecioDisplay(oferta({ notasPrecio: "250 USD la hectárea" }), {
        tipoInmuebleCode: "hectares",
      }),
    ).toMatchObject({ label: "Precio por hectárea", isPorHectarea: true });
  });
});
