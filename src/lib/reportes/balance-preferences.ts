import type { BalanceCurrencyView } from "@/components/reportes/balance-ui";
import { currentYear, periodForYear, type CierrePresetId } from "@/lib/reportes/period";

export const BALANCE_PREFS_STORAGE_KEY = "rocchia.balance.prefs";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface BalancePrefs {
  matrixCurrency: BalanceCurrencyView;
  compararYoY: boolean;
}

const DEFAULT_PREFS: BalancePrefs = {
  matrixCurrency: "ARS",
  compararYoY: false,
};

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}` === value;
}

export function parseBalanceSearchParams(params: URLSearchParams): {
  desde: string;
  hasta: string;
  yoy?: boolean;
} | null {
  const desde = params.get("desde") ?? "";
  const hasta = params.get("hasta") ?? "";
  if (!isValidIsoDate(desde) || !isValidIsoDate(hasta) || desde > hasta) return null;

  const yoyParam = params.get("yoy");
  if (yoyParam === "1" || yoyParam === "true") return { desde, hasta, yoy: true };
  if (yoyParam === "0" || yoyParam === "false") return { desde, hasta, yoy: false };
  return { desde, hasta };
}

export function buildBalanceSearchQuery(
  desde: string,
  hasta: string,
  compararYoY: boolean,
): string {
  const params = new URLSearchParams({ desde, hasta });
  if (compararYoY) params.set("yoy", "1");
  return params.toString();
}

export function readBalancePeriodFromLocation(): ReturnType<typeof parseBalanceSearchParams> {
  if (typeof window === "undefined") return null;
  return parseBalanceSearchParams(new URLSearchParams(window.location.search));
}

export function loadBalancePrefs(): BalancePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(BALANCE_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<BalancePrefs>;
    return {
      matrixCurrency: parsed.matrixCurrency === "USD" ? "USD" : "ARS",
      compararYoY: Boolean(parsed.compararYoY),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveBalancePrefs(partial: Partial<BalancePrefs>): void {
  if (typeof window === "undefined") return;
  try {
    const next = { ...loadBalancePrefs(), ...partial };
    window.localStorage.setItem(BALANCE_PREFS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function syncBalanceUrl(desde: string, hasta: string, compararYoY: boolean): void {
  if (typeof window === "undefined") return;
  const query = buildBalanceSearchQuery(desde, hasta, compararYoY);
  const next = `${window.location.pathname}?${query}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== next) {
    window.history.replaceState(null, "", next);
  }
}

export interface BalanceBootstrap {
  year: number;
  preset: CierrePresetId;
  desde: string;
  hasta: string;
  compararYoY: boolean;
  matrixCurrency: BalanceCurrencyView;
}

export function resolveBalanceBootstrap(referenceYear = currentYear()): BalanceBootstrap {
  const prefs = loadBalancePrefs();
  const url = readBalancePeriodFromLocation();
  if (url) {
    return {
      year: Number(url.desde.slice(0, 4)),
      preset: "custom",
      desde: url.desde,
      hasta: url.hasta,
      compararYoY: url.yoy ?? prefs.compararYoY,
      matrixCurrency: prefs.matrixCurrency,
    };
  }

  const period = periodForYear(referenceYear, false);
  return {
    year: referenceYear,
    preset: "ytd",
    desde: period.desde,
    hasta: period.hasta,
    compararYoY: prefs.compararYoY,
    matrixCurrency: prefs.matrixCurrency,
  };
}
