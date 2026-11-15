"use client";

import { CircleDollarSign, ClipboardList, ExternalLink, Pencil } from "lucide-react";

import { FichaSummaryCard } from "@/components/alquileres/FichaSummaryCard";
import { InmuebleDetalleSection } from "@/components/ventas/InmuebleDetalleSection";
import { ButtonOutline } from "@/components/ui/Button";
import { resumenFieldGridClass, ResumenField, ResumenPanel } from "@/components/ui/ResumenFields";
import type { InmuebleCatalogRecord, InmuebleFicha, OfertaRecord, VentaDetail } from "@/lib/api/types";
import { formatDateDisplay, formatMoney } from "@/lib/format";
import { inmueblePropiedadResumen } from "@/lib/inmuebles/display-label";
import { alquilerNotasPrecioText, alquilerRequisitosText, alquilerTieneRequisitos } from "@/lib/alquileres/oferta-fields";
import { catalogLocalidadLabel, permutaResumenLabel } from "@/lib/ventas/catalog-helpers";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { formaPagoLabel } from "@/lib/ventas/forma-pago";
import {
  ofertaEstadoLabel,
  ofertaEstadoVariant,
  ventaEstadoLabel,
  ventaInmobiliariaLabel,
  ventaInmobiliariaVariant,
} from "@/lib/ventas/status-labels";

