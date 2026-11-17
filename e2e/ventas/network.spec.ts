import { test, expect } from "../fixtures/auth";

test.describe("Ventas — carga de red", () => {
  test("A la venta dispara una búsqueda de catálogo y un resumen liviano de pestañas", async ({
    authedPage,
  }) => {
    const apiCalls: string[] = [];
    authedPage.on("request", (req) => {
      const url = req.url();
      if (!url.includes("/backend/") && !url.includes(":3000/")) return;
      const { pathname, search } = new URL(url);
      if (pathname.startsWith("/_next")) return;
      const apiPath = pathname.replace(/^\/backend/, "");
      apiCalls.push(`${apiPath}${search}`);
    });

    await authedPage.goto("/ventas?tab=a_la_venta");
    await expect(authedPage.getByRole("tab", { name: /A la venta/ })).toBeVisible();
    await expect(authedPage.getByPlaceholder(/Código, calle/i)).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(() => apiCalls.filter((p) => p.includes("/catalogo/buscar")).length, { timeout: 20_000 })
      .toBeLessThanOrEqual(1);

    await expect
      .poll(() => apiCalls.filter((p) => p.includes("/ventas/resumen-pestanas")).length, {
        timeout: 20_000,
      })
      .toBeLessThanOrEqual(1);

    const heavyTabCounts = apiCalls.filter(
      (p) => p.startsWith("/ventas?") && p.includes("limit=") && !p.includes("resumen-pestanas"),
    ).length;
    expect(heavyTabCounts).toBe(0);
  });
});
