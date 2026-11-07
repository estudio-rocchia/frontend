"use client";

import { useEffect, useMemo, useState } from "react";

import type { LiquidacionesMesAMes, MontosMoneda } from "@/lib/api/types";
import { formatMoney, formatMonthYear } from "@/lib/format";

import {
  BALANCE_TABLE_PAGE_SIZE,
  BalanceHeatmapLegend,
  BalanceMatrixSummaryBar,
  BalancePanel,
  BalanceSegmented,
  BalanceTablePagination,
  BalanceTruncatedLabel,
} from "./balance-ui";

type MatrixKind = "alquileres" | "honorarios";
type CurrencyView = "ARS" | "USD";

function montosVacios(): MontosMoneda {
  return { ARS: 0, USD: 0 };
}

function sumMontos(a: MontosMoneda, b: MontosMoneda): MontosMoneda {
  return { ARS: a.ARS + b.ARS, USD: a.USD + b.USD };
}

function sumMeses(meses: MontosMoneda[]): MontosMoneda {
  return meses.reduce((acc, item) => sumMontos(acc, item), montosVacios());
}

function HeatmapCell({
  value,
  max,
  currency,
  totalRow = false,
}: {
  value: number;
  max: number;
  currency: CurrencyView;
  totalRow?: boolean;
}) {
  const intensity = max > 0 && value > 0 ? 0.1 + (value / max) * 0.5 : 0;
  const heatRgb = currency === "USD" ? "138, 103, 64" : "16, 112, 119";

  return (
    <td className={`p-0.5 align-middle ${totalRow ? "balance-matrix-total-row-cell" : ""}`}>
      <div
        className={`balance-heatmap-cell-inner flex min-h-[2.5rem] flex-col items-end justify-center rounded-md px-2 py-1.5 text-right ${
          currency === "USD" ? "balance-heatmap-cell-usd" : "balance-heatmap-cell-ars"
        }`}
        style={{
          backgroundColor: intensity > 0 ? `rgba(${heatRgb}, ${intensity})` : undefined,
        }}
      >
        {value > 0 ? (
          <span className="text-[11px] font-medium tabular-nums text-text-primary">
            {formatMoney(String(value), currency)}
          </span>
        ) : (
          <span className="text-[11px] text-text-secondary/45">—</span>
        )}
      </div>
    </td>
  );
}

function MatrixPagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <BalanceTablePagination
      page={page}
      pageCount={pageCount}
      total={total}
      pageSize={BALANCE_TABLE_PAGE_SIZE}
      onPageChange={onPageChange}
      itemLabel="propietarios"
    />
  );
}

