"use client";

import Link from "next/link";
import { useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ConceptoCotizadoVisa, CotizacionVisa, IntegranteVisa, ReciboVisa } from "@/lib/api/types";
import { formatDateDisplay, personaDisplayName } from "@/lib/format";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { formatArs, formatUsd } from "@/lib/visas/labels";

type CobroLinea = {
  key: string;
  concepto: string;
  quien: string;
  nota: string | null;
  amount: number;
  moneda: "usd" | "ars";
  pagadoEn: string | null;
  href: string | null;
};

function formatMoneda(moneda: "usd" | "ars" | undefined, amount: number) {
  return moneda === "ars" ? formatArs(amount) : formatUsd(amount);
}

function CobroImporte({ usd, ars }: { usd: number; ars: number }) {
  if (ars > 0 && usd === 0) {
    return <span className="shrink-0 tabular-nums">{formatArs(ars)}</span>;
  }
  if (usd > 0 && ars === 0) {
    return <span className="shrink-0 tabular-nums">{formatUsd(usd)}</span>;
  }
  if (usd > 0 && ars > 0) {
    return (
      <span className="shrink-0 text-right tabular-nums">
        <span className="block">{formatUsd(usd)}</span>
        <span className="block text-xs font-semibold">{formatArs(ars)}</span>
      </span>
    );
  }
  return <span className="shrink-0 tabular-nums">{formatUsd(0)}</span>;
}

function conceptosDe(cotizacion: CotizacionVisa): ConceptoCotizadoVisa[] {
  return cotizacion.conceptos ?? [];
}

