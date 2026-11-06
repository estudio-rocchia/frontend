import { describe, expect, it } from "vitest";

import { computeYoYDelta, formatYoYPct } from "./yoy";

describe("computeYoYDelta", () => {
  it("shows sin base when previous ARS is zero but current is not", () => {
    const result = computeYoYDelta({ ARS: 1_000, USD: 0 }, { ARS: 0, USD: 0 });
    expect(result.ars.kind).toBe("no-base");
    expect(result.ars.label).toBe("Sin base comparativa");
  });

  it("caps absurd percentages", () => {
    const result = computeYoYDelta({ ARS: 10_000_000, USD: 0 }, { ARS: 1, USD: 0 });
    expect(result.ars.kind).toBe("no-base");
  });

  it("returns none when both periods are zero", () => {
    const result = computeYoYDelta({ ARS: 0, USD: 0 }, { ARS: 0, USD: 0 });
    expect(result.ars.kind).toBe("none");
    expect(result.usd.kind).toBe("none");
  });

  it("formats normal delta", () => {
    const result = computeYoYDelta({ ARS: 110, USD: 50 }, { ARS: 100, USD: 40 });
    expect(result.ars.kind).toBe("delta");
    expect(result.ars.label).toBe(formatYoYPct(10));
    expect(result.usd.label).toBe(formatYoYPct(25));
  });
});
