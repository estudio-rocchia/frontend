import { ApiError } from "@/lib/api/client";

export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

export function conflictUserMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) {
    return `${error.message} Actualizamos la pantalla con los datos más recientes.`;
  }
  return fallback;
}
