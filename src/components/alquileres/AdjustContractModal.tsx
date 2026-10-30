"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ChipToggle, FormField } from "@/components/ui/FormLayout";
import { AdjustmentIndicesReference } from "@/components/alquileres/AdjustmentIndicesReference";
import { AdjustmentUnpaidCuotasNotice } from "@/components/alquileres/AdjustmentUnpaidCuotasNotice";
import { useContratoAdjustmentPreview } from "@/components/alquileres/useContratoAdjustmentPreview";
import type { ContratoDetail } from "@/lib/api/types";
import {
  formatIndexValue,
  formatIndicePunto,
  formatMoney,
  formatMonthYear,
  moneyClassName,
  personaDisplayName,
} from "@/lib/format";
import {
  DEFAULT_DEPOSITO_PLAN_CUOTAS,
  type DepositoPlanChoice,
} from "@/lib/alquileres/deposito-plan";
import {
  adjustmentIndexLabel,
  contractualAdjustmentEnd,
  defaultAdjustmentHasta,
  fromIsoMonthDate,
  indexYearRange,
  indiceCodeFromContrato,
  isAgreedAdjustmentContrato,
  isAdjustmentOverdue,
  isPublishedAdjustmentIndex,
  latestPublishedIndexMonth,
  rentVigenteDesde,
  toIsoMonthDate,
  vigenteDesdeLabel,
  type MonthYear,
} from "@/lib/rental-adjustment";

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

