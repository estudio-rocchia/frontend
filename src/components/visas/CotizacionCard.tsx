"use client";

import Link from "next/link";
import { useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CotizacionVisa, IntegranteVisa, ReciboVisa } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { formatUsd } from "@/lib/visas/labels";

function cobroBadge(
  honorarioListo: boolean,
  arancelListo: boolean,
  grupoCompleto: boolean,
): {
  label: string;
  variant: "success" | "warning";
} {
  if (honorarioListo && grupoCompleto) return { label: "Cobrada", variant: "success" };
  if (honorarioListo && arancelListo) return { label: "Falta arancel", variant: "warning" };
  if (honorarioListo) return { label: "Honorario cobrado", variant: "success" };
  if (arancelListo) return { label: "Arancel cobrado", variant: "success" };
  return { label: "Sin cobrar", variant: "warning" };
}

function Line({ title, detail, amount }: { title: string; detail?: string; amount: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="min-w-0">
        <span className="block text-sm text-text-primary">{title}</span>
        {detail ? <span className="block text-xs text-text-secondary">{detail}</span> : null}
      </dt>
      <dd className="shrink-0 text-sm tabular-nums text-text-primary">{amount}</dd>
    </div>
  );
}

export function CotizacionCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-24 animate-pulse rounded-sm bg-border" />
        <div className="h-3 w-16 animate-pulse rounded-sm bg-border" />
      </div>
      <div className="h-6 w-24 animate-pulse rounded-full bg-border" />
      <div className="h-[4.5rem] animate-pulse rounded-md bg-primary-soft" />
      <div className="h-12 animate-pulse rounded-md bg-bg-page" />
      <div className="h-10 animate-pulse rounded-sm bg-border" />
      <div className="h-16 animate-pulse rounded-md border border-dashed border-border" />
    </div>
  );
}

function todayIso(): string {
  return new Date().toLocaleDateString("en-CA");
}

function descripcionRecibo(recibo: ReciboVisa, integrantes: IntegranteVisa[], esGrupo: boolean): string {
  const tieneHonorario = recibo.conceptos.includes("honorario");
  const tieneArancel = recibo.conceptos.includes("arancel");
  const concepto = [tieneHonorario ? "Honorario" : null, tieneArancel ? "Arancel" : null].filter(Boolean).join(" y ");
  if (!esGrupo) return concepto;
  if (tieneHonorario && !tieneArancel) return "Grupo · Honorario";
  const integrante = integrantes.find((item) => item.id === recibo.tramiteId);
  const nombre = integrante ? personaDisplayName(integrante.persona) : null;
  if (tieneHonorario && tieneArancel) return nombre ? `${nombre} · Honorario y arancel` : "Honorario y arancel";
  return nombre ? `${nombre} · Arancel` : "Arancel";
}

