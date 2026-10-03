/** Excel sheet prefixes (see docs/precios-ventas.md, docs/modelo-de-datos.md). */
export const TIPO_INMUEBLE_PREFIX: Record<string, string> = {
  lot: "L",
  house: "K",
  apartment: "D",
  duplex: "D",
  commercial: "S",
  warehouse: "G",
  hectares: "H",
  tower: "T",
};

export function prefixForTipoInmueble(tipoCode: string): string {
  return TIPO_INMUEBLE_PREFIX[tipoCode] ?? "A";
}

function normalizeCodeSet(codes: Iterable<string>): Set<string> {
  return new Set(Array.from(codes, (code) => code.trim().toUpperCase()).filter(Boolean));
}

export function nextInmuebleCode(prefix: string, usedCodes: Iterable<string>): string {
  const used = normalizeCodeSet(usedCodes);
  const pattern = new RegExp(`^${prefix}(\\d{2,4})$`, "i");
  let maxNum = 0;
  let padLen = 2;

  for (const code of used) {
    const match = code.match(pattern);
    if (!match) continue;
    const num = Number.parseInt(match[1], 10);
    if (num > maxNum) {
      maxNum = num;
      padLen = Math.max(2, match[1].length);
    }
  }

  let candidate = maxNum + 1;
  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const code = `${prefix}${String(candidate).padStart(padLen, "0")}`;
    if (!used.has(code)) return code;
    candidate += 1;
  }

  throw new Error("No hay códigos de inmueble disponibles para este tipo.");
}

/** Generates the next Rocchia rental contract code (ALQ-1042 style). */
export function nextContratoCode(existingCodes: Iterable<string | null | undefined>): string {
  const used = new Set(
    Array.from(existingCodes)
      .filter((code): code is string => Boolean(code))
      .map((code) => code.trim().toUpperCase()),
  );

  let max = 0;
  for (const code of used) {
    const match = code.match(/^ALQ-(\d{4})$/);
    if (!match) continue;
    max = Math.max(max, Number.parseInt(match[1], 10));
  }

  let candidate = max > 0 ? max + 1 : 1001;
  for (let attempt = 0; attempt < 10_000; attempt += 1) {
    const code = `ALQ-${String(candidate).padStart(4, "0")}`;
    if (!used.has(code)) return code;
    candidate += 1;
  }

  throw new Error("No hay códigos de contrato disponibles.");
}
