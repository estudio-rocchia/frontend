import type { PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import type { VentaNuevaPropiedadValue } from "@/components/ventas/VentaNuevaPropiedadFields";
import { ApiError, publishEnAlquiler } from "@/lib/api";
import type { PublishEnVentaInput, PublishEnVentaResult } from "@/lib/api/types";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { hectareasAresToM2, showsHectareasMedidas } from "@/lib/ventas/hectareas";
import { buildPropietarioInput, resolveTipoInmuebleId } from "@/lib/ventas/publish-en-venta";

export function buildPublishEnAlquilerPayload(params: {
  propiedad: VentaNuevaPropiedadValue;
  tipoInmuebleId: number;
  propietario: PublishEnVentaInput["propietario"];
  propietariosAdicionales?: PublishEnVentaInput["propietariosAdicionales"];
  montoPrecio: number;
  codigoMoneda: string;
  notasPrecio: string;
  estadoOfertaId: number;
  tipoOperacionAlquilerId: number;
}): Omit<PublishEnVentaInput, "inmueble"> & {
  inmueble: Omit<PublishEnVentaInput["inmueble"], "code">;
} {
  const localidadIdRaw = Number(params.propiedad.direccion.localidadId);
  const localidadId =
    Number.isInteger(localidadIdRaw) && localidadIdRaw > 0 ? localidadIdRaw : null;
  const esCampo = showsHectareasMedidas(params.propiedad.tipoInmuebleCode);
  const campoDescription = params.propiedad.campoDescription.trim();
  const superficieTotalM2 = esCampo
    ? hectareasAresToM2(params.propiedad.hectareas, params.propiedad.ares)
    : null;

  return {
    inmueble: {
      tipoInmuebleId: params.tipoInmuebleId,
      ...(localidadId != null ? { localidadId } : {}),
      calle: params.propiedad.direccion.calle.trim() || null,
      numero: params.propiedad.direccion.numero.trim() || null,
      referencia: params.propiedad.direccion.referencia.trim() || null,
      title: params.propiedad.alias.trim() || null,
      ...(campoDescription ? { description: campoDescription } : {}),
      ...(superficieTotalM2 != null ? { superficieTotalM2 } : {}),
    },
    propietario: params.propietario,
    ...(params.propietariosAdicionales?.length
      ? { propietariosAdicionales: params.propietariosAdicionales }
      : {}),
    oferta: {
      tipoOperacionId: params.tipoOperacionAlquilerId,
      estadoId: params.estadoOfertaId,
      montoPrecio: params.montoPrecio,
      codigoMoneda: params.codigoMoneda,
      notasPrecio: params.notasPrecio.trim() || null,
    },
  };
}

export async function publishEnAlquilerWithCodeRetry(
  token: string,
  base: Omit<PublishEnVentaInput, "inmueble"> & {
    inmueble: Omit<PublishEnVentaInput["inmueble"], "code">;
  },
  tipoInmuebleCode: string,
  reservedCodes: string[],
): Promise<PublishEnVentaResult> {
  const prefix = prefixForTipoInmueble(tipoInmuebleCode);
  const codes = [...reservedCodes];
  const maxAttempts = Math.max(50, codes.length + 25);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = nextInmuebleCode(prefix, codes);
    try {
      return await publishEnAlquiler(token, {
        ...base,
        inmueble: { ...base.inmueble, code },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        codes.push(code);
        continue;
      }
      throw err;
    }
  }
  throw new Error("No se pudo reservar un código de inmueble. Recargá la página e intentá de nuevo.");
}

export { buildPropietarioInput, resolveTipoInmuebleId };
