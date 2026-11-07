import { describe, expect, it } from "vitest";

import { periodForYear, ytdHastaForYear } from "./period";

const REF = new Date(2026, 10, 5);

describe("ytdHastaForYear", () => {
  it("usa hoy para el año en curso", () => {
    expect(ytdHastaForYear(2026, REF)).toBe("2026-11-05");
  });

  it("usa el mismo día/mes del año anterior", () => {
    expect(ytdHastaForYear(2025, REF)).toBe("2025-11-05");
  });
});

describe("periodForYear", () => {
  it("YTD año anterior no cruza al año siguiente", () => {
    const period = periodForYear(2025, false, REF);
    expect(period.desde).toBe("2025-01-01");
    expect(period.hasta).toBe("2025-11-05");
  });

  it("año completo cierra en 31/12", () => {
    expect(periodForYear(2025, true, REF).hasta).toBe("2025-12-31");
  });
});
