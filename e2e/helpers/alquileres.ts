import { type Page, expect } from "@playwright/test";

const INMUEBLE_BY_CONTRATO: Record<string, string> = {
  "ALQ-MIX-01": "D137",
  "ALQ-EST-01": "D130",
  "ALQ-EST-02": "D131",
  "ALQ-EST-04": "D133",
  "ALQ-EST-05": "D134",
  "ALQ-ICL-03": "D122",
  "ALQ-COB-01": "D101",
};

function rowMarkerForQuery(query: string): string {
  return INMUEBLE_BY_CONTRATO[query] ?? query;
}

export async function searchContratos(page: Page, query: string) {
  const marker = rowMarkerForQuery(query);
  const search = page.getByLabel("Buscar contratos");
  await search.clear();
  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/contratos/table-summary") &&
        res.url().includes(`q=${encodeURIComponent(query)}`) &&
        res.ok(),
    ),
    search.fill(query),
  ]);
  const row = page.getByRole("row").filter({ hasText: marker });
  await expect(row.first()).toBeVisible();
}

export function contractRow(page: Page, contratoCode: string) {
  const marker = rowMarkerForQuery(contratoCode);
  return page.getByRole("row").filter({ hasText: marker });
}

export async function openContratoFicha(page: Page, contratoCode: string) {
  await page.goto("/alquileres");
  await expect(page.getByRole("heading", { name: "Listado de contratos" })).toBeVisible();
  await searchContratos(page, contratoCode);
  await contractRow(page, contratoCode)
    .getByRole("button", { name: "Ver ficha" })
    .click();
  await expect(page).toHaveURL(/\/alquileres\/\d+/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(contratoCode);
}

export async function openCobrarModalFromList(page: Page, contratoCode: string) {
  await page.goto("/alquileres");
  await expect(page.getByRole("heading", { name: "Listado de contratos" })).toBeVisible();
  await searchContratos(page, contratoCode);
  await contractRow(page, contratoCode).getByRole("button", { name: "Cobrar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cobrar alquiler" })).toBeVisible();
}

export async function openAjustarModalFromList(page: Page, contratoCode: string) {
  await page.goto("/alquileres");
  await expect(page.getByRole("heading", { name: "Listado de contratos" })).toBeVisible();
  await searchContratos(page, contratoCode);
  await contractRow(page, contratoCode).getByRole("button", { name: "Ajustar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ajustar alquiler" })).toBeVisible();
}

export async function expectToast(page: Page, message: string | RegExp) {
  const toast = page.getByRole("status");
  await expect(toast).toBeVisible();
  await expect(toast).toHaveText(message);
}
