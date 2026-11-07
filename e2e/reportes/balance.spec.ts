import { test, expect } from "../fixtures/auth";

test.describe("Balance — responsive y teclado", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/reportes");
    await expect(authedPage.getByRole("heading", { name: "Balance" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(authedPage.getByText("Ingresos netos del estudio · ARS")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("320px: no overflow horizontal en el contenido principal", async ({ authedPage }) => {
    const metrics = await authedPage.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return null;
      return {
        clientWidth: main.clientWidth,
        scrollWidth: main.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.docScrollWidth).toBeLessThanOrEqual(metrics!.viewportWidth + 1);
    expect(metrics!.scrollWidth).toBeLessThanOrEqual(metrics!.clientWidth + 1);
  });

  test("320px: presets y generar reporte son alcanzables por teclado", async ({ authedPage }) => {
    const year = new Date().getFullYear();
    const preset = authedPage.getByRole("button", { name: new RegExp(`${year} · Ene – hoy`) }).first();
    await preset.focus();
    await expect(preset).toBeFocused();
    await expect(preset).toHaveAttribute("aria-pressed", "true");

    await authedPage.keyboard.press("Tab");
    const generate = authedPage.getByRole("button", { name: "Aplicar período" });
    await expect(generate).toBeVisible();
  });

  test("controles de matriz usan aria-pressed", async ({ authedPage }) => {
    const matrix = authedPage.getByRole("region", { name: "Matriz mes a mes" });
    await matrix.scrollIntoViewIfNeeded();
    await expect(matrix).toBeVisible();

    const alquileres = matrix.getByRole("group", { name: "matrix-kind" }).getByRole("button", {
      name: "Alquileres",
    });
    await expect(alquileres).toHaveAttribute("aria-pressed", "true");

    await alquileres.focus();
    await expect(alquileres).toBeFocused();
  });

  test("320px: scroll-padding cubre toolbar sticky al enfocar matriz", async ({ authedPage }) => {
    const stickyHeight = await authedPage.evaluate(() => {
      const stack = document.querySelector(".balance-sticky-stack");
      return stack ? Math.ceil(stack.getBoundingClientRect().height) : 0;
    });
    expect(stickyHeight).toBeGreaterThan(0);

    const scrollPaddingTop = await authedPage.evaluate(() => {
      const shell = document.querySelector(".balance-shell");
      if (!shell) return 0;
      return parseFloat(getComputedStyle(shell).scrollPaddingTop);
    });
    expect(scrollPaddingTop).toBeGreaterThanOrEqual(stickyHeight - 4);

    const matrix = authedPage.getByRole("region", { name: "Matriz mes a mes" });
    const alquileres = matrix.getByRole("group", { name: "matrix-kind" }).getByRole("button", {
      name: "Alquileres",
    });
    await alquileres.focus();

    const obscured = await authedPage.evaluate(() => {
      const active = document.activeElement;
      const stack = document.querySelector(".balance-sticky-stack");
      if (!active || !stack || !(active instanceof HTMLElement)) return true;
      const a = active.getBoundingClientRect();
      const t = stack.getBoundingClientRect();
      return a.top < t.bottom - 2;
    });
    expect(obscured).toBe(false);
  });
});
