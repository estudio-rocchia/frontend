import type { ClavePrecioVisa } from "@/lib/api/types";

/** Convención operativa: honorarios y cambio de turno en pesos; arancel consular en USD. */
export function monedaPreferidaPrecioVisa(clave: ClavePrecioVisa): "usd" | "ars" {
  return clave === "arancelConsular" ? "usd" : "ars";
}

export function monedasPrecioVisaIniciales(): Record<ClavePrecioVisa, "usd" | "ars"> {
  return {
    honorarioIndividual: "ars",
    honorarioGrupoChico: "ars",
    honorarioGrupoGrande: "ars",
    arancelConsular: "usd",
    cambioTurno: "ars",
  };
}

export function resolverMonedaPrecioVisa(
  clave: ClavePrecioVisa,
  guardada: "usd" | "ars" | undefined,
  usd: number,
  ars: number | null | undefined,
): "usd" | "ars" {
  if (guardada) return guardada;
  if (ars != null && ars > 0 && usd === 0) return "ars";
  if (usd > 0 && (ars == null || ars === 0)) return "usd";
  return monedaPreferidaPrecioVisa(clave);
}

export function monedaPreferidaConceptoVisa(destino: "estudio" | "consulado"): "usd" | "ars" {
  return destino === "consulado" ? "usd" : "ars";
}
