import { test, expect } from "../fixtures/auth";
import {
  contractRow,
  expectToast,
  openAjustarModalFromList,
  searchContratos,
} from "../helpers/alquileres";

test.describe("Alquileres — ajustar", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/alquileres");
    await expect(authedPage.getByRole("heading", { name: "Listado de contratos" })).toBeVisible();
  });

  test("no muestra Ajustar en contrato por vencer (ALQ-EST-05)", async ({ authedPage }) => {
    await searchContratos(authedPage, "ALQ-EST-05");
    const row = contractRow(authedPage, "ALQ-EST-05");
    await expect(row.getByRole("button", { name: "Ajustar" })).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Renovar" })).toBeVisible();
  });

  test("no muestra Ajustar en contrato al día sin ajuste pendiente (ALQ-EST-01)", async ({
    authedPage,
  }) => {
    await searchContratos(authedPage, "ALQ-EST-01");
    const row = contractRow(authedPage, "ALQ-EST-01");
    await expect(row.getByRole("button", { name: "Ajustar" })).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Cobrar" })).toHaveCount(0);
  });

  test("rechaza cantidad de cuotas de depósito inválida (ALQ-EST-04)", async ({ authedPage }) => {
    await openAjustarModalFromList(authedPage, "ALQ-EST-04");

    const dialog = authedPage.getByRole("dialog");
    await expect(dialog.getByText("Nuevo alquiler")).toBeVisible();
    await dialog.getByRole("button", { name: "Sí, actualizar" }).click();

    const cuotasInput = dialog.getByRole("spinbutton");
    await cuotasInput.fill("0");

    await expect(dialog.getByText("Ingresá una cantidad de cuotas entre 1 y 120.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Confirmar ajuste" })).toBeDisabled();

    await cuotasInput.fill("150");
    await expect(dialog.getByText("Ingresá una cantidad de cuotas entre 1 y 120.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Confirmar ajuste" })).toBeDisabled();
  });

  test("aplica ajuste correctamente y deja de mostrar Ajustar (ALQ-ICL-03)", async ({ authedPage }) => {
    await openAjustarModalFromList(authedPage, "ALQ-ICL-03");

    const dialog = authedPage.getByRole("dialog");
    await expect(dialog.getByText("Nuevo alquiler")).toBeVisible();
    const noActualizar = dialog.getByRole("button", { name: "No actualizar" });
    if (await noActualizar.isVisible()) {
      await noActualizar.click();
    }

    await Promise.all([
      authedPage.waitForResponse(
        (res) =>
          res.url().includes("/ajustes") &&
          res.request().method() === "POST" &&
          res.ok(),
      ),
      dialog.getByRole("button", { name: "Confirmar ajuste" }).click(),
    ]);

    await expect(dialog).toBeHidden();
    await expectToast(authedPage, /Ajuste aplicado para D122/);

    await expect(
      contractRow(authedPage, "ALQ-ICL-03").getByRole("button", { name: "Ajustar" }),
    ).toHaveCount(0);
  });
});
