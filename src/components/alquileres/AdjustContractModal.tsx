"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import { AdjustmentIndicesReference } from "@/components/alquileres/AdjustmentIndicesReference";
import {
  monthlyVariation,
  useAdjustmentIndicesReference,
} from "@/components/alquileres/useAdjustmentIndicesReference";
import { VariationValue } from "@/components/indices/VariationValue";
import { monthOverMonthRatio } from "@/lib/indices/variations";
import { AdjustmentUnpaidCuotasNotice } from "@/components/alquileres/AdjustmentUnpaidCuotasNotice";
import { useContratoAdjustmentPreview } from "@/components/alquileres/useContratoAdjustmentPreview";
import type { ContratoDetail, IndiceCode } from "@/lib/api/types";
import {
  formatIndexValue,
  formatMoney,
  formatMonthYear,
  moneyClassName,
  moneyDisplaySizeClass,
  personaDisplayName,
} from "@/lib/format";
import {
  DEFAULT_DEPOSITO_PLAN_CUOTAS,
  type DepositoPlanChoice,
} from "@/lib/alquileres/deposito-plan";
import {
  ADJUSTMENT_INDICES,
  adjustmentIndexLabel,
  contractualAdjustmentEnd,
  addMonthsToMonthYear,
  defaultAdjustmentHasta,
  fromIsoMonthDate,
  indiceCodeFromContrato,
  isAgreedAdjustmentContrato,
  isAdjustmentOverdue,
  isPublishedAdjustmentIndex,
  latestPublishedIndexMonth,
  rentVigenteDesde,
  toIsoMonthDate,
  type MonthYear,
} from "@/lib/rental-adjustment";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

export type AdjustContractSubmitInput = {
  fechaAjuste: string;
  montoNuevo?: number;
  actualizarDeposito?: boolean;
  depositoPlan?: DepositoPlanChoice;
};

const DEPOSITO_NO = "No actualizar";
const DEPOSITO_SI = "Sí, actualizar";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatAmountInput(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Agrupa los miles con punto mientras se escribe. La coma queda para los centavos. */
function formatAmountTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "");
  if (!cleaned) return "";
  const comma = cleaned.indexOf(",");
  const wholeDigits = (comma === -1 ? cleaned : cleaned.slice(0, comma)).replace(/\D/g, "");
  const whole = wholeDigits.replace(/^0+(?=\d)/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (comma === -1) return grouped;
  const frac = cleaned.slice(comma + 1).replace(/\D/g, "").slice(0, 2);
  return `${grouped || "0"},${frac}`;
}

function caretAfterSignificant(formatted: string, significantCount: number): number {
  if (significantCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d|,/.test(formatted[index] ?? "")) {
      seen += 1;
      if (seen === significantCount) return index + 1;
    }
  }
  return formatted.length;
}

/** Acepta 150000, 150.000 y 150.000,50. */
function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const [wholeRaw, fracRaw] = trimmed.replace(/[^\d.,]/g, "").split(",");
  const whole = (wholeRaw ?? "").replace(/\D/g, "");
  if (!whole) return null;
  const frac = (fracRaw ?? "").replace(/\D/g, "").slice(0, 2);
  const value = Number(frac ? `${whole}.${frac}` : whole);
  return Number.isFinite(value) ? value : null;
}

function formatCoefficient(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function ResultRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className={`text-[12px] ${emphasize ? "font-semibold text-primary" : "text-text-secondary"}`}>
        {label}
      </span>
      <span className={`tabular-nums ${emphasize ? "text-[15px] font-bold text-primary" : "text-[13px] font-semibold text-text-primary"} ${moneyClassName}`}>
        {value}
      </span>
    </div>
  );
}

