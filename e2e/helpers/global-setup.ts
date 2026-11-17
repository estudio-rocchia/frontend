import { execSync } from "node:child_process";
import path from "node:path";

const backendRoot = path.resolve(process.cwd(), "../backend");

/**
 * El seed de cobranza es solo para e2e/alquileres.
 * Activarlo explícitamente: E2E_RUN_COBRAR_SEED=1 npm run test:e2e:alquileres
 */
export default async function globalSetup() {
  if (process.env.E2E_RUN_COBRAR_SEED !== "1") {
    console.log("[e2e] seed-cobrar-demo omitido (solo corre con E2E_RUN_COBRAR_SEED=1)");
    return;
  }

  try {
    execSync("npm run db:seed-cobrar-demo", {
      cwd: backendRoot,
      stdio: "inherit",
      env: { ...process.env, E2E_RESET_COB_DEMO: "1" },
    });
  } catch (error) {
    console.warn("[e2e] seed-cobrar-demo falló — verificá DATABASE_URL en backend/.env");
    console.warn(error);
    throw error;
  }
}