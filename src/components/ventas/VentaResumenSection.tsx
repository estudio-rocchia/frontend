"use client";

import type { ReactNode } from "react";

import type { VentaDetail } from "@/lib/api/types";
import { formatDateDisplay, moneyClassName } from "@/lib/format";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { formaPagoLabel } from "@/lib/ventas/forma-pago";
import { parteNombre } from "@/lib/ventas/partes";

const PARTE_ROLES: { rol: string; label: string }[] = [
  { rol: "buyer", label: "Comprador" },
  { rol: "seller", label: "Vendedor" },
  { rol: "guarantor", label: "Garantes" },
];

function ResumenPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-md border border-border bg-bg-page p-4 ${className}`}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
      {children}
    </section>
  );
}

function DetailTile({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  const empty = value === VENTA_EMPTY_FIELD;
  return (
    <div className="rounded-sm border border-border/70 bg-bg-card px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p
        className={`mt-1 text-[13px] ${
          empty
            ? "text-text-secondary"
            : emphasize
              ? `font-semibold text-primary ${moneyClassName}`
              : "font-medium text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ParteTile({ label, value }: { label: string; value: string }) {
  const empty = value === VENTA_EMPTY_FIELD;
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-border/70 bg-bg-card px-3 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">{label}</span>
      <span className={`text-[13px] ${empty ? "text-text-secondary" : "font-medium text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

function formatOptionalDate(value: string | null | undefined): string {
  return value ? formatDateDisplay(value) : VENTA_EMPTY_FIELD;
}

export function VentaResumenSection({
  venta,
  inmuebleCode,
  inmuebleTitle,
  parteNombres,
}: {
  venta: VentaDetail;
  inmuebleCode: string;
  inmuebleTitle: string;
  parteNombres: Record<number, string>;
}) {
  const moneda = venta.codigoMoneda;
  const condiciones = venta.condicionesPago?.trim() || null;
  const notas = venta.notas?.trim() || null;

  return (
    <div className="flex flex-col gap-5" data-testid="venta-resumen">
      <div className="grid gap-4 lg:grid-cols-2">
        <ResumenPanel title="Inmueble">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailTile label="Código" value={inmuebleCode} emphasize />
            <DetailTile label="Propiedad" value={inmuebleTitle} />
            <DetailTile label="Operación" value={`Venta #${venta.id}`} />
            <DetailTile label="Moneda" value={moneda} />
          </div>
        </ResumenPanel>

        <ResumenPanel title="Trámite y escritura">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailTile label="Fecha de boleto" value={formatOptionalDate(venta.fechaBoleto)} />
            <DetailTile label="Fecha de escritura" value={formatOptionalDate(venta.fechaEscritura)} />
            <DetailTile label="Forma de pago" value={formaPagoLabel(venta.formaPagoCode)} />
            <DetailTile
              label="Escribano"
              value={venta.nombreEscribano?.trim() || VENTA_EMPTY_FIELD}
            />
          </div>
        </ResumenPanel>
      </div>

      <ResumenPanel title="Partes">
        <div className="grid gap-3 sm:grid-cols-2">
          {PARTE_ROLES.map(({ rol, label }) => (
            <ParteTile key={rol} label={label} value={parteNombre(venta, rol, parteNombres)} />
          ))}
        </div>
      </ResumenPanel>

      {condiciones ? (
        <ResumenPanel title="Condiciones de pago">
          <p className="whitespace-pre-wrap rounded-sm border border-border/70 bg-bg-card px-3 py-3 text-[13px] leading-relaxed text-text-primary">
            {condiciones}
          </p>
        </ResumenPanel>
      ) : null}

      {notas ? (
        <ResumenPanel title="Notas">
          <p className="whitespace-pre-wrap rounded-sm border border-dashed border-border bg-bg-card px-3 py-3 text-[13px] leading-relaxed text-text-secondary">
            {notas}
          </p>
        </ResumenPanel>
      ) : null}
    </div>
  );
}
