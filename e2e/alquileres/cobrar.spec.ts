import { test, expect } from "../fixtures/auth";
import {
  contractRow,
  expectToast,
  openCobrarModalFromList,
  openContratoFicha,
  searchContratos,
} from "../helpers/alquileres";

test.describe("Alquileres — cobrar", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/alquileres");
    await expect(authedPage.getByRole("heading", { name: "Listado de contratos" })).toBeVisible();
  });

  test("no muestra Cobrar en contrato al día (ALQ-EST-01)", async ({ authedPage }) => {
    await searchContratos(authedPage, "ALQ-EST-01");
    await expect(contractRow(authedPage, "ALQ-EST-01").getByRole("button", { name: "Cobrar" })).toHaveCount(
      0,
    );
  });

  test("no muestra Cobrar en ficha de contrato al día", async ({ authedPage }) => {
    await openContratoFicha(authedPage, "ALQ-EST-01");
    await expect(authedPage.getByRole("button", { name: "Cobrar" })).toHaveCount(0);
  });

  test("no muestra Cobrar en contrato por vencer (ALQ-EST-05)", async ({ authedPage }) => {
    await searchContratos(authedPage, "ALQ-EST-05");
    const row = contractRow(authedPage, "ALQ-EST-05");
    await expect(row.getByRole("button", { name: "Cobrar" })).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Renovar" })).toBeVisible();
  });

  test("cobra correctamente el mes pendiente (ALQ-EST-02)", async ({ authedPage }) => {
    await openCobrarModalFromList(authedPage, "ALQ-EST-02");

    const dialog = authedPage.getByRole("dialog");
    await expect(dialog.getByText("Preparando cobro…")).toBeHidden();
    await dialog.getByLabel("Emitir recibo e imprimir PDF").uncheck();

    await Promise.all([
      authedPage.waitForResponse(
        (res) =>
          res.url().includes("/pagos") &&
          res.request().method() === "POST" &&
          res.ok(),
      ),
      dialog.getByRole("button", { name: "Confirmar cobro" }).click(),
    ]);

    await expect(dialog).toBeHidden();
    await expectToast(authedPage, "Cobro registrado.");

    await expect(
      contractRow(authedPage, "ALQ-EST-02").getByRole("button", { name: "Cobrar" }),
    ).toHaveCount(0);
  });
});
