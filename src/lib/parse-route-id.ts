/** Parsea un segmento dinámico de ruta (`[id]`) a entero positivo o null. */
export function parseRouteId(raw: string | string[] | undefined): number | null {
  const segment = Array.isArray(raw) ? raw[0] : raw;
  if (!segment || segment === "undefined" || segment === "null") {
    return null;
  }
  const parsed = Number.parseInt(segment, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
