"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type BreakUiDataMode = "demo" | "worst" | "empty" | "one" | "many";

export const BREAK_UI_FICHA_CONTRATO_ID = 9001;

const MODES: BreakUiDataMode[] = ["demo", "worst", "empty", "one", "many"];

export function isBreakUiDevEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

function parseMode(value: string | null): BreakUiDataMode {
  if (value && MODES.includes(value as BreakUiDataMode)) {
    return value as BreakUiDataMode;
  }
  return "demo";
}

export function useBreakUiMode() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const enabled = isBreakUiDevEnabled();
  const mode = useMemo(() => parseMode(searchParams.get("breakUi")), [searchParams]);

  const setMode = useCallback(
    (next: BreakUiDataMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "demo") {
        params.delete("breakUi");
      } else {
        params.set("breakUi", next);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return {
    enabled,
    mode,
    active: enabled && mode !== "demo",
    setMode,
  };
}

export function breakUiQueryString(searchParams: { get(name: string): string | null }): string {
  const mode = searchParams.get("breakUi");
  if (!mode || mode === "demo") return "";
  return `breakUi=${encodeURIComponent(mode)}`;
}

/** Preserva `?breakUi=` al navegar dentro de alquileres en dev. */
export function withBreakUiQuery(
  pathname: string,
  searchParams: { get(name: string): string | null },
): string {
  return buildAlquileresPath(pathname, searchParams);
}

function buildAlquileresPath(
  pathname: string,
  searchParams: { get(name: string): string | null },
  options?: { fromHistorial?: boolean },
): string {
  const params = new URLSearchParams();
  const breakUi = searchParams.get("breakUi");
  if (breakUi && breakUi !== "demo") params.set("breakUi", breakUi);
  if (options?.fromHistorial) params.set("from", "historial");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function cameFromContratosHistorial(searchParams: { get(name: string): string | null }): boolean {
  return searchParams.get("from") === "historial";
}

export function alquileresContratoFichaPath(
  contratoId: number,
  searchParams: { get(name: string): string | null },
  options?: { fromHistorial?: boolean },
): string {
  return buildAlquileresPath(`/alquileres/${contratoId}`, searchParams, options);
}

export function alquileresListPath(
  kind: "activos" | "historial",
  searchParams: { get(name: string): string | null },
): string {
  return buildAlquileresPath(kind === "historial" ? "/alquileres/historial" : "/alquileres", searchParams);
}
