import { describe, expect, it } from "vitest";

import {
  EMPTY_CHARACTERISTIC_FILTERS,
  vendidosFiltersActive,
  vendidosFiltersSearchParams,
} from "@/lib/ventas/characteristic-filters";
import {
  buildVentasListHref,
  parseSoldMoneda,
  parseSoldYear,
  parseVentasListStateFromSearchParams,
} from "@/lib/ventas/ventas-list-state";

describe("vendidosFiltersSearchParams", () => {
  const tipoInmuebleIds = { lot: 3, house: 1 };

  it("arma tipo, moneda y omite criterios vacíos", () => {
    expect(
      vendidosFiltersSearchParams(
        { ...EMPTY_CHARACTERISTIC_FILTERS, tipoInmuebleCode: "lot" },
        tipoInmuebleIds,
        "USD",
      ),
    ).toEqual({ tipoInmuebleId: 3, codigoMoneda: "USD" });
  });

  it("sin filtros activos no envía params", () => {
    expect(vendidosFiltersSearchParams(EMPTY_CHARACTERISTIC_FILTERS, tipoInmuebleIds, null)).toEqual(
      {},
    );
  });

  it("ignora código de tipo desconocido", () => {
    expect(
      vendidosFiltersSearchParams(
        { ...EMPTY_CHARACTERISTIC_FILTERS, tipoInmuebleCode: "unknown" },
        tipoInmuebleIds,
        null,
      ),
    ).toEqual({});
  });
});

describe("vendidosFiltersActive", () => {
  it("detecta tipo o moneda activos", () => {
    expect(vendidosFiltersActive(EMPTY_CHARACTERISTIC_FILTERS, null)).toBe(false);
    expect(
      vendidosFiltersActive({ ...EMPTY_CHARACTERISTIC_FILTERS, tipoInmuebleCode: "lot" }, null),
    ).toBe(true);
    expect(vendidosFiltersActive(EMPTY_CHARACTERISTIC_FILTERS, "ARS")).toBe(true);
  });
});

describe("vendidos URL state", () => {
  const params = (values: Record<string, string>) => ({
    get: (key: string) => values[key] ?? null,
  });

  it("parsea año numérico y moneda en mayúsculas", () => {
    expect(parseSoldYear(params({ anio: "2024" }))).toBe(2024);
    expect(parseSoldMoneda(params({ lmon: "usd" }))).toBe("USD");
    expect(parseSoldMoneda(params({ lmon: "ARS" }))).toBe("ARS");
    expect(parseSoldMoneda(params({}))).toBeNull();
  });

  it("buildVentasListHref vendidos solo incluye ltipo, lmon y anio", () => {
    const href = buildVentasListHref(
      "vendidos",
      { ...EMPTY_CHARACTERISTIC_FILTERS, tipoInmuebleCode: "lot" },
      "barrio",
      2023,
      1,
      "ARS",
    );
    const qs = new URLSearchParams(href.split("?")[1] ?? "");
    expect(qs.get("tab")).toBe("vendidos");
    expect(qs.get("ltipo")).toBe("lot");
    expect(qs.get("lmon")).toBe("ARS");
    expect(qs.get("anio")).toBe("2023");
    expect(qs.get("q")).toBe("barrio");
    expect(qs.get("ldorm")).toBeNull();
    expect(qs.get("lpmin")).toBeNull();
  });

  it("round-trip parse conserva filtros de vendidos", () => {
    const parsed = parseVentasListStateFromSearchParams(
      params({
        tab: "vendidos",
        ltipo: "house",
        lmon: "USD",
        anio: "2025",
      }),
    );
    expect(parsed.filters.tipoInmuebleCode).toBe("house");
    expect(parsed.soldMoneda).toBe("USD");
    expect(parsed.soldYear).toBe(2025);
  });
});
