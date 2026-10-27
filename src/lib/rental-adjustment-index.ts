import type { AdjustmentIndex } from "@/data/alquileres-contract-details";
import type { CatalogoItem, ContratoDetail, IndiceCode } from "@/lib/api/types";

export const PUBLISHED_ADJUSTMENT_INDICES: AdjustmentIndex[] = ["ICL", "IPC", "CAC"];

/** Published indices only (ICL/IPC/CAC) — for the /indices page and calculators. */
export const ADJUSTMENT_INDICES: IndiceCode[] = ["ICL", "IPC", "CAC"];

export const ADJUSTMENT_INDEX_CHIP_OPTIONS: AdjustmentIndex[] = [
  ...PUBLISHED_ADJUSTMENT_INDICES,
  "ACUERDO",
];

const CATALOG_CODE_BY_INDEX: Record<AdjustmentIndex, string> = {
  ICL: "ICL",
  IPC: "IPC",
  CAC: "CAC",
  ACUERDO: "other",
};

const AGREED_CATALOG_CODES = new Set(["other", "fixed_pct", "mixed"]);

export function adjustmentIndexLabel(index: AdjustmentIndex): string {
  if (index === "ACUERDO") return "Acordado";
  return index;
}

export function catalogCodeFromAdjustmentIndex(index: AdjustmentIndex): string {
  return CATALOG_CODE_BY_INDEX[index];
}

export function adjustmentIndexFromCatalogCode(
  code: string | null | undefined,
): AdjustmentIndex | null {
  const upper = code?.toUpperCase();
  if (upper && PUBLISHED_ADJUSTMENT_INDICES.includes(upper as AdjustmentIndex)) {
    return upper as AdjustmentIndex;
  }
  if (code && AGREED_CATALOG_CODES.has(code.toLowerCase())) {
    return "ACUERDO";
  }
  return null;
}

export function isPublishedAdjustmentIndex(index: AdjustmentIndex): index is IndiceCode {
  return (ADJUSTMENT_INDICES as readonly string[]).includes(index);
}

export function isAgreedAdjustmentContrato(contrato: ContratoDetail): boolean {
  const code = contrato.tipoIndice?.code ?? null;
  return code != null && AGREED_CATALOG_CODES.has(code.toLowerCase());
}

export function resolveTipoIndiceItem(
  items: CatalogoItem[],
  index: AdjustmentIndex,
): CatalogoItem | undefined {
  const code = catalogCodeFromAdjustmentIndex(index);
  return items.find((item) => item.code === code);
}

export function indiceCodeFromContrato(contrato: ContratoDetail): AdjustmentIndex | null {
  return adjustmentIndexFromCatalogCode(contrato.tipoIndice?.code);
}