function arancelDeEstaPersonaUsd(cotizacion: CotizacionVisa): number {
  const extras = conceptosDe(cotizacion)
    .filter((item) => item.destino === "consulado" && item.aplicado)
    .reduce((sum, item) => sum + item.montoUsd, 0);
  return cotizacion.arancelUnitarioUsd + extras;
}

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

  const honorarioMonto = cotizacion.honorarioMoneda === "ars" ? (cotizacion.honorarioTotalArs ?? 0) : cotizacion.honorarioTotalUsd;
  const honorarioUnitario = cotizacion.honorarioMoneda === "ars" ? (cotizacion.honorarioUnitarioArs ?? 0) : cotizacion.honorarioUnitarioUsd;
  if (honorarioMonto > 0) {
    lineas.push({
      key: "honorario",
      concepto: "Honorario",
      quien: quienEstudio,
      nota: esGrupo ? `${formatMoneda(cotizacion.honorarioMoneda, honorarioUnitario)} × ${cotizacion.personas}` : null,
      amount: honorarioMonto,
      moneda: cotizacion.honorarioMoneda === "ars" ? "ars" : "usd",
      pagadoEn: honorarioPagadoEn,
      href: null,
    });
  }

  const cambioMonto = cotizacion.cambioTurnoMoneda === "ars" ? (cotizacion.cambioTurnoTotalArs ?? 0) : cotizacion.cambioTurnoTotalUsd;
  const cambioUnitario = cotizacion.cambioTurnoMoneda === "ars" ? (cotizacion.cambioTurnoUnitarioArs ?? 0) : cotizacion.cambioTurnoUnitarioUsd;
  if (cotizacion.cambiosTurno > 0 && cambioMonto > 0) {
    lineas.push({
      key: "cambios",
      concepto: "Cambios de turno",
      quien: quienEstudio,
      nota: `${formatMoneda(cotizacion.cambioTurnoMoneda, cambioUnitario)} × ${cotizacion.cambiosTurno}`,
      amount: cambioMonto,
      moneda: cotizacion.cambioTurnoMoneda === "ars" ? "ars" : "usd",
      pagadoEn: honorarioPagadoEn,
      href: null,
    });
  }

  for (const concepto of conceptosDe(cotizacion)) {
    const totalExtra = concepto.moneda === "ars" ? (concepto.totalArs ?? 0) : concepto.totalUsd;
    if (concepto.destino !== "estudio" || totalExtra <= 0) continue;
    lineas.push({
      key: `extra-${concepto.id}`,
      concepto: concepto.nombre,
      quien: quienEstudio,
      nota: concepto.alcance === "persona" && concepto.cantidad > 1 ? `${formatMoneda(concepto.moneda, concepto.moneda === "ars" ? (concepto.montoArs ?? 0) : concepto.montoUsd)} × ${concepto.cantidad}` : null,
      amount: concepto.moneda === "ars" ? (concepto.totalArs ?? 0) : concepto.totalUsd,
      moneda: concepto.moneda === "ars" ? "ars" : "usd",
      pagadoEn: honorarioPagadoEn,
      href: null,
    });
  }

  const aranceles = [...integrantes].sort((a, b) => {
    if (a.id === tramiteId) return -1;
    if (b.id === tramiteId) return 1;
    return a.id - b.id;
  });

  const arancelUnitario = cotizacion.arancelMoneda === "ars" ? (cotizacion.arancelUnitarioArs ?? 0) : cotizacion.arancelUnitarioUsd;
  if (aranceles.length > 0 && arancelUnitario > 0) {
    for (const integrante of aranceles) {
      const esActual = integrante.id === tramiteId;
      lineas.push({
        key: `arancel-${integrante.id}`,
        concepto: "Arancel",
        quien: personaDisplayName(integrante.persona),
        nota: esActual ? "Esta ficha" : null,
        amount: cotizacion.arancelMoneda === "ars" ? (cotizacion.arancelUnitarioArs ?? 0) : cotizacion.arancelUnitarioUsd,
        moneda: cotizacion.arancelMoneda === "ars" ? "ars" : "usd",
        pagadoEn: integrante.arancelPagadoEn,
        href: esActual ? null : `/visas/${integrante.id}`,
      });
    }
  } else if (arancelUnitario > 0) {
    lineas.push({
      key: "arancel",
      concepto: "Arancel",
      quien: nombreActual ?? "Esta persona",
      nota: null,
        amount: cotizacion.arancelMoneda === "ars" ? (cotizacion.arancelUnitarioArs ?? 0) : cotizacion.arancelUnitarioUsd,
        moneda: cotizacion.arancelMoneda === "ars" ? "ars" : "usd",
        pagadoEn: arancelPagadoEn,
      href: null,
    });
  }

  for (const concepto of conceptosDe(cotizacion)) {
    const unitarioExtra = concepto.moneda === "ars" ? (concepto.montoArs ?? 0) : concepto.montoUsd;
    if (concepto.destino !== "consulado" || !concepto.aplicado || unitarioExtra <= 0) continue;
    if (aranceles.length > 0) {
      for (const integrante of aranceles) {
        const esActual = integrante.id === tramiteId;
        lineas.push({
          key: `extra-${concepto.id}-${integrante.id}`,
          concepto: concepto.nombre,
          quien: personaDisplayName(integrante.persona),
          nota: esActual ? "Esta ficha" : null,
          amount: concepto.moneda === "ars" ? (concepto.montoArs ?? 0) : concepto.montoUsd,
          moneda: concepto.moneda === "ars" ? "ars" : "usd",
          pagadoEn: integrante.arancelPagadoEn,
          href: esActual ? null : `/visas/${integrante.id}`,
        });
      }
    } else {
      lineas.push({
        key: `extra-${concepto.id}`,
        concepto: concepto.nombre,
        quien: nombreActual ?? "Esta persona",
        nota: null,
        amount: concepto.moneda === "ars" ? (concepto.montoArs ?? 0) : concepto.montoUsd,
        moneda: concepto.moneda === "ars" ? "ars" : "usd",
        pagadoEn: arancelPagadoEn,
        href: null,
      });
    }
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
  onAplicarHonorarios,
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
  onAplicarHonorarios?: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [honorario, setHonorario] = useState(false);
  const [arancel, setArancel] = useState(false);
  const [fecha, setFecha] = useState(todayIso);
  const [fechaError, setFechaError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [busyRecibo, setBusyRecibo] = useState<number | null>(null);
  const [anularId, setAnularId] = useState<number | null>(null);

  const personasLabel = cotizacion.personas === 1 ? "1 persona" : `${cotizacion.personas} personas`;
  const honorarioListo = Boolean(honorarioPagadoEn);
  const arancelListo = Boolean(arancelPagadoEn);
  const arancelCobroUsd = arancelDeEstaPersonaUsd(cotizacion);
  const arancelCobroArs =
    (cotizacion.arancelUnitarioArs ?? 0) +
    conceptosDe(cotizacion)
      .filter((item) => item.destino === "consulado" && item.aplicado)
      .reduce((sum, item) => sum + (item.montoArs ?? 0), 0);
  const extrasEstudio = conceptosDe(cotizacion).some((item) => item.destino === "estudio" && item.totalUsd > 0);
  const extrasConsulado = conceptosDe(cotizacion).some((item) => item.destino === "consulado" && item.aplicado && item.montoUsd > 0);
  const arancelPagado = Boolean(arancelPagadoEn) || integrantes.some((item) => item.arancelPagadoEn);
  const faltaHonorario = !honorarioListo && (cotizacion.totalEstudioUsd > 0 || (cotizacion.totalEstudioArs ?? 0) > 0);
  const faltaArancel = !arancelListo && (arancelCobroUsd > 0 || arancelCobroArs > 0);
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
  const totalCobrado = cobradas.filter((linea) => linea.moneda !== "ars").reduce((sum, linea) => sum + linea.amount, 0);
  const totalCobradoArs = cobradas.filter((linea) => linea.moneda === "ars").reduce((sum, linea) => sum + linea.amount, 0);
  const totalPendiente = pendientes.filter((linea) => linea.moneda !== "ars").reduce((sum, linea) => sum + linea.amount, 0);
  const totalPendienteArs = pendientes.filter((linea) => linea.moneda === "ars").reduce((sum, linea) => sum + linea.amount, 0);
  const badge = cobroBadge(cobradas.length, pendientes.length);
  const nombreActual = integrantes.find((item) => item.id === tramiteId);
  const quienActual = nombreActual ? personaDisplayName(nombreActual.persona) : null;
  function alternarOpcional(id: string, checked: boolean) {
    const ids = conceptosDe(cotizacion)
      .filter((concepto) => concepto.aplicado && concepto.id !== id)
      .map((concepto) => concepto.id);
    onAplicarHonorarios?.(checked ? [...ids, id] : ids);
  }

  const honorarioBase = cotizacion.cambiosTurno > 0
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
  const honorarioLabel = extrasEstudio
    ? esGrupo
      ? "Importes del estudio"
      : quienActual
        ? `Importes del estudio de ${quienActual}`
        : "Importes del estudio"
    : honorarioBase;
  const arancelLabel = extrasConsulado
    ? cotizacion.arancelUnitarioUsd > 0
      ? quienActual
        ? `Arancel y otros de ${quienActual}`
        : "Arancel y otros importes"
      : quienActual
        ? `Otros importes de ${quienActual}`
        : "Otros importes del consulado"
    : quienActual
      ? `Arancel de ${quienActual}`
      : "Arancel";

  function abrir() {
    setHonorario(faltaHonorario);
    setArancel(faltaArancel);
    setFecha(todayIso());
    setFechaError(null);
    setSelectionError(null);
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
    if (faltaLosDos && !honorario && !arancel) {
      setSelectionError("Marcá al menos un concepto.");
      return;
    }
    if (!cobraHonorario && !cobraArancel) return;
    setSelectionError(null);
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
            {(cotizacion.totalUsd > 0 || (cotizacion.totalArs ?? 0) === 0) ? formatUsd(cotizacion.totalUsd) : null}
            {(cotizacion.totalArs ?? 0) > 0 ? (
              <span className={cotizacion.totalUsd > 0 ? "mt-1 block text-lg" : undefined}>{formatArs(cotizacion.totalArs ?? 0)}</span>
            ) : null}
          </p>
        </div>
        <dl className="flex flex-col gap-2">
          {(cotizacion.honorarioMoneda === "ars" ? (cotizacion.honorarioTotalArs ?? 0) : cotizacion.honorarioTotalUsd) > 0 ? (
            <QuoteLine
              title="Honorario"
              detail={
                esGrupo
                  ? `${formatMoneda(cotizacion.honorarioMoneda, cotizacion.honorarioMoneda === "ars" ? (cotizacion.honorarioUnitarioArs ?? 0) : cotizacion.honorarioUnitarioUsd)} × ${cotizacion.personas}`
                  : quienActual ?? undefined
              }
              amount={formatMoneda(
                cotizacion.honorarioMoneda,
                cotizacion.honorarioMoneda === "ars" ? (cotizacion.honorarioTotalArs ?? 0) : cotizacion.honorarioTotalUsd,
              )}
            />
          ) : null}
          <ConceptosOpcionales
            items={conceptosDe(cotizacion).filter((item) => item.categoria === "honorario")}
            personas={cotizacion.personas}
            canEdit={canEdit && Boolean(onAplicarHonorarios)}
            saving={saving || preview}
            honorarioPagado={Boolean(honorarioPagadoEn)}
            arancelPagado={arancelPagado}
            onToggle={alternarOpcional}
          />
          {cotizacion.cambiosTurno > 0 && (cotizacion.cambioTurnoMoneda === "ars" ? (cotizacion.cambioTurnoTotalArs ?? 0) : cotizacion.cambioTurnoTotalUsd) > 0 ? (
            <QuoteLine
              title="Cambios de turno"
              detail={`${formatMoneda(cotizacion.cambioTurnoMoneda, cotizacion.cambioTurnoMoneda === "ars" ? (cotizacion.cambioTurnoUnitarioArs ?? 0) : cotizacion.cambioTurnoUnitarioUsd)} × ${cotizacion.cambiosTurno}`}
              amount={formatMoneda(
                cotizacion.cambioTurnoMoneda,
                cotizacion.cambioTurnoMoneda === "ars" ? (cotizacion.cambioTurnoTotalArs ?? 0) : cotizacion.cambioTurnoTotalUsd,
              )}
            />
          ) : null}
          {(cotizacion.arancelMoneda === "ars" ? (cotizacion.arancelTotalArs ?? 0) : cotizacion.arancelTotalUsd) > 0 ? (
            <QuoteLine
              title="Arancel"
              detail={
                esGrupo
                  ? `${formatMoneda(cotizacion.arancelMoneda, cotizacion.arancelMoneda === "ars" ? (cotizacion.arancelUnitarioArs ?? 0) : cotizacion.arancelUnitarioUsd)} × ${cotizacion.personas}`
                  : quienActual ?? undefined
              }
              amount={formatMoneda(
                cotizacion.arancelMoneda,
                cotizacion.arancelMoneda === "ars" ? (cotizacion.arancelTotalArs ?? 0) : cotizacion.arancelTotalUsd,
              )}
            />
          ) : null}
          <ConceptosOpcionales
            items={conceptosDe(cotizacion).filter((item) => item.categoria === "otro")}
            personas={cotizacion.personas}
            canEdit={canEdit && Boolean(onAplicarHonorarios)}
            saving={saving || preview}
            honorarioPagado={Boolean(honorarioPagadoEn)}
            arancelPagado={arancelPagado}
            onToggle={alternarOpcional}
          />
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
              {totalCobradoArs > 0 && totalCobrado === 0 ? formatArs(totalCobradoArs) : formatUsd(totalCobrado)}
            {totalCobrado > 0 && totalCobradoArs > 0 ? (
              <span className="mt-1 block text-sm font-semibold">{formatArs(totalCobradoArs)}</span>
            ) : null}
            </p>
          </div>
          <div className="rounded-md bg-warning-bg px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Pendiente</p>
            <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-warning">
              {totalPendienteArs > 0 && totalPendiente === 0 ? formatArs(totalPendienteArs) : formatUsd(totalPendiente)}
            {totalPendiente > 0 && totalPendienteArs > 0 ? (
              <span className="mt-1 block text-sm font-semibold">{formatArs(totalPendienteArs)}</span>
            ) : null}
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
                <fieldset
                  className="flex flex-col gap-2"
                  disabled={saving}
                  aria-invalid={Boolean(selectionError)}
                  aria-describedby={selectionError ? "cobro-seleccion-ayuda" : undefined}
                >
                  <legend className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                    Qué se pagó
                  </legend>
                  <ConceptoCheck
                    label={honorarioLabel}
                    usd={cotizacion.totalEstudioUsd}
                    ars={cotizacion.totalEstudioArs ?? 0}
                    checked={honorario}
                    onChange={(checked) => {
                      setHonorario(checked);
                      setSelectionError(null);
                    }}
                  />
                  <ConceptoCheck
                    label={arancelLabel}
                    usd={arancelCobroUsd}
                    ars={arancelCobroArs}
                    checked={arancel}
                    onChange={(checked) => {
                      setArancel(checked);
                      setSelectionError(null);
                    }}
                  />
                  {selectionError ? (
                    <span id="cobro-seleccion-ayuda" className="text-xs text-danger">
                      {selectionError}
                    </span>
                  ) : null}
                </fieldset>
              ) : (
                <p className="flex items-baseline justify-between gap-3 text-sm text-text-primary">
                  <span className="font-semibold">{faltaHonorario ? honorarioLabel : arancelLabel}</span>
                  {faltaHonorario ? (
                    <CobroImporte usd={cotizacion.totalEstudioUsd} ars={cotizacion.totalEstudioArs ?? 0} />
                  ) : (
                    <CobroImporte usd={arancelCobroUsd} ars={arancelCobroArs} />
                  )}
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
                <ButtonPrimary type="submit" disabled={saving} className="min-w-0 flex-1">
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
                          title={recibo.reciboNumber}
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

function ConceptosOpcionales({
  items,
  personas,
  canEdit,
  saving,
  honorarioPagado,
  arancelPagado,
  onToggle,
}: {
  items: ConceptoCotizadoVisa[];
  personas: number;
  canEdit: boolean;
  saving: boolean;
  honorarioPagado: boolean;
  arancelPagado: boolean;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const visibles = items.filter((item) => canEdit || item.aplicado);
  if (visibles.length === 0) return null;

  return (
    <>
      {visibles.map((item) => {
        const enPesos = item.moneda === "ars";
        const unitario = enPesos ? (item.montoArs ?? 0) : item.montoUsd;
        const total = item.aplicado
          ? enPesos
            ? (item.totalArs ?? 0)
            : item.totalUsd
          : personas > 0 && item.alcance === "persona"
            ? unitario * personas
            : unitario;
        const formatImporte = enPesos ? formatArs : formatUsd;
        const detalle = item.alcance === "persona" && personas > 1 ? `${formatImporte(unitario)} × ${personas}` : undefined;
        const bloqueado = item.destino === "consulado" ? arancelPagado : honorarioPagado;

        return (
          <div key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {canEdit ? (
                <input
                  type="checkbox"
                  checked={item.aplicado === true}
                  disabled={saving || bloqueado}
                  aria-label={item.nombre}
                  onChange={(event) => onToggle(item.id, event.target.checked)}
                  className="h-4 w-4 shrink-0 accent-primary disabled:opacity-60"
                />
              ) : null}
              <span className="min-w-0">
                <span className={`block font-medium ${item.aplicado ? "text-text-primary" : "text-text-secondary"}`}>
                  {item.nombre}
                </span>
                {detalle ? <span className="block text-xs text-text-secondary">{detalle}</span> : null}
              </span>
            </span>
            <span className={`shrink-0 tabular-nums ${item.aplicado ? "text-text-primary" : "text-text-secondary"}`}>
              {formatImporte(total)}
            </span>
          </div>
        );
      })}
    </>
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
                title={linea.quien}
              >
                {linea.quien}
              </Link>
            ) : (
              <span
                className={`block truncate text-sm font-semibold ${pagado ? "text-success" : "text-text-primary"}`}
                title={linea.quien}
              >
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
                  {formatMoneda(linea.moneda, linea.amount)}
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
  usd,
  ars,
  checked,
  onChange,
}: {
  label: string;
  usd: number;
  ars: number;
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
      <CobroImporte usd={usd} ars={ars} />
    </label>
  );
}
