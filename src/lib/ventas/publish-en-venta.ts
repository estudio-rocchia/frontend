import type { PersonaFieldValue } from "@/components/alquileres/PersonaSelectField";
import type { VentaNuevaPropiedadValue } from "@/components/ventas/VentaNuevaPropiedadFields";
import { ApiError, publishEnVenta } from "@/lib/api";
import type {
  CatalogoItem,
  PublishEnVentaInput,
  PublishEnVentaPersonaInput,
  PublishEnVentaResult,
} from "@/lib/api/types";
import { nextInmuebleCode, prefixForTipoInmueble } from "@/lib/codes";
import { normalizePhoneToE164 } from "@/lib/format";

export function buildPropietarioInput(
  field: PersonaFieldValue,
  extras: {
    phone?: string;
    address?: string;
    localidadId?: number | null;
  } = {},
): PublishEnVentaPersonaInput {
  if (field.mode === "existing") {
    return { personaId: field.personaId };
  }
  const phoneRaw = extras.phone?.trim();
  const phone = phoneRaw ? normalizePhoneToE164(phoneRaw) : null;
  if (phoneRaw && !phone) {
    throw new Error("El teléfono del propietario no es válido.");
  }
  const nombre = field.nombre.trim();
  const apellido = field.apellido.trim();
  return {
    tipoPersona: "natural",
    nombre: nombre || "Sin nombre",
    apellido: apellido || nombre || "Sin nombre",
    phone,
    address: extras.address?.trim() || null,
    localidadId: extras.localidadId ?? null,
  };
}

export function buildPublishEnVentaPayload(params: {
  propiedad: VentaNuevaPropiedadValue;
  tipoInmuebleId: number;
  aceptaPermuta: boolean;
  aceptaFinanciacion: boolean;
  aceptaVehiculo: boolean;
  propietario: PublishEnVentaPersonaInput;
  montoPrecio: number;
  codigoMoneda: string;
  formaPagoId: number | null;
  condicionesFinanciacion: string;
  notasPrecio: string;
  estadoOfertaId: number;
  tipoOperacionVentaId: number;
}): Omit<PublishEnVentaInput, "inmueble"> & {
  inmueble: Omit<PublishEnVentaInput["inmueble"], "code">;
} {
  const localidadId = Number(params.propiedad.direccion.localidadId);
  return {
    inmueble: {
      tipoInmuebleId: params.tipoInmuebleId,
      localidadId,
      calle: params.propiedad.direccion.calle.trim(),
      numero: params.propiedad.direccion.numero.trim() || null,
      referencia: params.propiedad.direccion.referencia.trim() || null,
      title: params.propiedad.alias.trim() || null,
      aceptaPermuta: params.aceptaPermuta,
      aceptaFinanciacion: params.aceptaFinanciacion,
      aceptaVehiculo: params.aceptaVehiculo,
    },
    propietario: params.propietario,
    oferta: {
      tipoOperacionId: params.tipoOperacionVentaId,
      estadoId: params.estadoOfertaId,
      montoPrecio: params.montoPrecio,
      codigoMoneda: params.codigoMoneda,
      formaPagoId: params.formaPagoId,
      condicionesFinanciacion: params.condicionesFinanciacion.trim() || null,
      notasPrecio: params.notasPrecio.trim() || null,
    },
  };
}

export async function publishEnVentaWithCodeRetry(
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
      return await publishEnVenta(token, {
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

export function resolveTipoInmuebleId(
  tiposInmueble: CatalogoItem[],
  tipoInmuebleCode: string,
): number {
  const tipo =
    tiposInmueble.find((item) => item.code === tipoInmuebleCode) ??
    tiposInmueble.find((item) => item.code === "house") ??
    tiposInmueble[0];
  if (!tipo) {
    throw new Error("No se pudo determinar el tipo de inmueble.");
  }
  return tipo.id;
}
