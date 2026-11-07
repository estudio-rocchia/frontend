"use client";

import { ExternalLink } from "lucide-react";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { InmuebleDetalleSection } from "@/components/ventas/InmuebleDetalleSection";
import { ButtonOutline } from "@/components/ui/Button";
import { resumenFieldGridClass, ResumenField, ResumenPanel } from "@/components/ui/ResumenFields";
import type { InmuebleCatalogRecord, InmuebleFicha, OfertaRecord, VentaDetail } from "@/lib/api/types";
import { formatDateDisplay, formatMoney } from "@/lib/format";
import { inmueblePropiedadNombre, inmuebleUbicacionCompleta } from "@/lib/inmuebles/display-label";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { formaPagoLabel } from "@/lib/ventas/forma-pago";
import { ofertaEstadoLabel, ofertaEstadoVariant, ventaEstadoLabel } from "@/lib/ventas/status-labels";

type CatalogInmuebleResumenSectionProps = {
  ficha: InmuebleFicha;
  inmueble: InmuebleCatalogRecord;
  oferta: OfertaRecord | null;
  ventaVinculada: VentaDetail | null;
  propietario: string;
  motivo: string;
  isOffMarket: boolean;
  headerPrecio: { label: string; value: string };
  historialCount: number;
  inmuebleId: number;
  token: string | null;
  canEditDetalle: boolean;
  onDetalleSaved: () => void;
  onOpenVenta: () => void;
};

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === VENTA_EMPTY_FIELD) return "—";
  return trimmed;
}

function boolLabel(value: boolean): string {
  return value ? "Sí" : "No";
}

export function CatalogInmuebleResumenSection({
  ficha,
  inmueble,
  oferta,
  ventaVinculada,
  propietario,
  motivo,
  isOffMarket,
  headerPrecio,
  historialCount,
  inmuebleId,
  token,
  canEditDetalle,
  onDetalleSaved,
  onOpenVenta,
}: CatalogInmuebleResumenSectionProps) {
  const estadoCode = oferta?.estadoCode ?? "available";
  const tipoName = ficha.tipoInmueble?.name ?? "—";
  const ubicacion = inmuebleUbicacionCompleta(inmueble, ficha.localidad);
  const propiedadNombre = inmueblePropiedadNombre(inmueble, tipoName !== "—" ? tipoName : null);

  const precioHint =
    historialCount > 0
      ? `${historialCount} ${historialCount === 1 ? "cambio" : "cambios"} en historial de precio`
      : oferta?.codigoMoneda
        ? `Moneda ${oferta.codigoMoneda}`
        : "Sin historial de precio";

  const formaPagoValue = formaPagoLabel(oferta?.formaPagoCode);
  const formaPagoHint = oferta?.condicionesFinanciacion?.trim()
    ? "Con condiciones de financiación"
    : "Condiciones de la publicación";

  const estadoHint =
    ventaVinculada && estadoCode === "sold"
      ? ventaEstadoLabel(ventaVinculada.estado)
      : tipoName;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="grid min-w-0 gap-4 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]">
        <FichaSummaryCard label={headerPrecio.label} value={headerPrecio.value} hint={precioHint} />
        <FichaSummaryCard label="Forma de pago" value={formaPagoValue} hint={formaPagoHint} />
        <FichaSummaryCard label="Estado" value={ofertaEstadoLabel(estadoCode)} hint={estadoHint} />
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        <ResumenPanel title="Inmueble" description="Identificación y ubicación de la propiedad">
          <div className={resumenFieldGridClass}>
            <ResumenField label="Código" value={inmueble.code} />
            <ResumenField label="Tipo" value={displayValue(tipoName)} />
            <ResumenField label="Propiedad" value={propiedadNombre} span={2} />
            <ResumenField label="Ubicación" value={displayValue(ubicacion)} span={2} />
            <ResumenField label="Propietario" value={displayValue(propietario)} span={2} />
          </div>
        </ResumenPanel>

        <ResumenPanel title="Oferta de venta" description="Condiciones comerciales de la publicación">
          <div className={resumenFieldGridClass}>
            <ResumenField
              label="Estado"
              value={ofertaEstadoLabel(estadoCode)}
              statusVariant={ofertaEstadoVariant(estadoCode)}
            />
            {isOffMarket ? <ResumenField label="Motivo" value={displayValue(motivo)} /> : null}
            <ResumenField label="Forma de pago" value={formaPagoValue} />
            <ResumenField label="Financiación" value={displayValue(oferta?.condicionesFinanciacion)} span={2} />
            <ResumenField label="Notas de precio" value={displayValue(oferta?.notasPrecio)} span={2} />
            <ResumenField label="Acepta permuta" value={boolLabel(inmueble.aceptaPermuta)} />
            <ResumenField label="Acepta financiación" value={boolLabel(inmueble.aceptaFinanciacion)} />
          </div>
        </ResumenPanel>

        {token ? (
          <InmuebleDetalleSection
            token={token}
            inmuebleId={inmuebleId}
            tipoInmuebleCode={ficha.tipoInmueble?.code}
            detalle={ficha.detalle}
            canEdit={canEditDetalle}
            onSaved={onDetalleSaved}
          />
        ) : null}

        {ventaVinculada ? (
          <ResumenPanel title="Cierre de venta" description="Operación vinculada a esta propiedad">
            <div className={resumenFieldGridClass}>
              <ResumenField
                label="Operación"
                value={`Venta #${ventaVinculada.id} · ${ventaEstadoLabel(ventaVinculada.estado)}`}
                span={2}
              />
              <ResumenField
                label="Fecha de boleto"
                value={
                  ventaVinculada.fechaBoleto ? formatDateDisplay(ventaVinculada.fechaBoleto) : "—"
                }
                numeric
              />
              <ResumenField
                label="Fecha de escritura"
                value={
                  ventaVinculada.fechaEscritura
                    ? formatDateDisplay(ventaVinculada.fechaEscritura)
                    : "—"
                }
                numeric
              />
              <ResumenField label="Escribano" value={displayValue(ventaVinculada.nombreEscribano)} span={2} />
              <ResumenField
                label="Precio de cierre"
                value={formatMoney(ventaVinculada.montoPrecioVenta, ventaVinculada.codigoMoneda)}
                numeric
              />
              <ResumenField label="Forma de pago" value={formaPagoLabel(ventaVinculada.formaPagoCode)} />
              <ResumenField
                label="Condiciones de pago"
                value={displayValue(ventaVinculada.condicionesPago)}
                span={2}
              />
            </div>
            <div className="flex min-w-0 flex-col items-start gap-4">
              <ButtonOutline type="button" className="gap-2" onClick={onOpenVenta}>
                <ExternalLink className="h-4 w-4" aria-hidden />
                Abrir ficha de operación
              </ButtonOutline>
            </div>
          </ResumenPanel>
        ) : null}
      </div>
    </div>
  );
}