function FactorBreakdown({
  currency,
  factor,
  montoAnterior,
  montoNuevo,
  manual,
  ipcFactors,
  indexDivision,
}: {
  currency: string;
  factor: string;
  montoAnterior: string;
  montoNuevo: string;
  manual: boolean;
  ipcFactors: { label: string; ratio: number | null; variation: string | null }[] | null;
  indexDivision: { desde: string; hasta: string; desdeLabel: string; hastaLabel: string } | null;
}) {
  const factorNum = Number.parseFloat(factor);
  const ipcReady =
    !manual &&
    ipcFactors !== null &&
    ipcFactors.length > 0 &&
    ipcFactors.every((item) => item.ratio !== null);

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-bg-card">
      {ipcReady && ipcFactors ? (
        <ul>
          {ipcFactors.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-text-primary">{item.label}</p>
                {index > 0 ? (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                    se multiplica
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-[13px] font-semibold tabular-nums text-text-primary">
                  {formatCoefficient(item.ratio ?? 0)}
                </p>
                <p className="text-[11px]">
                  <VariationValue value={item.variation} />
                </p>
              </div>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 bg-primary-soft px-3 py-2.5">
            <span className="text-[12px] font-semibold text-primary">Coeficiente</span>
            <span className="text-[15px] font-bold tabular-nums text-primary">
              {formatCoefficient(factorNum)}
            </span>
          </li>
        </ul>
      ) : null}

      {!ipcReady && indexDivision && !manual ? (
        <div className="border-b border-border">
          <ResultRow label={indexDivision.desdeLabel} value={indexDivision.desde} />
          <div className="border-t border-border">
            <ResultRow label={indexDivision.hastaLabel} value={indexDivision.hasta} />
          </div>
          <div className="border-t border-border bg-primary-soft">
            <ResultRow label="Coeficiente (último / primero)" value={formatCoefficient(factorNum)} emphasize />
          </div>
        </div>
      ) : null}

      <div className={ipcReady || (indexDivision && !manual) ? "border-t border-border" : ""}>
        <ResultRow label="Alquiler actual" value={formatMoney(montoAnterior, currency)} />
        <div className="border-t border-border">
          <ResultRow label="× Coeficiente" value={formatCoefficient(factorNum)} />
        </div>
        <div className="border-t border-border bg-primary-soft">
          <ResultRow label="= Nuevo alquiler" value={formatMoney(montoNuevo, currency)} emphasize />
        </div>
      </div>
    </div>
  );
}

function sameMoney(amount: number, canonical: string): boolean {
  return Math.round(amount * 100) === Math.round(Number(canonical) * 100);
}

/** Meses de IPC que entran al producto: el mes siguiente a `desde` hasta `hasta`, inclusive. */
function ipcVariationMonths(desdeIso: string, hastaIso: string): MonthYear[] {
  const months: MonthYear[] = [];
  let cursor = addMonthsToMonthYear(fromIsoMonthDate(desdeIso), 1);
  const end = toIsoMonthDate(fromIsoMonthDate(hastaIso));
  while (toIsoMonthDate(cursor) <= end && months.length < 36) {
    months.push(cursor);
    cursor = addMonthsToMonthYear(cursor, 1);
  }
  return months;
}

function formatMonthList(months: MonthYear[]): string {
  const labels = months.map((month) => `${MONTHS[month.mes - 1]} ${month.anio}`);
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

function defaultFechaAjusteMonth(
  contrato: ContratoDetail,
  ultimoAjusteEn?: string | null,
): MonthYear {
  return defaultAdjustmentHasta(contrato, ultimoAjusteEn);
}

export function AdjustContractModal({
  open,
  contrato,
  token,
  ultimoAjusteEn,
  onClose,
  onSubmit,
  submitting = false,
}: {
  open: boolean;
  contrato: ContratoDetail | null;
  token: string | null;
  ultimoAjusteEn?: string | null;
  onClose: () => void;
  onSubmit: (input: AdjustContractSubmitInput) => void;
  submitting?: boolean;
}) {
  const [fechaAjusteMonth, setFechaAjusteMonth] = useState<MonthYear | null>(null);
  const [montoNuevoInput, setMontoNuevoInput] = useState("");
  const montoInputRef = useRef<HTMLInputElement>(null);
  const [montoDirty, setMontoDirty] = useState(false);
  const [montoCalculado, setMontoCalculado] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [depositoChoice, setDepositoChoice] = useState<string | null>(null);
  const [crearPlanDeposito, setCrearPlanDeposito] = useState(true);
  const [cantidadCuotasDeposito, setCantidadCuotasDeposito] = useState(
    String(DEFAULT_DEPOSITO_PLAN_CUOTAS),
  );

  useEffect(() => {
    if (!open || !contrato) return;
    setFechaAjusteMonth(defaultFechaAjusteMonth(contrato, ultimoAjusteEn));
    setMontoNuevoInput("");
    setMontoDirty(false);
    setMontoCalculado(null);
    setShowDetails(false);
    setDepositoChoice(null);
    setCrearPlanDeposito(true);
    setCantidadCuotasDeposito(String(DEFAULT_DEPOSITO_PLAN_CUOTAS));
  }, [contrato, open, ultimoAjusteEn]);

  const fechaAjuste = fechaAjusteMonth ? toIsoMonthDate(fechaAjusteMonth) : null;
  const requiresManualMonto = contrato ? isAgreedAdjustmentContrato(contrato) : false;
  const montoNuevoParsed = parseAmountInput(montoNuevoInput);
  const montoNuevoAcordado =
    requiresManualMonto && montoNuevoParsed !== null && montoNuevoParsed > 0
      ? montoNuevoParsed
      : null;
  const montoDistintoDelIndice =
    !requiresManualMonto &&
    montoDirty &&
    montoNuevoParsed !== null &&
    montoNuevoParsed > 0 &&
    montoCalculado !== null &&
    !sameMoney(montoNuevoParsed, montoCalculado);

  const { preview, loading, error, unpaidPeriods, previewUsesManualMonto } =
    useContratoAdjustmentPreview({
      open,
      contratoId: contrato?.id ?? null,
      token,
      fechaAjuste,
      montoNuevo: requiresManualMonto
        ? montoNuevoAcordado
        : montoDistintoDelIndice
          ? montoNuevoParsed
          : null,
      requiresManualMonto,
    });

  useEffect(() => {
    setMontoDirty(false);
    setMontoCalculado(null);
  }, [fechaAjuste]);

  useEffect(() => {
    if (!preview || requiresManualMonto || previewUsesManualMonto || montoDirty) return;
    setMontoCalculado(preview.montoNuevo);
    setMontoNuevoInput(formatAmountInput(preview.montoNuevo));
  }, [preview, requiresManualMonto, previewUsesManualMonto, montoDirty]);

  const contratoIndexForReference = contrato ? indiceCodeFromContrato(contrato) : null;
  const referenceCodes: IndiceCode[] =
    contrato && contratoIndexForReference && isPublishedAdjustmentIndex(contratoIndexForReference)
      ? [contratoIndexForReference]
      : contrato
        ? [...ADJUSTMENT_INDICES]
        : [];
  const indicesReference = useAdjustmentIndicesReference(
    open && Boolean(contrato),
    token,
    referenceCodes,
  );

  if (!contrato || !fechaAjusteMonth) return null;

  const inmuebleLabel = contrato.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato.inquilino ? personaDisplayName(contrato.inquilino) : "—";
  const currency = contrato.codigoMoneda.trim();
  const contratoIndex = contratoIndexForReference;
  const indiceCode = adjustmentIndexLabel(contratoIndex ?? "ICL");
  const freq = contrato.frecuenciaAjusteMeses ?? 12;
  const vigenteDesde = rentVigenteDesde(contrato, ultimoAjusteEn);
  const contractualEnd = contractualAdjustmentEnd(contrato, ultimoAjusteEn);
  const maxPublished = latestPublishedIndexMonth();
  const overdue = isAdjustmentOverdue(contrato, ultimoAjusteEn);
  const cuotasDeposito = Number.parseInt(cantidadCuotasDeposito, 10);
  const cuotasDepositoValidas =
    Number.isInteger(cuotasDeposito) && cuotasDeposito >= 1 && cuotasDeposito <= 120;
  const cuotaDepositoEstimada =
    preview?.actualizacionDeposito.requiereCobro && cuotasDepositoValidas
      ? formatMoney(
          String(Number.parseFloat(preview.actualizacionDeposito.diferencia) / cuotasDeposito),
          currency,
        )
      : null;
  const ofreceDeposito = Boolean(preview?.actualizacionDeposito.requiereCobro);
  const actualizarDeposito = depositoChoice === DEPOSITO_SI;
  const depositoSinElegir = ofreceDeposito && depositoChoice === null;
  const depositoPlanInvalido =
    ofreceDeposito && actualizarDeposito && crearPlanDeposito && !cuotasDepositoValidas;
  const montoIndiceInvalido =
    !requiresManualMonto &&
    Boolean(preview) &&
    (montoNuevoParsed === null || montoNuevoParsed <= 0);

  const usesMonthlyProduct = contratoIndex === "IPC" || contratoIndex === "CAC";
  const ipcMonths =
    usesMonthlyProduct && preview
      ? ipcVariationMonths(preview.periodoDesde, preview.periodoHasta)
      : [];
  const ipcRows =
    usesMonthlyProduct && contratoIndex
      ? indicesReference.items.find((item) => item.code === contratoIndex)?.rows ?? []
      : [];
  const ipcMonthList = formatMonthList(ipcMonths);

  const detailsNote = requiresManualMonto
    ? `Ingresá el nuevo alquiler acordado entre las partes para el período de ${freq} meses.`
    : usesMonthlyProduct
      ? ipcMonthList
        ? "Cada coeficiente es 1 más la variación de ese mes. Esos números se multiplican y el producto se aplica al alquiler."
        : `Se multiplican los últimos ${freq} ${indiceCode} mensuales. Los porcentajes no se suman: el alquiler nuevo es el actual por ese producto.`
      : contratoIndex === "ICL"
        ? "El coeficiente es el ICL de la fecha de actualización dividido el ICL del inicio o del último ajuste."
        : overdue
          ? `El ajuste debía aplicarse en ${formatMonthYear(contractualEnd.anio, contractualEnd.mes)}. Podés usar el último ${indiceCode} publicado (${formatMonthYear(maxPublished.anio, maxPublished.mes)}).`
          : `Período de ${freq} meses desde ${formatMonthYear(vigenteDesde.anio, vigenteDesde.mes)}.`;

  function restoreCalculatedAmount() {
    if (!montoCalculado) return;
    setMontoDirty(false);
    setMontoNuevoInput(formatAmountInput(montoCalculado));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar alquiler"
      subtitle={`${inmuebleLabel} · ${inquilinoLabel}`}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
            Cancelar
          </ButtonOutline>
          <ButtonPrimary
            type="button"
            disabled={
              !preview ||
              Boolean(error) ||
              Boolean(unpaidPeriods?.length) ||
              loading ||
              submitting ||
              !fechaAjuste ||
              depositoSinElegir ||
              depositoPlanInvalido ||
              montoIndiceInvalido
            }
            onClick={() => {
              if (!preview || !fechaAjuste || depositoSinElegir || depositoPlanInvalido) return;
              if (montoIndiceInvalido) return;
              const input: AdjustContractSubmitInput = {
                fechaAjuste: preview.fechaAjuste,
                montoNuevo: requiresManualMonto
                  ? montoNuevoAcordado ?? undefined
                  : montoDistintoDelIndice && montoNuevoParsed
                    ? montoNuevoParsed
                    : undefined,
                actualizarDeposito: ofreceDeposito ? actualizarDeposito : false,
              };
              if (ofreceDeposito && actualizarDeposito) {
                input.depositoPlan = {
                  crearPlan: crearPlanDeposito,
                  cantidadCuotas: cuotasDeposito,
                };
              }
              onSubmit(input);
            }}
          >
            {submitting ? "Aplicando…" : "Confirmar ajuste"}
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-text-secondary">
          {requiresManualMonto ? (
            <>
              Ajuste <span className="font-semibold text-text-primary">acordado entre partes</span>
            </>
          ) : (
            <>
              Índice <span className="font-semibold text-text-primary">{indiceCode}</span>
            </>
          )}{" "}
          · cada {freq} meses
        </p>

        <AdjustmentIndicesReference
          codes={referenceCodes}
          items={indicesReference.items}
          loading={indicesReference.loading}
          error={indicesReference.error}
        />

        {requiresManualMonto ? (
          <FormField
            label={`Nuevo alquiler mensual (${currency})`}
            value={montoNuevoInput}
            onChange={(value) => setMontoNuevoInput(formatAmountTyping(value))}
            placeholder="Monto acordado con inquilino y propietario"
          />
        ) : null}

        {unpaidPeriods?.length ? (
          <AdjustmentUnpaidCuotasNotice periods={unpaidPeriods} />
        ) : null}

        <div className="rounded-md border border-border bg-primary-soft px-5 py-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Alquiler actual
          </p>
          <p className={`mt-2 text-xl font-semibold text-text-primary ${moneyClassName}`}>
            {formatMoney(contrato.montoAlquiler, currency)}
          </p>

          {loading && !preview ? (
            <p className="mt-6 text-sm text-text-secondary">Calculando nuevo alquiler…</p>
          ) : unpaidPeriods?.length ? (
            <p className="mt-6 text-sm text-text-secondary">
              El nuevo monto se calculará cuando estén cobradas las cuotas pendientes.
            </p>
          ) : error && !preview ? (
            <p className="mt-6 rounded-sm border border-danger/20 bg-danger-bg/40 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : preview ? (
            <>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Nuevo alquiler
              </p>
              {requiresManualMonto ? (
                <p className={`mt-2 text-[32px] font-bold leading-none text-primary ${moneyClassName}`}>
                  {formatMoney(preview.montoNuevo, currency)}
                </p>
              ) : (
                <label className="mt-3 flex flex-col items-center gap-2">
                  <input
                    ref={montoInputRef}
                    value={montoNuevoInput}
                    inputMode="decimal"
                    aria-label={`Nuevo alquiler (${currency})`}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const caret = event.target.selectionStart ?? raw.length;
                      const significantBefore = raw.slice(0, caret).replace(/[^\d,]/g, "").length;
                      const formatted = formatAmountTyping(raw);
                      setMontoDirty(true);
                      setMontoNuevoInput(formatted);
                      requestAnimationFrame(() => {
                        const node = montoInputRef.current;
                        if (!node) return;
                        const next = caretAfterSignificant(formatted, significantBefore);
                        node.setSelectionRange(next, next);
                      });
                    }}
                    className={`w-full min-w-0 rounded-sm border border-primary/30 bg-bg-page px-3 py-2 text-center font-bold leading-none text-primary focus:border-primary ${moneyDisplaySizeClass(montoNuevoInput)} ${moneyClassName} overflow-x-auto ${interactiveFocusClass}`}
                  />
                  <span className="text-[12px] text-text-secondary">
                    Calculado por {indiceCode}
                    {montoCalculado ? `: ${formatMoney(montoCalculado, currency)}` : ""}. Podés
                    subirlo o bajarlo.
                  </span>
                  {montoDistintoDelIndice ? (
                    <button
                      type="button"
                      onClick={restoreCalculatedAmount}
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Volver al monto del índice
                    </button>
                  ) : null}
                  {montoIndiceInvalido ? (
                    <span className="text-[12px] text-danger">Ingresá un alquiler mayor a cero.</span>
                  ) : null}
                </label>
              )}
              <p className="mt-3 text-[15px] font-semibold text-text-primary">
                {Number.parseFloat(preview.variacionPct) >= 0 ? "+" : ""}
                {preview.variacionPct}%
                {requiresManualMonto || montoDistintoDelIndice
                  ? " respecto al alquiler actual"
                  : ` según ${indiceCode}`}
              </p>
              {loading ? (
                <p className="mt-2 text-xs text-text-secondary">Actualizando…</p>
              ) : null}
            </>
          ) : null}
        </div>

        {ofreceDeposito && preview ? (
          <div className="flex flex-col gap-3 rounded-sm border border-border bg-bg-page px-4 py-3">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-text-primary">
                ¿Actualizar el depósito?
              </span>
              <p className="text-[12px] text-text-secondary">
                Es opcional. Si no lo actualizás, queda con el monto actual.
              </p>
            </div>
            <ChipToggle
              options={[DEPOSITO_NO, DEPOSITO_SI]}
              value={depositoChoice ?? ""}
              onChange={setDepositoChoice}
            />
          </div>
        ) : null}

        {ofreceDeposito && actualizarDeposito && preview ? (
          <div className="flex flex-col gap-3 rounded-sm border border-primary/20 bg-primary-soft/50 px-4 py-3 text-[13px] text-text-primary">
            <p>
              El depósito pasa de{" "}
              <span className={moneyClassName}>
                {formatMoney(preview.actualizacionDeposito.montoAnterior, currency)}
              </span>{" "}
              a{" "}
              <span className={moneyClassName}>
                {formatMoney(preview.actualizacionDeposito.montoNuevo, currency)}
              </span>
              . Diferencia a cobrar:{" "}
              <strong className={moneyClassName}>
                {formatMoney(preview.actualizacionDeposito.diferencia, currency)}
              </strong>
              .
            </p>

            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={crearPlanDeposito}
                onChange={(e) => setCrearPlanDeposito(e.target.checked)}
                className="mt-0.5"
              />
              <span>Crear plan de cuotas para cobrar la diferencia del depósito</span>
            </label>

            {crearPlanDeposito ? (
              <div className="flex flex-col gap-2 pl-6">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Cantidad de cuotas
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={cantidadCuotasDeposito}
                    onChange={(e) => setCantidadCuotasDeposito(e.target.value)}
                    className={`w-28 ${formInputClass}`}
                  />
                </label>
                {cuotaDepositoEstimada ? (
                  <p className="text-[12px] text-text-secondary">
                    Cuotas estimadas de {cuotaDepositoEstimada} (el sistema ajusta centavos en la
                    última).
                  </p>
                ) : null}
                {depositoPlanInvalido ? (
                  <p className="text-[12px] text-danger">Ingresá una cantidad de cuotas entre 1 y 120.</p>
                ) : null}
              </div>
            ) : (
              <p className="pl-6 text-[12px] text-text-secondary">
                Podés crear el plan después desde la ficha del contrato.
              </p>
            )}
          </div>
        ) : null}

        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className={`flex w-full items-center justify-between text-left text-sm font-medium text-text-secondary hover:text-text-primary ${interactiveFocusClass}`}
          >
            <span>{showDetails ? "Ocultar cálculo" : "Ver cómo se calculó"}</span>
            <span className="text-lg leading-none">{showDetails ? "▾" : "▸"}</span>
          </button>

          {showDetails ? (
            <div className="mt-4 flex flex-col gap-4 rounded-md border border-border bg-bg-page px-4 py-4">
              <p className="text-xs leading-relaxed text-text-secondary">{detailsNote}</p>

              {preview ? (
                <FactorBreakdown
                  currency={currency}
                  factor={preview.factor}
                  montoAnterior={preview.montoAnterior}
                  montoNuevo={preview.montoNuevo}
                  manual={previewUsesManualMonto}
                  ipcFactors={
                    usesMonthlyProduct
                      ? ipcMonths.map((month) => {
                          const periodo = toIsoMonthDate(month);
                          return {
                            label: `${MONTHS[month.mes - 1]} ${month.anio}`,
                            ratio: monthOverMonthRatio(ipcRows, periodo),
                            variation: monthlyVariation(ipcRows, periodo),
                          };
                        })
                      : null
                  }
                  indexDivision={
                    contratoIndex === "ICL" && !requiresManualMonto
                      ? {
                          desde: formatIndexValue(preview.valorDesde),
                          hasta: formatIndexValue(preview.valorHasta),
                          desdeLabel: `${indiceCode} inicial`,
                          hastaLabel: `${indiceCode} del ajuste`,
                        }
                      : null
                  }
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
