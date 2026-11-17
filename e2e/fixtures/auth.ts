import { test as base, type Page } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "demo.admin";
const PASSWORD = process.env.E2E_PASSWORD ?? "DemoAdmin2026!";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-username").fill(USERNAME);
  await page.getByTestId("login-password").fill(PASSWORD);

  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/backend/auth/login"),
  );

  await page.getByTestId("login-submit").click();
  const response = await loginResponse;

  if (!response.ok()) {
    const alertText = await page
      .locator("form .login-alert-enter")
      .filter({ hasText: /\S/ })
      .first()
      .textContent()
      .catch(() => null);
    throw new Error(
      [
        `Login E2E falló (${response.status}) para "${USERNAME}".`,
        alertText?.trim() ? `Mensaje: ${alertText.trim()}` : null,
        "Corré en backend: npm run db:seed-demo (demo.admin / DemoAdmin2026!).",
        "Podés sobreescribir con E2E_USERNAME y E2E_PASSWORD.",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  // Tras OK la UI muestra "Redirigiendo…" un instante con la URL aún en /login.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";