export function CotizacionCard({
  cotizacion,
  preview = false,
  canEdit = false,
  abiertoEn,
  honorarioPagadoEn,
  arancelPagadoEn,
  integrantes,
  tramiteId,
  recibos,
  saving = false,
  errorMessage = null,
  onCobrar,
  onVerRecibo,
  onAnularRecibo,
}: {
  cotizacion: CotizacionVisa;
  preview?: boolean;
  canEdit?: boolean;
  abiertoEn: string;
  honorarioPagadoEn: string | null;
  arancelPagadoEn: string | null;
  integrantes: IntegranteVisa[];
  tramiteId: number;
  recibos: ReciboVisa[];
  saving?: boolean;
  errorMessage?: string | null;
  onCobrar: (input: { honorario: boolean; arancel: boolean; fecha: string }) => Promise<void>;
  onVerRecibo: (reciboId: number) => Promise<void>;
  onAnularRecibo: (reciboId: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [honorario, setHonorario] = useState(false);
  const [arancel, setArancel] = useState(false);
  const [fecha, setFecha] = useState(todayIso);
  const [fechaError, setFechaError] = useState<string | null>(null);
  const [busyRecibo, setBusyRecibo] = useState<number | null>(null);
  const [anularId, setAnularId] = useState<number | null>(null);

  const personasLabel = cotizacion.personas === 1 ? "1 persona" : `${cotizacion.personas} personas`;
  const honorarioListo = Boolean(honorarioPagadoEn);
  const arancelListo = Boolean(arancelPagadoEn);
  const faltaHonorario = !honorarioListo;
  const faltaArancel = !arancelListo;
  const faltaAlguno = faltaHonorario || faltaArancel;
  const faltaLosDos = faltaHonorario && faltaArancel;
  const esGrupo = cotizacion.personas > 1;
  const grupoCompleto = esGrupo
    ? integrantes.length > 0 && integrantes.every((integrante) => integrante.arancelPagadoEn)
    : arancelListo;
  const badge = cobroBadge(honorarioListo, arancelListo, grupoCompleto);
  const muestraDesglose = esGrupo || cotizacion.cambiosTurno > 0;
  const aranceles = [...integrantes].sort((a, b) => {
    if (a.id === tramiteId) return -1;
    if (b.id === tramiteId) return 1;
    return a.id - b.id;
  });
  const arancelDetalle = arancelListo
    ? `El ${formatDateDisplay(arancelPagadoEn ?? "")}`
    : honorarioListo
      ? "Pendiente · embajada"
      : "Embajada";
  const honorarioLabel = esGrupo ? "Honorario del grupo" : "Honorario";
  const arancelLabel = esGrupo ? "Arancel de esta persona" : "Arancel";

  function abrir() {
    setHonorario(faltaHonorario);
    setArancel(faltaArancel);
    setFecha(todayIso());
    setFechaError(null);
    setAnularId(null);
    setOpen(true);
  }

  async function confirmar() {
    if (!fecha) {
      setFechaError("Falta la fecha.");
      return;
    }
    if (abiertoEn && fecha < abiertoEn) {
      setFechaError("No puede ser anterior a la apertura.");
      return;
    }
    const cobraHonorario = faltaHonorario && (faltaLosDos ? honorario : true);
    const cobraArancel = faltaArancel && (faltaLosDos ? arancel : true);
    if (!cobraHonorario && !cobraArancel) return;
    setFechaError(null);
    try {
      await onCobrar({ honorario: cobraHonorario, arancel: cobraArancel, fecha });
      setOpen(false);
    } catch {
      setOpen(true);
    }
  }

  async function ver(reciboId: number) {
    setBusyRecibo(reciboId);
    try {
      await onVerRecibo(reciboId);
    } finally {
      setBusyRecibo(null);
    }
  }

  async function anular(reciboId: number) {
    setBusyRecibo(reciboId);
    try {
      await onAnularRecibo(reciboId);
      setAnularId(null);
    } finally {
      setBusyRecibo(null);
    }
  }

  return (
    <section
      aria-labelledby="cotizacion-titulo"
      aria-busy={saving}
      className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cotizacion-titulo" className="text-[15px] font-semibold text-text-primary">
            Cotización
          </h2>
          <p className="shrink-0 text-xs text-text-secondary">{personasLabel}</p>
        </div>
        <div aria-live="polite">
          <StatusBadge label={badge.label} variant={badge.variant} />
        </div>
      </div>

      {preview ? (
        <p id="cotizacion-preview" role="status" className="rounded-sm bg-warning-bg px-3 py-2 text-sm font-semibold text-warning">
          Vista previa. Guardá el grupo para cobrar.
        </p>
      ) : null}

      {saving ? <p className="sr-only" role="status">Guardando el cobro.</p> : null}

      <div
        className={`flex flex-col gap-1 rounded-md px-3 py-3 ${honorarioListo ? "bg-success-bg" : "bg-primary-soft"}`}
      >
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${honorarioListo ? "text-success" : "text-primary"}`}>
          {honorarioListo ? `Cobrado el ${formatDateDisplay(honorarioPagadoEn ?? "")}` : "Cobra el estudio"}
        </p>
        {esGrupo ? (
          <p className={`text-xs font-semibold ${honorarioListo ? "text-success" : "text-primary"}`}>Del grupo</p>
        ) : null}
        <p className={`text-[28px] font-bold leading-none tabular-nums ${honorarioListo ? "text-success" : "text-primary"}`}>
          {formatUsd(cotizacion.totalEstudioUsd)}
        </p>
      </div>

      {muestraDesglose ? (
        <dl className="flex flex-col gap-2">
          <Line
            title="Honorario"
            detail={`${formatUsd(cotizacion.honorarioUnitarioUsd)} × ${cotizacion.personas}`}
            amount={formatUsd(cotizacion.honorarioTotalUsd)}
          />
          {cotizacion.cambiosTurno > 0 ? (
            <Line
              title="Cambios de turno"
              detail={`${formatUsd(cotizacion.cambioTurnoUnitarioUsd)} × ${cotizacion.cambiosTurno}`}
              amount={formatUsd(cotizacion.cambioTurnoTotalUsd)}
            />
          ) : null}
        </dl>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {esGrupo && aranceles.length > 1 ? (
          <ul className="flex flex-col gap-2" aria-label="Arancel de cada persona">
            {aranceles.map((integrante) => {
              const actual = integrante.id === tramiteId;
              const pagado = Boolean(integrante.arancelPagadoEn);
              const nombre = personaDisplayName(integrante.persona);
              return (
                <li
                  key={integrante.id}
                  className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ${
                    pagado ? "bg-success-bg" : "bg-bg-page"
                  }`}
                >
                  <span className="min-w-0">
                    {actual ? (
                      <span className={`block truncate text-sm font-semibold ${pagado ? "text-success" : "text-text-primary"}`}>
                        {nombre}
                      </span>
                    ) : (
                      <Link
                        href={`/visas/${integrante.id}`}
                        className={`block truncate text-sm font-semibold hover:underline ${
                          pagado ? "text-success" : "text-primary"
                        } ${interactiveFocusClass}`}
                      >
                        {nombre}
                      </Link>
                    )}
                    <span className={`block text-xs ${pagado ? "text-success" : "text-text-secondary"}`}>
                      {actual ? "Esta ficha · " : ""}
                      {pagado ? `El ${formatDateDisplay(integrante.arancelPagadoEn ?? "")}` : "Pendiente"}
                    </span>
                  </span>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${pagado ? "text-success" : "text-text-primary"}`}>
                    {formatUsd(cotizacion.arancelUnitarioUsd)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div
            className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ${
              arancelListo ? "bg-success-bg" : "bg-bg-page"
            }`}
          >
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${arancelListo ? "text-success" : "text-text-primary"}`}>
                Arancel
              </span>
              <span className={`block text-xs ${arancelListo ? "text-success" : "text-text-secondary"}`}>
                {arancelDetalle}
              </span>
            </span>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${arancelListo ? "text-success" : "text-text-primary"}`}>
              {formatUsd(cotizacion.arancelUnitarioUsd)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-text-primary">Total</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
            {formatUsd(cotizacion.totalUsd)}
          </span>
        </div>
      </div>

      {canEdit && (faltaAlguno || open) ? (
        <div className="flex flex-col gap-3">
          {faltaAlguno && !open ? (
            <ButtonPrimary
              onClick={abrir}
              disabled={saving || preview}
              aria-describedby={preview ? "cotizacion-preview" : undefined}
              className="w-full"
            >
              Cobrar
            </ButtonPrimary>
          ) : null}

          {open ? (
            <form
              className="flex flex-col gap-3 rounded-md bg-bg-page p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void confirmar();
              }}
            >
              {faltaLosDos ? (
                <fieldset className="flex flex-col gap-2" disabled={saving}>
                  <legend className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Qué se pagó
                  </legend>
                  <ConceptoCheck
                    label={honorarioLabel}
                    amount={formatUsd(cotizacion.totalEstudioUsd)}
                    checked={honorario}
                    onChange={setHonorario}
                  />
                  <ConceptoCheck
                    label={arancelLabel}
                    amount={formatUsd(cotizacion.arancelUnitarioUsd)}
                    checked={arancel}
                    onChange={setArancel}
                  />
                </fieldset>
              ) : (
                <p className="flex items-baseline justify-between gap-3 text-sm text-text-primary">
                  <span className="font-semibold">{faltaHonorario ? honorarioLabel : arancelLabel}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatUsd(faltaHonorario ? cotizacion.totalEstudioUsd : cotizacion.arancelUnitarioUsd)}
                  </span>
                </p>
              )}

              <label className="flex flex-col gap-1.5" htmlFor="fecha-cobro">
                <span className="text-[11px] font-semibold text-text-secondary">Fecha</span>
                <input
                  id="fecha-cobro"
                  type="date"
                  value={fecha}
                  min={abiertoEn || undefined}
                  disabled={saving}
                  aria-invalid={Boolean(fechaError)}
                  aria-describedby={fechaError ? "fecha-cobro-ayuda" : undefined}
                  onChange={(event) => setFecha(event.target.value)}
                  className={`${formInputClass} w-full disabled:opacity-60`}
                />
                {fechaError ? (
                  <span id="fecha-cobro-ayuda" className="text-xs text-danger">
                    {fechaError}
                  </span>
                ) : null}
              </label>

              <div className="flex items-center gap-2">
                <ButtonPrimary
                  type="submit"
                  disabled={saving || (faltaLosDos && !honorario && !arancel)}
                  className="min-w-0 flex-1"
                >
                  {saving ? "Guardando…" : "Confirmar"}
                </ButtonPrimary>
                <ButtonOutline onClick={() => setOpen(false)} disabled={saving}>
                  Cancelar
                </ButtonOutline>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
          {errorMessage}
        </p>
      ) : null}

      <section aria-labelledby="recibos-titulo" className="flex flex-col gap-3 border-t border-border pt-3">
        <h3 id="recibos-titulo" className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Recibos
        </h3>
        {recibos.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-text-secondary">
            Sin recibos.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recibos.map((recibo) => {
              const conceptos = descripcionRecibo(recibo, integrantes, esGrupo);
              const anulado = recibo.estado === "cancelled";
              const ocupado = busyRecibo === recibo.id;
              const confirmando = anularId === recibo.id;
              return (
                <li
                  key={recibo.id}
                  aria-busy={ocupado}
                  className="flex flex-col gap-2 rounded-md bg-bg-page px-3 py-2"
                >
                  {confirmando ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-text-primary">¿Anular {recibo.reciboNumber}?</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`inline-flex min-h-11 items-center text-sm font-semibold text-danger disabled:opacity-50 ${interactiveFocusClass}`}
                          disabled={saving || ocupado}
                          onClick={() => void anular(recibo.id)}
                        >
                          {ocupado ? "Anulando…" : "Anular"}
                        </button>
                        <button
                          type="button"
                          className={`inline-flex min-h-11 items-center text-sm font-semibold text-text-secondary disabled:opacity-50 ${interactiveFocusClass}`}
                          disabled={saving || ocupado}
                          onClick={() => setAnularId(null)}
                        >
                          Volver
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm font-semibold ${
                            anulado ? "text-text-secondary line-through" : "text-text-primary"
                          }`}
                        >
                          {recibo.reciboNumber}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {conceptos}
                          {" · "}
                          {formatDateDisplay(recibo.fechaPago)}
                          {anulado ? " · Anulado" : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className={`inline-flex min-h-11 items-center px-1 text-sm font-semibold text-primary disabled:opacity-50 ${interactiveFocusClass}`}
                          aria-label={`Ver PDF ${recibo.reciboNumber}`}
                          disabled={ocupado}
                          onClick={() => void ver(recibo.id)}
                        >
                          {ocupado ? "Abriendo…" : "PDF"}
                        </button>
                        {canEdit && !anulado ? (
                          <button
                            type="button"
                            className={`inline-flex min-h-11 items-center px-1 text-sm font-semibold text-danger disabled:opacity-50 ${interactiveFocusClass}`}
                            aria-label={`Anular recibo ${recibo.reciboNumber}`}
                            disabled={saving || ocupado}
                            onClick={() => setAnularId(recibo.id)}
                          >
                            Anular
                          </button>
                        ) : null}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}

function ConceptoCheck({
  label,
  amount,
  checked,
  onChange,
}: {
  label: string;
  amount: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm border px-3 py-2 text-sm text-text-primary ${
        checked ? "border-primary bg-primary-soft" : "border-border bg-bg-card"
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        {label}
      </span>
      <span className="shrink-0 tabular-nums">{amount}</span>
    </label>
  );
}
