import { test, expect } from "../fixtures/auth";
import { openContratoFicha, searchContratos } from "../helpers/alquileres";

test.describe("Alquileres — listado", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/alquileres");
    await expect(authedPage.getByRole("heading", { name: "Listado de contratos" })).toBeVisible();
  });

  test("muestra la tabla y permite buscar un contrato demo", async ({ authedPage }) => {
    await searchContratos(authedPage, "ALQ-MIX-01");
    await expect(authedPage.getByRole("cell", { name: /D137/ })).toBeVisible();
    await expect(authedPage.getByRole("button", { name: "Ver ficha" })).toHaveCount(0);
  });

  test("filtra por KPI A cobrar y muestra contratos con acción Cobrar", async ({ authedPage }) => {
    await Promise.all([
      authedPage.waitForResponse(
        (res) =>
          res.url().includes("/contratos/table-summary") &&
          res.url().includes("operativa=a_cobrar") &&
          res.ok(),
      ),
      authedPage.getByRole("button", { name: /^A cobrar/ }).click(),
    ]);
    await expect(authedPage.getByRole("button", { name: "Cobrar" }).first()).toBeVisible();
  });

  test("navega a la ficha al elegir el contrato", async ({ authedPage }) => {
    await openContratoFicha(authedPage, "ALQ-MIX-01");
    await expect(authedPage.getByTestId("ficha-tab-cobranzas")).toBeVisible();
  });
});
