"use client";

import { CircleDollarSign, ClipboardList, EyeOff, KeyRound, Pencil } from "lucide-react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { OfertaRecord } from "@/lib/api/types";
import { formatMoney, moneyClassName } from "@/lib/format";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { ofertaEstadoLabel, ofertaEstadoVariant } from "@/lib/ventas/status-labels";

type Modalidad = "venta" | "alquiler";

type GalponComercializacionPanelProps = {
  ofertaVenta: OfertaRecord | null;
  ofertaAlquiler: OfertaRecord | null;
  canEdit: boolean;
  onPublicarAlquiler: () => void;
  onEstadoVenta: (mode: "available" | "off_market") => void;
  onEstadoAlquiler: (mode: "available" | "off_market") => void;
  onPrecioVenta: () => void;
  onPrecioAlquiler: () => void;
  onRequisitosAlquiler: () => void;
  onIniciarVenta: () => void;
};

function OfertaCard({
  modalidad,
  oferta,
  canEdit,
  onPublicar,
  onEstado,
  onPrecio,
  onRequisitos,
  onIniciarVenta,
}: {
  modalidad: Modalidad;
  oferta: OfertaRecord | null;
  canEdit: boolean;
  onPublicar?: () => void;
  onEstado: (mode: "available" | "off_market") => void;
  onPrecio: () => void;
  onRequisitos?: () => void;
  onIniciarVenta?: () => void;
}) {
  const titulo = modalidad === "venta" ? "Venta" : "Alquiler";
  const estadoCode = oferta?.estadoCode ?? "off_market";
  const isAvailable = estadoCode === "available";
  const isOffMarket = estadoCode === "off_market";
  const precioLabel = modalidad === "venta" ? "Precio de venta" : "Precio de alquiler";
  const precioValue = oferta?.montoPrecio
    ? formatMoney(oferta.montoPrecio, oferta.codigoMoneda ?? (modalidad === "alquiler" ? "ARS" : "USD"))
    : "Consultar detalle";

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-bg-page/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-text-primary">{titulo}</h3>
        {oferta ? (
          <StatusBadge label={ofertaEstadoLabel(estadoCode)} variant={ofertaEstadoVariant(estadoCode)} />
        ) : (
          <span className="text-[11px] font-semibold text-text-secondary">Sin publicar</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {precioLabel}
        </span>
        <span className={`text-xl font-bold text-primary ${moneyClassName}`}>{precioValue}</span>
        {oferta?.notasPrecio?.trim() ? (
          <p className="text-xs text-text-secondary whitespace-pre-wrap">{oferta.notasPrecio.trim()}</p>
        ) : (
          <p className="text-xs text-text-secondary">Sin requisitos cargados.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {!oferta && onPublicar && canEdit ? (
          <ButtonPrimary type="button" className="gap-2" onClick={onPublicar}>
            <KeyRound className="h-4 w-4" aria-hidden />
            Publicar {titulo.toLowerCase()}
          </ButtonPrimary>
        ) : null}
        {oferta && modalidad === "venta" && isAvailable && onIniciarVenta ? (
          <ButtonPrimary type="button" className="gap-2" onClick={onIniciarVenta}>
            Iniciar venta
          </ButtonPrimary>
        ) : null}
        {oferta && canEdit ? (
          <>
            {isOffMarket ? (
              <ButtonOutline type="button" onClick={() => onEstado("available")}>
                Poner en {titulo.toLowerCase()}
              </ButtonOutline>
            ) : null}
            {isAvailable ? (
              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] font-medium text-danger hover:bg-danger-bg ${interactiveFocusClass}`}
                onClick={() => onEstado("off_market")}
              >
                <EyeOff className="h-4 w-4" aria-hidden />
                Sacar de {titulo.toLowerCase()}
              </button>
            ) : null}
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
              onClick={onPrecio}
            >
              <CircleDollarSign className="h-4 w-4" aria-hidden />
              Actualizar precio
            </button>
            {modalidad === "alquiler" && onRequisitos ? (
              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[13px] font-medium text-text-primary hover:bg-bg-page ${interactiveFocusClass}`}
                onClick={onRequisitos}
              >
                {oferta.notasPrecio?.trim() ? (
                  <Pencil className="h-4 w-4" aria-hidden />
                ) : (
                  <ClipboardList className="h-4 w-4" aria-hidden />
                )}
                {oferta.notasPrecio?.trim() ? "Editar requisitos" : "Cargar requisitos"}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
}

export function GalponComercializacionPanel({
  ofertaVenta,
  ofertaAlquiler,
  canEdit,
  onPublicarAlquiler,
  onEstadoVenta,
  onEstadoAlquiler,
  onPrecioVenta,
  onPrecioAlquiler,
  onRequisitosAlquiler,
  onIniciarVenta,
}: GalponComercializacionPanelProps) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Precios y estados de venta y alquiler se gestionan por separado.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <OfertaCard
          modalidad="venta"
          oferta={ofertaVenta}
          canEdit={canEdit}
          onEstado={onEstadoVenta}
          onPrecio={onPrecioVenta}
          onIniciarVenta={onIniciarVenta}
        />
        <OfertaCard
          modalidad="alquiler"
          oferta={ofertaAlquiler}
          canEdit={canEdit}
          onPublicar={onPublicarAlquiler}
          onEstado={onEstadoAlquiler}
          onPrecio={onPrecioAlquiler}
          onRequisitos={onRequisitosAlquiler}
        />
      </div>
    </section>
  );
}
