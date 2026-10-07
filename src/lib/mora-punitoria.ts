import type { CatalogoItem, ContratoDetail } from "@/lib/api/types";

export type MoraTipoCode = "daily_percentage" | "fixed_daily_amount";

export type MoraPunitoriaForm = {
  moraTipo: MoraTipoCode;
  /** Porcentaje diario visible para el usuario, ej. "2,5" = 2,5% */
  moraTasaPct: string;
  /** Monto fijo por día de mora (ARS/USD según contrato). */
  moraMontoFijo: string;
  diaVencimientoPago: string;
};

export const DEFAULT_MORA_PUNITORIA: MoraPunitoriaForm = {
  moraTipo: "daily_percentage",
  moraTasaPct: "2,5",
  moraMontoFijo: "",
  diaVencimientoPago: "10",
};

const MORA_TIPO_LABELS: Record<MoraTipoCode, string> = {
  daily_percentage: "Porcentaje diario",
  fixed_daily_amount: "Monto fijo por día",
};

export const MORA_TIPO_OPTIONS = Object.values(MORA_TIPO_LABELS);

export function moraTipoLabel(code: MoraTipoCode): string {
  return MORA_TIPO_LABELS[code];
}

export function moraTipoFromLabel(label: string): MoraTipoCode {
  if (label === MORA_TIPO_LABELS.fixed_daily_amount) return "fixed_daily_amount";
  return "daily_percentage";
}

function moneyInputFromApi(value: string | null | undefined): string {
  if (!value) return "";
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(Math.round(num));
}

function tasaPctFromApi(tasaMora: string | null | undefined): string {
  if (!tasaMora) return DEFAULT_MORA_PUNITORIA.moraTasaPct;
  const num = Number.parseFloat(tasaMora);
  if (!Number.isFinite(num) || num <= 0) return DEFAULT_MORA_PUNITORIA.moraTasaPct;
  const pct = num * 100;
  return pct % 1 === 0 ? String(pct) : pct.toFixed(1).replace(".", ",");
}

export function moraPunitoriaFromContrato(contrato: ContratoDetail): MoraPunitoriaForm {
  const dia = String(contrato.diaVencimientoPago ?? 10);
  if (contrato.tipoMora?.code === "fixed_daily_amount") {
    return {
      moraTipo: "fixed_daily_amount",
      moraTasaPct: "",
      moraMontoFijo: moneyInputFromApi(contrato.montoMoraFijo),
      diaVencimientoPago: dia,
    };
  }
  return {
    moraTipo: "daily_percentage",
    moraTasaPct: tasaPctFromApi(contrato.tasaMora),
    moraMontoFijo: "",
    diaVencimientoPago: dia,
  };
}

export function isMoraPunitoriaValid(form: MoraPunitoriaForm): boolean {
  const dia = Number.parseInt(form.diaVencimientoPago, 10);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return false;
  if (form.moraTipo === "daily_percentage") {
    const pct = Number.parseFloat(form.moraTasaPct.replace(",", "."));
    return Number.isFinite(pct) && pct > 0 && pct < 100;
  }
  const fixed = Number(form.moraMontoFijo.replace(/\D/g, ""));
  return Number.isFinite(fixed) && fixed > 0;
}

export function resolveMoraPunitoriaPayload(
  form: MoraPunitoriaForm,
  tiposMora: CatalogoItem[],
): {
  tipoMoraId: number;
  tasaMora: number | null;
  montoMoraFijo: number | null;
  diaVencimientoPago: number;
} {
  const tipo = tiposMora.find((item) => item.code === form.moraTipo);
  if (!tipo?.id) {
    throw new Error(`Tipo de mora no encontrado: ${form.moraTipo}`);
  }

  const dia = Number.parseInt(form.diaVencimientoPago, 10);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    throw new Error("El día de vencimiento debe estar entre 1 y 31");
  }

  if (form.moraTipo === "daily_percentage") {
    const pct = Number.parseFloat(form.moraTasaPct.replace(",", "."));
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) {
      throw new Error("Ingresá un porcentaje punitorio válido (entre 0 y 100)");
    }
    return {
      tipoMoraId: tipo.id,
      tasaMora: pct / 100,
      montoMoraFijo: null,
      diaVencimientoPago: dia,
    };
  }

  const fixed = Number(form.moraMontoFijo.replace(/\D/g, ""));
  if (!Number.isFinite(fixed) || fixed <= 0) {
    throw new Error("Ingresá un monto fijo por día de mora válido");
  }
  return {
    tipoMoraId: tipo.id,
    tasaMora: null,
    montoMoraFijo: fixed,
    diaVencimientoPago: dia,
  };
}