function MonthYearSelect({
  value,
  years,
  onChange,
}: {
  value: MonthYear;
  years: number[];
  onChange: (next: MonthYear) => void;
}) {
  const selectClass =
    "rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary";

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={value.mes}
        onChange={(e) => onChange({ ...value, mes: Number(e.target.value) })}
        className={selectClass}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={value.anio}
        onChange={(e) => onChange({ ...value, anio: Number(e.target.value) })}
        className={selectClass}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
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
    setShowDetails(false);
    setDepositoChoice(null);
    setCrearPlanDeposito(true);
    setCantidadCuotasDeposito(String(DEFAULT_DEPOSITO_PLAN_CUOTAS));
  }, [contrato, open, ultimoAjusteEn]);

  const fechaAjuste = fechaAjusteMonth ? toIsoMonthDate(fechaAjusteMonth) : null;
  const requiresManualMonto = contrato ? isAgreedAdjustmentContrato(contrato) : false;
  const montoNuevoParsed = Number(montoNuevoInput.replace(/\D/g, ""));
  const montoNuevo =
    requiresManualMonto && Number.isFinite(montoNuevoParsed) && montoNuevoParsed > 0
      ? montoNuevoParsed
      : null;

  const { preview, loading, error, unpaidPeriods } = useContratoAdjustmentPreview({
    open,
    contratoId: contrato?.id ?? null,
    token,
    fechaAjuste,
    montoNuevo,
    requiresManualMonto,
  });

  const periodoDesde = useMemo(
    () => (preview ? fromIsoMonthDate(preview.periodoDesde) : null),
    [preview],
  );

  if (!contrato || !fechaAjusteMonth) return null;

  const inmuebleLabel = contrato.inmueble
    ? `${contrato.inmueble.code} · ${contrato.inmueble.title}`
    : "Inmueble";
  const inquilinoLabel = contrato.inquilino ? personaDisplayName(contrato.inquilino) : "—";
  const currency = contrato.codigoMoneda.trim();
  const contratoIndex = indiceCodeFromContrato(contrato);
  const indiceCode = adjustmentIndexLabel(contratoIndex ?? "ICL");
  const highlightIndex =
    contratoIndex && isPublishedAdjustmentIndex(contratoIndex) ? contratoIndex : null;
  const freq = contrato.frecuenciaAjusteMeses ?? 12;
  const years = indexYearRange(contrato);
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

  const detailsNote = requiresManualMonto
    ? `Ingresá el nuevo alquiler acordado entre las partes para el período de ${freq} meses.`
    : contratoIndex === "IPC"
      ? `Se multiplican los últimos ${freq} IPC mensuales. Los porcentajes no se suman: el alquiler nuevo es el actual por ese producto.`
      : contratoIndex === "ICL"
        ? "El coeficiente es el ICL de la fecha de actualización dividido el ICL del inicio o del último ajuste."
        : overdue
          ? `El ajuste debía aplicarse en ${formatMonthYear(contractualEnd.anio, contractualEnd.mes)}. Podés usar el último ${indiceCode} publicado (${formatMonthYear(maxPublished.anio, maxPublished.mes)}).`
          : `Período de ${freq} meses desde ${formatMonthYear(vigenteDesde.anio, vigenteDesde.mes)}.`;

  function resetSuggested() {
    setFechaAjusteMonth(defaultFechaAjusteMonth(contrato!, ultimoAjusteEn));
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
              depositoPlanInvalido
            }
            onClick={() => {
              if (!preview || !fechaAjuste || depositoSinElegir || depositoPlanInvalido) return;
              const input: AdjustContractSubmitInput = {
                fechaAjuste: preview.fechaAjuste,
                montoNuevo: requiresManualMonto ? montoNuevo ?? undefined : undefined,
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
          open={open}
          token={token}
          highlightCode={highlightIndex}
        />

        {requiresManualMonto ? (
          <FormField
            label={`Nuevo alquiler mensual (${currency})`}
            value={montoNuevoInput}
            onChange={setMontoNuevoInput}
            placeholder="Monto acordado con inquilino y propietario"
          />
        ) : null}

        {unpaidPeriods?.length ? (
          <AdjustmentUnpaidCuotasNotice periods={unpaidPeriods} />
        ) : null}

        <div className="rounded-md border border-border bg-primary-soft px-5 py-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Alquiler actual
          </p>
          <p className={`mt-2 text-xl font-semibold text-text-primary ${moneyClassName}`}>
            {formatMoney(contrato.montoAlquiler, currency)}
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-text-secondary">Calculando nuevo alquiler…</p>
          ) : unpaidPeriods?.length ? (
            <p className="mt-6 text-sm text-text-secondary">
              El nuevo monto se calculará cuando estén cobradas las cuotas pendientes.
            </p>
          ) : error ? (
            <p className="mt-6 rounded-sm border border-danger/20 bg-danger-bg/40 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : preview ? (
            <>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Nuevo alquiler
              </p>
              <p className={`mt-2 text-[32px] font-bold leading-none text-primary ${moneyClassName}`}>
                {formatMoney(preview.montoNuevo, currency)}
              </p>
              <p className="mt-3 text-[15px] font-semibold text-text-primary">
                {Number.parseFloat(preview.variacionPct) >= 0 ? "+" : ""}
                {preview.variacionPct}%
                {requiresManualMonto ? " respecto al alquiler actual" : ` según ${indiceCode}`}
              </p>
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
                    className="w-28 rounded-sm border border-border bg-bg-page px-3 py-2 text-[13px] text-text-primary outline-none focus:border-primary"
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
            className="flex w-full items-center justify-between text-left text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <span>{showDetails ? "Ocultar cálculo" : "Ver cómo se calculó"}</span>
            <span className="text-lg leading-none">{showDetails ? "▾" : "▸"}</span>
          </button>

          {showDetails ? (
            <div className="mt-4 flex flex-col gap-4 rounded-md border border-border bg-bg-page px-4 py-4">
              <p className="text-xs leading-relaxed text-text-secondary">{detailsNote}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">Desde</span>
                  <span className="text-[11px] text-text-secondary">
                    {vigenteDesdeLabel(ultimoAjusteEn)}
                    {periodoDesde
                      ? ` · ${formatMonthYear(periodoDesde.anio, periodoDesde.mes)}`
                      : null}
                  </span>
                  {preview?.valorDesde ? (
                    <span className="text-[11px] font-semibold text-primary">
                      {indiceCode}{" "}
                      {formatIndicePunto(preview.periodoDesde, contratoIndex === "ICL")}:{" "}
                      {formatIndexValue(preview.valorDesde)}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-text-secondary">Hasta</span>
                  <span className="text-[11px] text-text-secondary">Mes a actualizar</span>
                  <MonthYearSelect
                    value={fechaAjusteMonth}
                    years={years}
                    onChange={setFechaAjusteMonth}
                  />
                  {preview?.valorHasta ? (
                    <span className="text-[11px] font-semibold text-primary">
                      {indiceCode}{" "}
                      {formatIndicePunto(preview.periodoHasta, contratoIndex === "ICL")}:{" "}
                      {formatIndexValue(preview.valorHasta)}
                    </span>
                  ) : null}
                </div>
              </div>

              {preview ? (
                <p className="border-t border-border pt-3 text-center text-xs text-text-secondary">
                  {formatMoney(preview.montoAnterior, currency)} ×{" "}
                  {Number.parseFloat(preview.factor).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                  {" = "}
                  <span className="font-semibold text-primary">
                    {formatMoney(preview.montoNuevo, currency)}
                  </span>
                </p>
              ) : null}

              <button
                type="button"
                onClick={resetSuggested}
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Restaurar valores sugeridos
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
