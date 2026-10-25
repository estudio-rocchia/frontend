import { buildInmuebleDireccion, type InmuebleDireccionInput } from "@/lib/inmuebles/direccion";

export function formatInmuebleDisplayLabel(input: {
  code?: string | null;
  tipoName?: string | null;
  localidadName?: string | null;
  direccion?: InmuebleDireccionInput;
  direccionLine?: string | null;
  alias?: string | null;
}): string {
  const address =
    input.direccionLine?.trim() ||
    (input.direccion ? buildInmuebleDireccion(input.direccion) : "");
  const locality = input.localidadName?.trim() || "";
  const location = [address, locality].filter(Boolean).join(", ");

  const segments: string[] = [];
  const code = input.code?.trim();
  const tipoName = input.tipoName?.trim();
  if (code) segments.push(code);
  if (tipoName) segments.push(tipoName);
  if (location) segments.push(location);

  if (segments.length > 0) return segments.join(" · ");

  const alias = input.alias?.trim();
  if (alias) return alias;

  return code || "Inmueble";
}

export function inmuebleDisplayLabel(inmueble: {
  displayLabel?: string | null;
  title?: string | null;
  code?: string | null;
}): string {
  return inmueble.displayLabel?.trim() || inmueble.title?.trim() || inmueble.code?.trim() || "Inmueble";
}

/** Etiqueta de propiedad en listados de contratos (evita duplicar el código). */
export function contractPropertyLabel(inmuebleCode: string, inmuebleTitle: string): string {
  const code = inmuebleCode.trim();
  const title = inmuebleTitle.trim();
  if (!title) return code || "Inmueble";
  if (code && title.startsWith(`${code} ·`)) return title;
  return code ? `${code} · ${title}` : title;
}
