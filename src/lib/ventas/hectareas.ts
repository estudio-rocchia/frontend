import { M2_PER_HECTARE } from "@/lib/ventas/detalle-por-tipo";

export const M2_PER_ARE = 100;

export function showsHectareasMedidas(tipoInmuebleCode: string | null | undefined): boolean {
  return tipoInmuebleCode === "hectares";
}

export function m2ToHectareasAres(
  m2: string | number | null | undefined,
): { ha: string; ares: string } {
  const trimmed = m2 == null ? "" : String(m2).trim();
  if (!trimmed) return { ha: "", ares: "" };
  const n = Number.parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return { ha: "", ares: "" };
  const totalAres = Math.round(n / M2_PER_ARE);
  const ha = Math.floor(totalAres / 100);
  const ares = totalAres % 100;
  return {
    ha: ha > 0 ? String(ha) : totalAres > 0 ? "0" : "",
    ares: ares > 0 ? String(ares) : "",
  };
}

export function hectareasAresToM2(ha: string, ares: string): number | string | null {
  const haTrim = ha.trim().replace(",", ".");
  const aresTrim = ares.trim().replace(",", ".");
  const haNum = haTrim ? Number.parseFloat(haTrim) : 0;
  const aresNum = aresTrim ? Number.parseInt(aresTrim, 10) : 0;
  if (!haTrim && !aresTrim) return null;
  if (!Number.isFinite(haNum) || haNum < 0) return null;
  if (!Number.isFinite(aresNum) || aresNum < 0 || aresNum > 99) return null;
  if (haNum === 0 && aresNum === 0) return null;
  const m2 = haNum * M2_PER_HECTARE + aresNum * M2_PER_ARE;
  return String(m2);
}
