"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import type { PropietarioCierre } from "@/lib/api/types";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";

import {
  BALANCE_LARGE_LIST_THRESHOLD,
  BalanceDenseTable,
  BalanceMontoCell,
  BalancePanel,
  BalancePropietarioTotalsBar,
  BalanceTruncatedLabel,
  emptyMontosMoneda,
  sumMontosMoneda,
} from "./balance-ui";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function filterPropietarios(rows: PropietarioCierre[], query: string): PropietarioCierre[] {
  const needle = normalizeSearchText(query);
  if (!needle) return rows;
  return rows.filter((row) => normalizeSearchText(row.nombre).includes(needle));
}

function aggregatePropietarios(rows: PropietarioCierre[]) {
  return rows.reduce(
    (acc, row) => ({
      honorarios: sumMontosMoneda(acc.honorarios, row.honorarios),
      alquileres: sumMontosMoneda(acc.alquileres, row.alquileresLiquidados),
    }),
    { honorarios: emptyMontosMoneda(), alquileres: emptyMontosMoneda() },
  );
}

export function BalancePropietarioDetailSection({ rows }: { rows: PropietarioCierre[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [listExpanded, setListExpanded] = useState(
    () => rows.length <= BALANCE_LARGE_LIST_THRESHOLD,
  );

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  const filteredRows = useMemo(
    () => filterPropietarios(rows, debouncedQuery),
    [rows, debouncedQuery],
  );

  const totals = useMemo(() => aggregatePropietarios(filteredRows), [filteredRows]);

  const hasSearch = debouncedQuery.trim().length > 0;
  const isLargeList = rows.length > BALANCE_LARGE_LIST_THRESHOLD;

  const searchField =
    rows.length > 0 ? (
      <label className="relative block w-full min-w-[8.5rem] sm:w-44">
        <span className="sr-only">Buscar propietario</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-secondary"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar propietario"
          className={`${formInputClass} h-8 w-full py-1 pr-2 pl-8 text-[11px] ${interactiveFocusClass}`}
        />
      </label>
    ) : undefined;

  const listToggle =
    isLargeList && filteredRows.length > 0 ? (
      <button
        type="button"
        onClick={() => setListExpanded((open) => !open)}
        aria-expanded={listExpanded}
        className={`balance-list-toggle rocchia-action flex w-full items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 text-left text-[12px] font-medium text-text-primary sm:px-5 ${interactiveFocusClass}`}
      >
        <span>
          {listExpanded ? "Ocultar listado detallado" : "Ver listado detallado"}
          <span className="ml-1.5 font-normal text-text-secondary">
            ({new Intl.NumberFormat("es-AR").format(filteredRows.length)} propietarios)
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-text-secondary transition-transform duration-200 ease-out motion-reduce:transition-none ${listExpanded ? "rotate-180" : ""}`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
    ) : null;

  return (
    <BalancePanel
      sectionId="balance-propietarios"
      title="Detalle por propietario"
      description="Totales del período por liquidaciones emitidas o entregadas."
      action={searchField}
    >
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-pretty text-text-secondary sm:px-5">
          No hay liquidaciones emitidas en este período.
        </p>
      ) : filteredRows.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-pretty text-text-secondary sm:px-5">
          {hasSearch
            ? "Ningún propietario coincide con la búsqueda."
            : "No hay liquidaciones emitidas en este período."}
        </p>
      ) : (
        <>
          <BalancePropietarioTotalsBar
            totals={totals}
            count={filteredRows.length}
            filtered={hasSearch}
          />
          {listToggle}
          {(!isLargeList || listExpanded) && (
            <BalanceDenseTable
              scrollable={isLargeList}
              columns={[
                { key: "name", label: "Propietario" },
                { key: "hars", label: "ARS", align: "right", legendTone: "ars", groupLabel: "Honorarios" },
                { key: "husd", label: "USD", align: "right", legendTone: "usd", groupLabel: "Honorarios" },
                { key: "lars", label: "ARS", align: "right", legendTone: "ars", groupLabel: "Alquileres" },
                { key: "lusd", label: "USD", align: "right", legendTone: "usd", groupLabel: "Alquileres" },
              ]}
              footer={{
                label: hasSearch ? `Total (${filteredRows.length} filtrados)` : "Total período",
                cells: [
                  <BalanceMontoCell key="hars" value={totals.honorarios.ARS} currency="ARS" />,
                  <BalanceMontoCell key="husd" value={totals.honorarios.USD} currency="USD" />,
                  <BalanceMontoCell key="lars" value={totals.alquileres.ARS} currency="ARS" />,
                  <BalanceMontoCell key="lusd" value={totals.alquileres.USD} currency="USD" />,
                ],
              }}
              rows={filteredRows.map((row) => ({
                key: String(row.personaId),
                cells: [
                  <BalanceTruncatedLabel key="name" text={row.nombre} />,
                  <BalanceMontoCell key="hars" value={row.honorarios.ARS} currency="ARS" />,
                  <BalanceMontoCell key="husd" value={row.honorarios.USD} currency="USD" />,
                  <BalanceMontoCell key="lars" value={row.alquileresLiquidados.ARS} currency="ARS" />,
                  <BalanceMontoCell key="lusd" value={row.alquileresLiquidados.USD} currency="USD" />,
                ],
              }))}
            />
          )}
        </>
      )}
    </BalancePanel>
  );
}
