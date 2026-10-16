import { test, expect } from "../fixtures/auth";
import { openContratoFicha } from "../helpers/alquileres";

async function openMixContractCobranzas(page: import("@playwright/test").Page) {
  await openContratoFicha(page, "ALQ-MIX-01");
  await page.getByTestId("ficha-tab-cobranzas").click();
}

test.describe("Alquileres — ficha Cobranzas", () => {
  test("muestra tabla de cuotas con columnas esperadas", async ({ authedPage }) => {
    await openMixContractCobranzas(authedPage);

    const cuotasTable = authedPage.getByTestId("cobranzas-cuotas-table");
    await expect(cuotasTable).toBeVisible();
    await expect(cuotasTable.getByRole("columnheader", { name: "Período" })).toBeVisible();
    await expect(cuotasTable.getByRole("columnheader", { name: "Vencimiento" })).toBeVisible();
    await expect(cuotasTable.getByRole("columnheader", { name: "Alquiler actual" })).toBeVisible();
    await expect(cuotasTable.getByRole("columnheader", { name: "Pagado" })).toBeVisible();
    await expect(cuotasTable.getByRole("columnheader", { name: "Por cobrar" })).toBeVisible();
    await expect(cuotasTable.getByRole("columnheader", { name: "Estado" })).toBeVisible();
    await expect(cuotasTable.getByText(/Sep 2026|Oct 2026/).first()).toBeVisible();
  });

  test("historial de pagos detalla el cobro mixto (alquiler + mora + agua + depósito)", async ({
    authedPage,
  }) => {
    await openMixContractCobranzas(authedPage);
    await authedPage.getByTestId("cobranzas-subtab-pagos").click();

    const pagosTable = authedPage.getByTestId("cobranzas-pagos-table");
    await expect(pagosTable).toBeVisible();
    await expect(authedPage.getByRole("heading", { name: "Historial de pagos" })).toBeVisible();

    const mixedRow = pagosTable.locator("tbody tr").filter({ hasText: "PAGO-MIXTO-DEMO" });
    await expect(mixedRow).toBeVisible();
    await expect(mixedRow.getByText(/Alquiler —/i)).toBeVisible();
    await expect(mixedRow.getByText("Intereses por mora")).toBeVisible();
    await expect(mixedRow.getByText(/Agua —/i)).toBeVisible();
    await expect(mixedRow.getByText(/Actualización depósito — cuota 1\/3/i)).toBeVisible();
    await expect(mixedRow.getByRole("button", { name: "PDF" })).toBeVisible();
  });

  test("pestaña Resumen sigue accesible desde Cobranzas", async ({ authedPage }) => {
    await openMixContractCobranzas(authedPage);
    await authedPage.getByTestId("ficha-tab-resumen").click();
    await expect(authedPage.getByText("Identificación")).toBeVisible();
    await expect(authedPage.getByText("Código de propiedad")).toBeVisible();
  });
});
