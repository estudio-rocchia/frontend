import { execSync } from "node:child_process";
import path from "node:path";

const backendRoot = path.resolve(process.cwd(), "../backend");

export default async function globalSetup() {
  try {
    execSync("npm run db:seed-cobrar-demo", {
      cwd: backendRoot,
      stdio: "inherit",
      env: { ...process.env, E2E_RESET_COB_DEMO: "1" },
    });
  } catch (error) {
    console.warn("[e2e] seed-cobrar-demo falló — verificá DATABASE_URL en backend/.env");
    console.warn(error);
  }
}
