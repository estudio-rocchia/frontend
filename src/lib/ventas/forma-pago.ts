import type { CatalogoItem } from "@/lib/api/types";

const FALLBACK_LABELS: Record<string, string> = {
  usd_cash: "Dólar billete",
  ars_cash: "Pesos",
  usd_or_ars: "Acepta dólares/pesos",
  other: "Otro",
};

export function formaPagoLabel(
  code: string | null | undefined,
  catalog?: CatalogoItem[],
): string {
  if (!code?.trim()) return "—";
  const fromCatalog = catalog?.find((item) => item.code === code)?.name;
  if (fromCatalog) return fromCatalog;
  return FALLBACK_LABELS[code] ?? code;
}