export function BalanceMesAMesSection({
  data,
  enterDelayMs = 280,
  sectionId = "balance-matriz",
  currency: controlledCurrency,
  onCurrencyChange,
}: {
  data: LiquidacionesMesAMes;
  enterDelayMs?: number;
  sectionId?: string;
  currency?: CurrencyView;
  onCurrencyChange?: (currency: CurrencyView) => void;
}) {
  const [kind, setKind] = useState<MatrixKind>("alquileres");
  const [internalCurrency, setInternalCurrency] = useState<CurrencyView>("ARS");
  const currencyControlled = controlledCurrency !== undefined && onCurrencyChange !== undefined;
  const currency = controlledCurrency ?? internalCurrency;
  const setCurrency = onCurrencyChange ?? setInternalCurrency;
  const [page, setPage] = useState(0);

  const { meses, filas, totalesPorMes, totalesGeneral, maxCell } = useMemo(() => {
    const totales = kind === "alquileres" ? data.totalesAlquileres : data.totalesHonorarios;
    const filas = data.porPropietario.map((row) => {
      const porMes = kind === "alquileres" ? row.alquileresPorMes : row.honorariosPorMes;
      return {
        personaId: row.personaId,
        nombre: row.nombre,
        porMes,
        total: sumMeses(porMes),
      };
    });
    let maxCell = 0;
    for (const row of filas) {
      for (const m of row.porMes) {
        maxCell = Math.max(maxCell, m[currency]);
      }
    }
    for (const m of totales) {
      maxCell = Math.max(maxCell, m[currency]);
    }
    return {
      meses: data.meses,
      filas,
      totalesPorMes: totales,
      totalesGeneral: sumMeses(totales),
      maxCell,
    };
  }, [data, kind, currency]);

  const pageCount = Math.max(1, Math.ceil(filas.length / BALANCE_TABLE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    setPage(0);
  }, [filas.length, kind, currency]);

  const visibleFilas = filas.slice(safePage * BALANCE_TABLE_PAGE_SIZE, (safePage + 1) * BALANCE_TABLE_PAGE_SIZE);

  const noMeses = meses.length === 0;
  const empty = !noMeses && filas.length === 0;
  const kindLabel = kind === "alquileres" ? "alquileres" : "honorarios";

  return (
    <BalancePanel
      tone="ink"
      enterDelayMs={enterDelayMs}
      sectionId={sectionId}
      title="Matriz mes a mes"
      description="Monto liquidado por mes · totales visibles arriba y en el pie del listado"
      toolbar={
        noMeses ? undefined : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <BalanceSegmented
                name="matrix-kind"
                size="sm"
                options={[
                  { id: "alquileres" as const, label: "Alquileres" },
                  { id: "honorarios" as const, label: "Honorarios" },
                ]}
                value={kind}
                onChange={setKind}
              />
              {!currencyControlled ? (
                <BalanceSegmented
                  name="matrix-currency"
                  size="sm"
                  variant="currency"
                  options={[
                    { id: "ARS" as const, label: "ARS" },
                    { id: "USD" as const, label: "USD" },
                  ]}
                  value={currency}
                  onChange={setCurrency}
                />
              ) : null}
            </div>
            <BalanceHeatmapLegend className="min-w-0 sm:ml-auto" currency={currency} />
          </>
        )
      }
    >
      {noMeses ? (
        <p className="px-4 py-10 text-center text-[13px] text-pretty text-text-secondary sm:px-5">
          No hay meses liquidados en el período seleccionado.
        </p>
      ) : empty ? (
        <p className="px-4 py-10 text-center text-[13px] text-pretty text-text-secondary sm:px-5">
          No hay liquidaciones emitidas en los meses del período.
        </p>
      ) : (
        <>
          <BalanceMatrixSummaryBar
            kindLabel={kindLabel}
            currency={currency}
            grandTotal={totalesGeneral[currency]}
            propietarioCount={filas.length}
            page={safePage}
            pageCount={pageCount}
          />
          <div className="balance-table-scroll balance-table-viewport balance-matrix-viewport overflow-x-auto p-2 sm:p-3">
            <table className="balance-matrix-table w-full min-w-[640px] border-separate border-spacing-0 text-left">
              <caption className="sr-only">Matriz de liquidaciones por propietario y mes</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="balance-sticky-col px-3 py-2 text-left text-[10px] font-semibold tracking-[0.08em] text-text-secondary uppercase"
                  >
                    Propietario
                  </th>
                  {meses.map((mes) => (
                    <th
                      key={`${mes.anioPeriodo}-${mes.mesPeriodo}`}
                      scope="col"
                      className="px-0.5 py-2 text-right text-[10px] font-semibold tracking-wide text-text-secondary uppercase"
                    >
                      {formatMonthYear(mes.anioPeriodo, mes.mesPeriodo)}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="balance-matrix-total-col px-2 py-2 text-right text-[10px] font-bold tracking-wide text-text-primary uppercase"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleFilas.map((row) => (
                  <tr key={row.personaId} className="transition-colors duration-100 hover:bg-primary/[0.02]">
                    <td className="balance-sticky-col max-w-[160px] px-3 py-1">
                      <BalanceTruncatedLabel
                        text={row.nombre}
                        className="text-[12px] font-medium text-text-primary"
                      />
                    </td>
                    {row.porMes.map((montos, index) => (
                      <HeatmapCell
                        key={index}
                        value={montos[currency]}
                        max={maxCell}
                        currency={currency}
                      />
                    ))}
                    <td className="balance-matrix-total-col px-2 py-1 text-right text-[12px] font-semibold tabular-nums text-text-primary">
                      {row.total[currency] > 0 ? formatMoney(String(row.total[currency]), currency) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="balance-matrix-total-row">
                  <td className="balance-sticky-col balance-matrix-total-label px-3 py-2 text-[11px] font-bold text-text-primary">
                    Total {kindLabel}
                  </td>
                  {totalesPorMes.map((montos, index) => (
                    <HeatmapCell
                      key={index}
                      value={montos[currency]}
                      max={maxCell}
                      currency={currency}
                      totalRow
                    />
                  ))}
                  <td className="balance-matrix-total-col balance-matrix-grand-total px-2 py-2 text-right text-[12px] font-bold tabular-nums text-primary-dark">
                    {totalesGeneral[currency] > 0
                      ? formatMoney(String(totalesGeneral[currency]), currency)
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <MatrixPagination
            page={safePage}
            pageCount={pageCount}
            total={filas.length}
            onPageChange={setPage}
          />
        </>
      )}
    </BalancePanel>
  );
}
