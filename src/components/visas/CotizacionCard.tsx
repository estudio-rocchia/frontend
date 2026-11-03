"use client";

import Link from "next/link";
import { useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CotizacionVisa, IntegranteVisa, ReciboVisa } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { formatUsd } from "@/lib/visas/labels";

type CobroLinea = {
  key: string;
  concepto: string;
  quien: string;
  nota: string | null;
  amount: number;
  pagadoEn: string | null;
  href: string | null;
};

function cobroBadge(cobradas: number, pendientes: number): {
  label: string;
  variant: "success" | "warning";
} {
  if (pendientes === 0 && cobradas > 0) return { label: "Cobrada", variant: "success" };
  if (cobradas === 0) return { label: "Sin cobrar", variant: "warning" };
  return { label: "Cobro parcial", variant: "warning" };
}

function buildCobroLineas({
  cotizacion,
  integrantes,
  tramiteId,
  honorarioPagadoEn,
  arancelPagadoEn,
}: {
  cotizacion: CotizacionVisa;
  integrantes: IntegranteVisa[];
  tramiteId: number;
  honorarioPagadoEn: string | null;
  arancelPagadoEn: string | null;
}): CobroLinea[] {
  const esGrupo = cotizacion.personas > 1;
  const actual = integrantes.find((item) => item.id === tramiteId);
  const nombreActual = actual ? personaDisplayName(actual.persona) : null;
  const quienEstudio = esGrupo ? "Grupo" : (nombreActual ?? "Esta persona");
  const lineas: CobroLinea[] = [];

  if (cotizacion.honorarioTotalUsd > 0) {
    lineas.push({
      key: "honorario",
      concepto: "Honorario",
      quien: quienEstudio,
      nota: esGrupo ? `${formatUsd(cotizacion.honorarioUnitarioUsd)} × ${cotizacion.personas}` : null,
      amount: cotizacion.honorarioTotalUsd,
      pagadoEn: honorarioPagadoEn,
      href: null,
    });
  }

  if (cotizacion.cambiosTurno > 0 && cotizacion.cambioTurnoTotalUsd > 0) {
    lineas.push({
      key: "cambios",
      concepto: "Cambios de turno",
      quien: quienEstudio,
      nota: `${formatUsd(cotizacion.cambioTurnoUnitarioUsd)} × ${cotizacion.cambiosTurno}`,
      amount: cotizacion.cambioTurnoTotalUsd,
      pagadoEn: honorarioPagadoEn,
      href: null,
    });
  }

  const aranceles = [...integrantes].sort((a, b) => {
    if (a.id === tramiteId) return -1;
    if (b.id === tramiteId) return 1;
    return a.id - b.id;
  });

  if (aranceles.length > 0) {
    for (const integrante of aranceles) {
      const esActual = integrante.id === tramiteId;
      lineas.push({
        key: `arancel-${integrante.id}`,
        concepto: "Arancel",
        quien: personaDisplayName(integrante.persona),
        nota: esActual ? "Esta ficha" : null,
        amount: cotizacion.arancelUnitarioUsd,
        pagadoEn: integrante.arancelPagadoEn,
        href: esActual ? null : `/visas/${integrante.id}`,
      });
    }
  } else if (cotizacion.arancelUnitarioUsd > 0) {
    lineas.push({
      key: "arancel",
      concepto: "Arancel",
      quien: nombreActual ?? "Esta persona",
      nota: null,
      amount: cotizacion.arancelUnitarioUsd,
      pagadoEn: arancelPagadoEn,
      href: null,
    });
  }

  return lineas;
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
  const lineas = buildCobroLineas({
    cotizacion,
    integrantes,
    tramiteId,
    honorarioPagadoEn,
    arancelPagadoEn,
  });
  const cobradas = lineas.filter((linea) => linea.pagadoEn);
  const pendientes = lineas.filter((linea) => !linea.pagadoEn);
  const totalCobrado = cobradas.reduce((sum, linea) => sum + linea.amount, 0);
  const totalPendiente = pendientes.reduce((sum, linea) => sum + linea.amount, 0);
  const badge = cobroBadge(cobradas.length, pendientes.length);
  const nombreActual = integrantes.find((item) => item.id === tramiteId);
  const quienActual = nombreActual ? personaDisplayName(nombreActual.persona) : null;
  const honorarioLabel = cotizacion.cambiosTurno > 0
    ? esGrupo
      ? "Honorario y cambios de turno del grupo"
      : quienActual
        ? `Honorario y cambios de turno de ${quienActual}`
        : "Honorario y cambios de turno"
    : esGrupo
      ? "Honorario del grupo"
      : quienActual
        ? `Honorario de ${quienActual}`
        : "Honorario";
  const arancelLabel = quienActual ? `Arancel de ${quienActual}` : "Arancel";

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
      </div>

      {preview ? (
        <p id="cotizacion-preview" role="status" className="rounded-sm bg-warning-bg px-3 py-2 text-sm font-semibold text-warning">
          Vista previa. Guardá el grupo para cobrar.
        </p>
      ) : null}

      {saving ? <p className="sr-only" role="status">Guardando el cobro.</p> : null}

      <div className="flex flex-col gap-3">
        <div className="rounded-md bg-primary-soft px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Total</p>
          <p className="mt-1 text-[28px] font-bold leading-none tabular-nums text-primary">
            {formatUsd(cotizacion.totalUsd)}
          </p>
        </div>
        <dl className="flex flex-col gap-2">
          {cotizacion.honorarioTotalUsd > 0 ? (
            <QuoteLine
              title="Honorario"
              detail={
                esGrupo
                  ? `${formatUsd(cotizacion.honorarioUnitarioUsd)} × ${cotizacion.personas}`
                  : quienActual ?? undefined
              }
              amount={formatUsd(cotizacion.honorarioTotalUsd)}
            />
          ) : null}
          {cotizacion.cambiosTurno > 0 && cotizacion.cambioTurnoTotalUsd > 0 ? (
            <QuoteLine
              title="Cambios de turno"
              detail={`${formatUsd(cotizacion.cambioTurnoUnitarioUsd)} × ${cotizacion.cambiosTurno}`}
              amount={formatUsd(cotizacion.cambioTurnoTotalUsd)}
            />
          ) : null}
          {cotizacion.arancelTotalUsd > 0 ? (
            <QuoteLine
              title="Arancel"
              detail={
                esGrupo
                  ? `${formatUsd(cotizacion.arancelUnitarioUsd)} × ${cotizacion.personas}`
                  : quienActual ?? undefined
              }
              amount={formatUsd(cotizacion.arancelTotalUsd)}
            />
          ) : null}
        </dl>
      </div>

      <section aria-labelledby="cobro-titulo" className="flex flex-col gap-3 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-3">
          <h3 id="cobro-titulo" className="text-[15px] font-semibold text-text-primary">
            Cobro
          </h3>
          <div aria-live="polite">
            <StatusBadge label={badge.label} variant={badge.variant} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-success-bg px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-success">Cobrado</p>
            <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-success">
              {formatUsd(totalCobrado)}
            </p>
          </div>
          <div className="rounded-md bg-warning-bg px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Pendiente</p>
            <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-warning">
              {formatUsd(totalPendiente)}
            </p>
          </div>
        </div>
        <CobroLista titulo="Ya cobrado" lineas={cobradas} vacio="Todavía no se cobró nada." />
        <CobroLista titulo="Falta cobrar" lineas={pendientes} vacio="No queda nada por cobrar." />
      </section>

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

function QuoteLine({ title, detail, amount }: { title: string; detail?: string; amount: string }) {
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

function CobroLista({
  titulo,
  lineas,
  vacio,
}: {
  titulo: string;
  lineas: CobroLinea[];
  vacio: string;
}) {
  const tituloId = titulo === "Ya cobrado" ? "cobrado-titulo" : "pendiente-titulo";
  return (
    <section aria-labelledby={tituloId} className="flex flex-col gap-2">
      <h3 id={tituloId} className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {titulo}
      </h3>
      {lineas.length === 0 ? (
        <p className="text-sm text-text-secondary">{vacio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lineas.map((linea) => {
            const pagado = Boolean(linea.pagadoEn);
            const nombre = linea.href ? (
              <Link
                href={linea.href}
                className={`block truncate text-sm font-semibold hover:underline ${interactiveFocusClass} ${
                  pagado ? "text-success" : "text-primary"
                }`}
              >
                {linea.quien}
              </Link>
            ) : (
              <span className={`block truncate text-sm font-semibold ${pagado ? "text-success" : "text-text-primary"}`}>
                {linea.quien}
              </span>
            );
            return (
              <li
                key={linea.key}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 ${
                  pagado ? "bg-success-bg" : "bg-warning-bg"
                }`}
              >
                <span className="min-w-0">
                  <span className={`block text-[11px] font-semibold uppercase tracking-wide ${pagado ? "text-success" : "text-warning"}`}>
                    {linea.concepto}
                  </span>
                  {nombre}
                  <span className={`block text-xs ${pagado ? "text-success" : "text-text-secondary"}`}>
                    {[linea.nota, pagado ? `El ${formatDateDisplay(linea.pagadoEn ?? "")}` : "Pendiente"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${pagado ? "text-success" : "text-text-primary"}`}>
                  {formatUsd(linea.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
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
