import { describe, expect, it } from "vitest";

import {
  buildBalanceSearchQuery,
  isValidIsoDate,
  parseBalanceSearchParams,
} from "./balance-preferences";

describe("isValidIsoDate", () => {
  it("acepta fechas ISO válidas", () => {
    expect(isValidIsoDate("2025-01-01")).toBe(true);
    expect(isValidIsoDate("2025-11-05")).toBe(true);
  });

  it("rechaza formatos inválidos", () => {
    expect(isValidIsoDate("2025-13-01")).toBe(false);
    expect(isValidIsoDate("05-11-2025")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });
});

describe("parseBalanceSearchParams", () => {
  it("parsea período y YoY", () => {
    const params = new URLSearchParams("desde=2025-01-01&hasta=2025-06-30&yoy=1");
    expect(parseBalanceSearchParams(params)).toEqual({
      desde: "2025-01-01",
      hasta: "2025-06-30",
      yoy: true,
    });
  });

  it("rechaza rangos invertidos", () => {
    const params = new URLSearchParams("desde=2025-12-31&hasta=2025-01-01");
    expect(parseBalanceSearchParams(params)).toBeNull();
  });
});

describe("buildBalanceSearchQuery", () => {
  it("omite yoy cuando está apagado", () => {
    expect(buildBalanceSearchQuery("2025-01-01", "2025-12-31", false)).toBe(
      "desde=2025-01-01&hasta=2025-12-31",
    );
  });

  it("incluye yoy=1 cuando está activo", () => {
    expect(buildBalanceSearchQuery("2025-01-01", "2025-12-31", true)).toBe(
      "desde=2025-01-01&hasta=2025-12-31&yoy=1",
    );
  });
});
