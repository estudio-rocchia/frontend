"use client";

import { useMemo, useState } from "react";

import type { LiquidacionesMesAMes, MontosMoneda } from "@/lib/api/types";
import { formatMoney, formatMonthYear } from "@/lib/format";

import { BalancePanel, BalanceSegmented, BalanceTruncatedLabel } from "./balance-ui";

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
  montos,
}: {
  value: number;
  max: number;
  currency: CurrencyView;
  montos: MontosMoneda;
}) {
  const intensity = max > 0 && value > 0 ? 0.1 + (value / max) * 0.5 : 0;

  return (
    <td className="p-0.5 align-middle">
      <div
        className="flex min-h-[2.5rem] flex-col items-end justify-center rounded-md px-2 py-1.5 text-right transition-colors duration-100"
        style={{
          backgroundColor: intensity > 0 ? `rgba(16, 112, 119, ${intensity})` : undefined,
        }}
      >
        {value > 0 ? (
          <span className="text-[11px] font-medium tabular-nums text-text-primary">
            {formatMoney(String(value), currency)}
          </span>
        ) : (
          <span className="text-[11px] text-text-secondary/45">—</span>
        )}
        {currency === "ARS" && montos.USD > 0 ? (
          <span className="text-[9px] tabular-nums text-text-secondary">{formatMoney(String(montos.USD), "USD")}</span>
        ) : null}
      </div>
    </td>
  );
}

export function BalanceMesAMesSection({ data }: { data: LiquidacionesMesAMes }) {
  const [kind, setKind] = useState<MatrixKind>("alquileres");
  const [currency, setCurrency] = useState<CurrencyView>("ARS");

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

  if (meses.length === 0) return null;

  const empty = filas.length === 0;

  return (
    <BalancePanel
      title="Matriz mes a mes"
      description="Intensidad = monto liquidado en el mes · fila inferior = total"
      action={
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
          <BalanceSegmented
            name="matrix-currency"
            size="sm"
            options={[
              { id: "ARS" as const, label: "ARS" },
              { id: "USD" as const, label: "USD" },
            ]}
            value={currency}
            onChange={setCurrency}
          />
        </div>
      }
    >
      {empty ? (
        <p className="px-4 py-10 text-center text-[13px] text-text-secondary sm:px-5">
          No hay liquidaciones emitidas en los meses del período.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2 sm:px-5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">Escala</span>
            <div className="flex h-2 flex-1 max-w-[160px] overflow-hidden rounded-full ring-1 ring-border/50">
              {[0.15, 0.3, 0.45, 0.6].map((op) => (
                <span key={op} className="flex-1" style={{ backgroundColor: `rgba(16, 112, 119, ${op})` }} />
              ))}
            </div>
            <span className="text-[10px] text-text-secondary">Bajo → alto</span>
          </div>
          <div className="balance-table-scroll overflow-x-auto p-2 sm:p-3">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
              <caption className="sr-only">
                Matriz de liquidaciones por propietario y mes
              </caption>
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
                    className="px-2 py-2 text-right text-[10px] font-semibold tracking-wide text-text-secondary uppercase"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((row) => (
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
                        montos={montos}
                      />
                    ))}
                    <td className="px-2 py-1 text-right text-[12px] font-semibold tabular-nums text-text-primary">
                      {row.total[currency] > 0 ? formatMoney(String(row.total[currency]), currency) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border/80">
                  <td className="balance-sticky-col px-3 py-2 text-[11px] font-semibold text-text-primary">
                    Total {kind === "alquileres" ? "alquileres" : "honorarios"}
                  </td>
                  {totalesPorMes.map((montos, index) => (
                    <HeatmapCell
                      key={index}
                      value={montos[currency]}
                      max={maxCell}
                      currency={currency}
                      montos={montos}
                    />
                  ))}
                  <td className="px-2 py-2 text-right text-[12px] font-bold tabular-nums text-primary-dark">
                    {totalesGeneral[currency] > 0
                      ? formatMoney(String(totalesGeneral[currency]), currency)
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </BalancePanel>
  );
}
