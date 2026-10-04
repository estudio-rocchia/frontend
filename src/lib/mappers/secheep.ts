import type { SecheepImportInput, SecheepSyncSnapshot, ServicioContratoRecord } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

export function isSecheepElectricity(servicio: ServicioContratoRecord): boolean {
  return servicio.tipoServicioCode === "electricity" && servicio.activo;
}

export const SECHEEP_PORTAL_URL = "https://secheep.gob.ar/?page_id=1105";
export const SECHEEP_CONSULTA_URL = "https://te.secheep.com/middleware/ConsultaFacturas.aspx";

function ddMmYyyyToIso(value: string): string {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseImporteText(value: string): string {
  const n = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number.parseFloat(n);
  return Number.isFinite(num) ? String(num) : "";
}

/** Parsea texto copiado desde la tabla de SECHEEP (Ctrl+C después del captcha). */
export function parseSecheepPastedText(raw: string): Omit<SecheepManualFacturaRow, "id">[] {
  const text = raw.replace(/\r/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return [];

  const facturaRe =
    /([A-Z]\s*\d{4}-\d+)[\s\S]*?Periodo:\s*([A-Z]{3}\s+\d{4})[\s\S]*?(\d{2}\/\d{2}\/\d{4})[\s\S]*?(Vencida|Pendiente|Pagada)[\s\S]*?(\$\s*[\d.,]+)/gi;

  const rows: Omit<SecheepManualFacturaRow, "id">[] = [];
  let match: RegExpExecArray | null;
  while ((match = facturaRe.exec(text)) !== null) {
    const estado = match[4];
    if (!/vencida|pendiente/i.test(estado)) continue;
    rows.push({
      periodo: match[2].trim().toUpperCase(),
      estado: /vencida/i.test(estado) ? "Vencida" : "Pendiente",
      vencimiento: ddMmYyyyToIso(match[3]),
      importe: parseImporteText(match[5]),
      nroFactura: match[1].replace(/\s+/g, " ").trim(),
    });
  }

  if (rows.length > 0) return rows;

  // Fallback: líneas con estado + importe (copia parcial)
  const lineRe =
    /Periodo:\s*([A-Z]{3}\s+\d{4})|([A-Z]{3}\s+\d{4})|(\d{2}\/\d{2}\/\d{4})|(Vencida|Pendiente|Pagada)|(\$\s*[\d.,]+)|([A-Z]\s*\d{4}-\d+)/gi;
  const chunks = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let current: Partial<SecheepManualFacturaRow> = {};

  for (const line of chunks) {
    if (/^cliente|nº factura|vto\.|estado|importe|operaciones/i.test(line)) continue;
    if (/no hay registros/i.test(line)) continue;

    const periodo = line.match(/Periodo:\s*([A-Z]{3}\s+\d{4})/i)?.[1] ?? line.match(/\b([A-Z]{3}\s+\d{4})\b/)?.[1];
    const vto = line.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1];
    const estado = line.match(/\b(Vencida|Pendiente|Pagada)\b/i)?.[1];
    const importe = line.match(/(\$\s*[\d.,]+)/)?.[1];
    const nro = line.match(/([A-Z]\s*\d{4}-\d+)/i)?.[1];

    if (periodo) current.periodo = periodo.toUpperCase();
    if (vto) current.vencimiento = ddMmYyyyToIso(vto);
    if (nro) current.nroFactura = nro.replace(/\s+/g, " ").trim();
    if (importe) current.importe = parseImporteText(importe);
    if (estado) {
      if (/pagada/i.test(estado)) {
        current = {};
        continue;
      }
      current.estado = /vencida/i.test(estado) ? "Vencida" : "Pendiente";
    }

    if (current.periodo && current.vencimiento && current.estado && current.importe) {
      rows.push({
        periodo: current.periodo,
        estado: current.estado,
        vencimiento: current.vencimiento,
        importe: current.importe,
        nroFactura: current.nroFactura ?? "",
      });
      current = {};
    }
  }

  return rows;
}

export function pastedRowsToManual(rows: Omit<SecheepManualFacturaRow, "id">[]): SecheepManualFacturaRow[] {
  return rows.map((row) => ({ ...row, id: crypto.randomUUID() }));
}

export function secheepConfigured(servicio: ServicioContratoRecord): boolean {
  return Boolean(servicio.numeroClienteSecheep?.trim() && servicio.numeroSuministroSecheep?.trim());
}

export type SecheepManualFacturaRow = {
  id: string;
  periodo: string;
  estado: "Vencida" | "Pendiente";
  vencimiento: string;
  importe: string;
  nroFactura: string;
};

function isoToDdMmYyyy(iso: string): string | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function buildSecheepImportFromRows(
  rows: SecheepManualFacturaRow[],
  servicio: ServicioContratoRecord,
): SecheepImportInput {
  const facturas = rows.map((row) => {
    const importeNumero = Number(row.importe.replace(",", "."));
    if (!Number.isFinite(importeNumero) || importeNumero < 0) {
      throw new Error(`Importe inválido en ${row.periodo || "una boleta"}.`);
    }
    if (!row.periodo.trim()) {
      throw new Error("Cada boleta necesita el período (ej. AGO 2026).");
    }
    if (!row.vencimiento) {
      throw new Error(`Falta la fecha de vencimiento en ${row.periodo}.`);
    }
    const vencimiento = isoToDdMmYyyy(row.vencimiento);
    if (!vencimiento) {
      throw new Error(`Vencimiento inválido en ${row.periodo}.`);
    }
    return {
      nroFactura: row.nroFactura.trim() || `SECHEEP ${row.periodo.trim()}`,
      periodo: row.periodo.trim().toUpperCase(),
      vencimiento,
      estado: row.estado,
      importe: null,
      importeNumero,
    };
  });

  return {
    consultadoEn: new Date().toISOString(),
    titular: null,
    cliSum: `${servicio.numeroClienteSecheep}/${servicio.numeroSuministroSecheep}`,
    facturas,
  };
}

export function previewSecheepImport(payload: SecheepImportInput): {
  vencidas: SecheepImportInput["facturas"];
  pendientes: SecheepImportInput["facturas"];
  badge: SecheepStatusBadge;
} {
  const vencidas = payload.facturas.filter((f) => /vencida/i.test(f.estado));
  const pendientes = payload.facturas.filter((f) => /pendiente/i.test(f.estado));
  const badge = secheepStatusFromSync({
    consultadoEn: payload.consultadoEn,
    titular: payload.titular ?? null,
    cliSum: payload.cliSum ?? null,
    vencidas: vencidas.length,
    pendientes: pendientes.length,
    pagadas: payload.facturas.filter((f) => /pagada/i.test(f.estado)).length,
    totalVencido: vencidas.reduce((sum, f) => sum + (f.importeNumero ?? 0), 0),
    totalPendiente: pendientes.reduce((sum, f) => sum + (f.importeNumero ?? 0), 0),
  });
  return {
    vencidas,
    pendientes,
    badge,
  };
}

export function parseSecheepSpikeJson(raw: string): SecheepImportInput {
  const parsed = JSON.parse(raw) as Partial<SecheepImportInput> & { facturas?: unknown[] };
  if (!parsed.consultadoEn || !Array.isArray(parsed.facturas)) {
    throw new Error("El JSON debe incluir consultadoEn y facturas.");
  }
  return {
    consultadoEn: parsed.consultadoEn,
    titular: parsed.titular ?? null,
    cliSum: parsed.cliSum ?? null,
    facturas: (parsed.facturas as unknown[]).map((f) => {
      const item = f as Record<string, unknown>;
      return {
        nroFactura: String(item.nroFactura ?? ""),
        periodo: item.periodo ? String(item.periodo) : null,
        vencimiento: item.vencimiento ? String(item.vencimiento) : null,
        estado: String(item.estado ?? ""),
        importe: item.importe ? String(item.importe) : null,
        importeNumero:
          typeof item.importeNumero === "number" ? item.importeNumero : null,
      };
    }),
  };
}

export type SecheepStatusBadge = {
  label: string;
  detail: string;
  variant: "success" | "warning" | "danger";
};

export function secheepStatusFromSync(sync: SecheepSyncSnapshot | null | undefined): SecheepStatusBadge {
  if (!sync) {
    return { label: "Sin consulta", detail: "Aún no se actualizó desde SECHEEP", variant: "warning" };
  }
  if (sync.vencidas > 0) {
    return {
      label: `${sync.vencidas} vencida(s)`,
      detail: `Impagas en SECHEEP · ${formatMoney(String(sync.totalVencido), "ARS")}`,
      variant: "danger",
    };
  }
  if (sync.pendientes > 0) {
    return {
      label: `${sync.pendientes} pendiente(s)`,
      detail: `Sin vencer aún · ${formatMoney(String(sync.totalPendiente), "ARS")}`,
      variant: "warning",
    };
  }
  return {
    label: "SECHEEP al día",
    detail: "Sin facturas vencidas ni pendientes",
    variant: "success",
  };
}

export function secheepStatusForServicio(servicio: ServicioContratoRecord): SecheepStatusBadge | null {
  if (!isSecheepElectricity(servicio)) return null;
  if (!servicio.secheepSync) return null;
  return secheepStatusFromSync(servicio.secheepSync);
}