type CatalogInmuebleResumenSectionProps = {
  ficha: InmuebleFicha;
  inmueble: InmuebleCatalogRecord;
  oferta: OfertaRecord | null;
  ofertaAlquiler?: OfertaRecord | null;
  ventaVinculada: VentaDetail | null;
  propietario: string;
  motivo: string;
  isOffMarket: boolean;
  isSold?: boolean;
  headerPrecio: { label: string; value: string };
  historialCount: number;
  historialAlquilerCount?: number;
  inmuebleId: number;
  token: string | null;
  canEditDetalle: boolean;
  onDetalleSaved: () => void;
  onOpenVenta: () => void;
  onRegistrarVenta?: () => void;
  onEditRequisitosAlquiler?: () => void;
  onActualizarPrecioAlquiler?: () => void;
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
  ofertaAlquiler = null,
  ventaVinculada,
  propietario,
  motivo,
  isOffMarket,
  isSold = false,
  headerPrecio,
  historialCount,
  historialAlquilerCount = 0,
  inmuebleId,
  token,
  canEditDetalle,
  onDetalleSaved,
  onOpenVenta,
  onRegistrarVenta,
  onEditRequisitosAlquiler,
  onActualizarPrecioAlquiler,
}: CatalogInmuebleResumenSectionProps) {
  const estadoCode = oferta?.estadoCode ?? "available";
  const tipoName = ficha.tipoInmueble?.name ?? "—";
  const ubicacion = catalogLocalidadLabel(ficha.localidad);
  const referencia = inmueble.referencia?.trim() || null;
  const propiedadNombre = inmueblePropiedadResumen(inmueble, tipoName !== "—" ? tipoName : null);

  const historialReferencia = oferta ? historialCount : historialAlquilerCount;
  const monedaReferencia = oferta?.codigoMoneda ?? ofertaAlquiler?.codigoMoneda;
  const precioHint =
    historialReferencia > 0
      ? `${historialReferencia} ${historialReferencia === 1 ? "cambio" : "cambios"} en historial de precio`
      : monedaReferencia
        ? `Moneda ${monedaReferencia}`
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
            {propiedadNombre ? (
              <ResumenField label="Nombre" value={propiedadNombre} span={2} />
            ) : null}
            <ResumenField label="Ubicación" value={displayValue(ubicacion)} span={2} />
            {referencia ? (
              <ResumenField label="Referencia" value={displayValue(referencia)} span={2} />
            ) : null}
            <ResumenField label="Propietario" value={displayValue(propietario)} span={2} />
          </div>
        </ResumenPanel>

        {oferta?.tipoOperacionCode === "venta" ? (
          <ResumenPanel title="Oferta de venta" description="Condiciones comerciales de la publicación">
            <div className={resumenFieldGridClass}>
              <ResumenField
                label="Estado"
                value={ofertaEstadoLabel(estadoCode)}
                statusVariant={ofertaEstadoVariant(estadoCode)}
              />
              {isOffMarket ? <ResumenField label="Motivo" value={displayValue(motivo)} /> : null}
              <ResumenField label="Forma de pago" value={formaPagoValue} />
              <ResumenField label="Financiación" value={displayValue(oferta.condicionesFinanciacion)} span={2} />
              <ResumenField label="Notas de precio" value={displayValue(oferta.notasPrecio)} span={2} />
              <ResumenField label="Permuta" value={permutaResumenLabel(inmueble)} />
              <ResumenField label="Acepta financiación" value={boolLabel(inmueble.aceptaFinanciacion)} />
            </div>
          </ResumenPanel>
        ) : null}

        {ofertaAlquiler ? (
          <ResumenPanel
            title="Oferta de alquiler"
            description="Precio y requisitos de la publicación"
            headerAction={
              canEditDetalle && (onActualizarPrecioAlquiler || onEditRequisitosAlquiler) ? (
                <div className="flex flex-wrap justify-end gap-2">
                  {onActualizarPrecioAlquiler ? (
                    <ButtonOutline type="button" className="gap-2" onClick={onActualizarPrecioAlquiler}>
                      <CircleDollarSign className="h-4 w-4" aria-hidden />
                      Actualizar precio
                    </ButtonOutline>
                  ) : null}
                  {onEditRequisitosAlquiler ? (
                    <ButtonOutline type="button" className="gap-2" onClick={onEditRequisitosAlquiler}>
                      {alquilerTieneRequisitos(ofertaAlquiler) ? (
                        <Pencil className="h-4 w-4" aria-hidden />
                      ) : (
                        <ClipboardList className="h-4 w-4" aria-hidden />
                      )}
                      {alquilerTieneRequisitos(ofertaAlquiler) ? "Editar condiciones" : "Cargar condiciones"}
                    </ButtonOutline>
                  ) : null}
                </div>
              ) : undefined
            }
          >
            <div className={resumenFieldGridClass}>
              <ResumenField
                label="Estado"
                value={ofertaEstadoLabel(ofertaAlquiler.estadoCode)}
                statusVariant={ofertaEstadoVariant(ofertaAlquiler.estadoCode)}
              />
              <ResumenField
                label="Precio mensual"
                value={
                  ofertaAlquiler.montoPrecio
                    ? formatMoney(ofertaAlquiler.montoPrecio, ofertaAlquiler.codigoMoneda ?? "ARS")
                    : "—"
                }
              />
              {historialAlquilerCount > 0 ? (
                <p className="sm:col-span-2 text-[12px] text-text-secondary">
                  {historialAlquilerCount}{" "}
                  {historialAlquilerCount === 1 ? "cambio" : "cambios"} en historial de precio de alquiler
                </p>
              ) : null}
              <ResumenField
                label="Requisitos para alquilar"
                value={displayValue(alquilerRequisitosText(ofertaAlquiler))}
                span={2}
                longText
              />
              <ResumenField
                label="Notas de precio"
                value={displayValue(alquilerNotasPrecioText(ofertaAlquiler))}
                span={2}
                longText
              />
            </div>
          </ResumenPanel>
        ) : null}

        {token ? (
          <InmuebleDetalleSection
            token={token}
            inmuebleId={inmuebleId}
            tipoInmuebleCode={ficha.tipoInmueble?.code}
            esTerreno={ficha.tipoInmueble?.esTerreno ?? false}
            inmueble={inmueble}
            detalle={ficha.detalle}
            canEdit={canEditDetalle}
            onSaved={onDetalleSaved}
          />
        ) : null}

        {isSold && !ventaVinculada && onRegistrarVenta ? (
          <ResumenPanel
            title="Cierre de venta"
            description="Todavía no hay precio ni operación registrada para esta venta cerrada."
          >
            <p className="text-sm text-text-secondary">
              Cuando tengan el importe, podés cargar el precio de cierre, las partes y las fechas desde
              acá.
            </p>
            <ButtonOutline type="button" className="gap-2" onClick={onRegistrarVenta}>
              <CircleDollarSign className="h-4 w-4" aria-hidden />
              Registrar precio de venta
            </ButtonOutline>
          </ResumenPanel>
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
                label="Gestión"
                value={ventaInmobiliariaLabel(ventaVinculada.estadoInmobiliaria)}
                statusVariant={ventaInmobiliariaVariant(ventaVinculada.estadoInmobiliaria)}
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
