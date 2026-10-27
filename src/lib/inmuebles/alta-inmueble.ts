import { ApiError, createInmueble, fetchCatalog } from "@/lib/api";
import type { CatalogoItem, InmuebleRecord } from "@/lib/api/types";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";

export async function altaInmuebleCatalogo(
  token: string,
  input: {
    localidadId: number;
    calle: string;
    numero?: string;
    referencia?: string;
    alias?: string;
    tipoInmuebleCode: string;
    reservedCodes: string[];
    tiposInmueble?: CatalogoItem[];
  },
): Promise<InmuebleRecord> {
  if (!Number.isInteger(input.localidadId) || input.localidadId <= 0) {
    throw new Error("Seleccioná una localidad válida.");
  }

  const calle = input.calle.trim();
  if (!calle) {
    throw new Error("Completá al menos la calle de la propiedad.");
  }

  const tipos =
    input.tiposInmueble ??
    (await fetchCatalog<CatalogoItem>(token, "/catalogos/tipos-inmueble")).items;

  const tipoInmueble =
    tipos.find((item) => item.code === input.tipoInmuebleCode) ??
    tipos.find((item) => item.code === "house") ??
    tipos[0];

  if (!tipoInmueble) {
    throw new Error("No se pudo determinar el tipo de inmueble.");
  }

  const prefix = prefixForTipoInmueble(input.tipoInmuebleCode);
  const reservedCodes = [...input.reservedCodes];
  const alias = input.alias?.trim() || null;

  const maxAttempts = Math.max(50, reservedCodes.length + 25);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = nextInmuebleCode(prefix, reservedCodes);
    try {
      return await createInmueble(token, {
        code,
        tipoInmuebleId: tipoInmueble.id,
        localidadId: input.localidadId,
        calle,
        numero: input.numero?.trim() || null,
        referencia: input.referencia?.trim() || null,
        title: alias,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        reservedCodes.push(code);
        continue;
      }
      throw err;
    }
  }

  throw new Error("No se pudo reservar un código de inmueble. Reintentá.");
}
