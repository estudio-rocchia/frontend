import {
  M2_PER_HECTARE,
  sanitizeDetalleFilterValues,
  showsDetalleFilterField,
  showsTerrainFilterField,
} from "@/lib/ventas/detalle-por-tipo";

export function sanitizeCharacteristicFiltersForTipo(
  filters: VentasCharacteristicFilters,
): VentasCharacteristicFilters {
  return sanitizeDetalleFilterValues(filters);
}

export interface VentasCharacteristicFilters {
  tipoInmuebleCode: string;
  bedroomsMin: number | null;
  bathroomsMin: number | null;
  tieneCochera: boolean;
  tienePileta: boolean;
  superficieTotalMin: string;
  superficieTotalMax: string;
  hectareasMin: string;
  hectareasMax: string;
  frenteMin: string;
  fondoMin: string;
  tieneEscritura: boolean;
  tieneConstruccion: boolean;
  codigoMoneda: "USD" | "ARS";
  precioMin: string;
  precioMax: string;
}

export const EMPTY_CHARACTERISTIC_FILTERS: VentasCharacteristicFilters = {
  tipoInmuebleCode: "",
  bedroomsMin: null,
  bathroomsMin: null,
  tieneCochera: false,
  tienePileta: false,
  superficieTotalMin: "",
  superficieTotalMax: "",
  hectareasMin: "",
  hectareasMax: "",
  frenteMin: "",
  fondoMin: "",
  tieneEscritura: false,
  tieneConstruccion: false,
  codigoMoneda: "USD",
  precioMin: "",
  precioMax: "",
};

export const BEDROOM_FILTER_OPTIONS = [
  { value: null, label: "Cualquiera" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
] as const;

export const BATHROOM_FILTER_OPTIONS = [
  { value: null, label: "Cualquiera" },
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
] as const;

function parseNumericInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parsePrecioInput(value: string): number | null {
  return parseNumericInput(value);
}

function terrainFiltersActive(filters: VentasCharacteristicFilters): boolean {
  return (
    parseNumericInput(filters.superficieTotalMin) !== null ||
    parseNumericInput(filters.superficieTotalMax) !== null ||
    parseNumericInput(filters.hectareasMin) !== null ||
    parseNumericInput(filters.hectareasMax) !== null ||
    parseNumericInput(filters.frenteMin) !== null ||
    parseNumericInput(filters.fondoMin) !== null ||
    filters.tieneEscritura ||
    filters.tieneConstruccion
  );
}

export function characteristicFiltersActive(filters: VentasCharacteristicFilters): boolean {
  const sanitized = sanitizeCharacteristicFiltersForTipo(filters);
  return (
    sanitized.tipoInmuebleCode !== "" ||
    sanitized.bedroomsMin !== null ||
    sanitized.bathroomsMin !== null ||
    sanitized.tieneCochera ||
    sanitized.tienePileta ||
    terrainFiltersActive(sanitized) ||
    parsePrecioInput(sanitized.precioMin) !== null ||
    parsePrecioInput(sanitized.precioMax) !== null
  );
}

export type CharacteristicFiltersSearchParams = {
  tipoInmuebleId?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  tieneCochera?: boolean;
  tienePileta?: boolean;
  superficieTotalMin?: number;
  superficieTotalMax?: number;
  frenteMin?: number;
  fondoMin?: number;
  tieneEscritura?: boolean;
  tieneConstruccion?: boolean;
  precioMin?: number;
  precioMax?: number;
  codigoMoneda?: string;
};

export function characteristicFiltersSearchParams(
  filters: VentasCharacteristicFilters,
  tipoInmuebleIds: Record<string, number>,
): CharacteristicFiltersSearchParams {
  return buildCharacteristicFiltersSearchParams(
    sanitizeCharacteristicFiltersForTipo(filters),
    tipoInmuebleIds,
  );
}

function buildCharacteristicFiltersSearchParams(
  filters: VentasCharacteristicFilters,
  tipoInmuebleIds: Record<string, number>,
): CharacteristicFiltersSearchParams {
  const params: CharacteristicFiltersSearchParams = {};
  if (filters.tipoInmuebleCode) {
    const id = tipoInmuebleIds[filters.tipoInmuebleCode];
    if (id) params.tipoInmuebleId = id;
  }
  if (showsDetalleFilterField(filters.tipoInmuebleCode, "bedroomsMin") && filters.bedroomsMin !== null) {
    params.bedroomsMin = filters.bedroomsMin;
  }
  if (showsDetalleFilterField(filters.tipoInmuebleCode, "bathroomsMin") && filters.bathroomsMin !== null) {
    params.bathroomsMin = filters.bathroomsMin;
  }
  if (showsDetalleFilterField(filters.tipoInmuebleCode, "tieneCochera") && filters.tieneCochera) {
    params.tieneCochera = true;
  }
  if (showsDetalleFilterField(filters.tipoInmuebleCode, "tienePileta") && filters.tienePileta) {
    params.tienePileta = true;
  }

  const superficieTotalMin = parseNumericInput(filters.superficieTotalMin);
  const superficieTotalMax = parseNumericInput(filters.superficieTotalMax);
  const hectareasMin = parseNumericInput(filters.hectareasMin);
  const hectareasMax = parseNumericInput(filters.hectareasMax);
  const frenteMin = parseNumericInput(filters.frenteMin);
  const fondoMin = parseNumericInput(filters.fondoMin);
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "superficieTotalMin") && superficieTotalMin !== null) {
    params.superficieTotalMin = superficieTotalMin;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "superficieTotalMax") && superficieTotalMax !== null) {
    params.superficieTotalMax = superficieTotalMax;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "hectareasMin") && hectareasMin !== null) {
    params.superficieTotalMin = hectareasMin * M2_PER_HECTARE;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "hectareasMax") && hectareasMax !== null) {
    params.superficieTotalMax = hectareasMax * M2_PER_HECTARE;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "frenteMin") && frenteMin !== null) {
    params.frenteMin = frenteMin;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "fondoMin") && fondoMin !== null) {
    params.fondoMin = fondoMin;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "tieneEscritura") && filters.tieneEscritura) {
    params.tieneEscritura = true;
  }
  if (showsTerrainFilterField(filters.tipoInmuebleCode, "tieneConstruccion") && filters.tieneConstruccion) {
    params.tieneConstruccion = true;
  }

  const precioMin = parsePrecioInput(filters.precioMin);
  const precioMax = parsePrecioInput(filters.precioMax);
  if (precioMin !== null) params.precioMin = precioMin;
  if (precioMax !== null) params.precioMax = precioMax;
  if (precioMin !== null || precioMax !== null) {
    params.codigoMoneda = filters.codigoMoneda;
  }

  return params;
}

export function formatActiveFiltersSummary(
  filters: VentasCharacteristicFilters,
  tiposInmueble: Array<{ code: string; name: string }>,
): string | null {
  const sanitized = sanitizeCharacteristicFiltersForTipo(filters);
  const parts: string[] = [];
  if (sanitized.tipoInmuebleCode) {
    const tipo = tiposInmueble.find((item) => item.code === sanitized.tipoInmuebleCode);
    parts.push(tipo?.name ?? sanitized.tipoInmuebleCode);
  }
  if (showsDetalleFilterField(sanitized.tipoInmuebleCode, "bedroomsMin") && sanitized.bedroomsMin !== null) {
    parts.push(`${sanitized.bedroomsMin}+ dorm.`);
  }
  if (showsDetalleFilterField(sanitized.tipoInmuebleCode, "bathroomsMin") && sanitized.bathroomsMin !== null) {
    parts.push(`${sanitized.bathroomsMin}+ baño`);
  }
  if (showsDetalleFilterField(sanitized.tipoInmuebleCode, "tieneCochera") && sanitized.tieneCochera) {
    parts.push("Cochera");
  }
  if (showsDetalleFilterField(sanitized.tipoInmuebleCode, "tienePileta") && sanitized.tienePileta) {
    parts.push("Pileta");
  }

  const superficieTotalMin = parseNumericInput(sanitized.superficieTotalMin);
  const superficieTotalMax = parseNumericInput(sanitized.superficieTotalMax);
  const hectareasMin = parseNumericInput(sanitized.hectareasMin);
  const hectareasMax = parseNumericInput(sanitized.hectareasMax);
  if (sanitized.tipoInmuebleCode === "hectares") {
    if (hectareasMin !== null && hectareasMax !== null) {
      parts.push(`${hectareasMin}–${hectareasMax} ha`);
    } else if (hectareasMax !== null) {
      parts.push(`≤ ${hectareasMax} ha`);
    } else if (hectareasMin !== null) {
      parts.push(`≥ ${hectareasMin} ha`);
    }
  } else if (superficieTotalMin !== null && superficieTotalMax !== null) {
    parts.push(`${superficieTotalMin}–${superficieTotalMax} m²`);
  } else if (superficieTotalMax !== null) {
    parts.push(`≤ ${superficieTotalMax} m²`);
  } else if (superficieTotalMin !== null) {
    parts.push(`≥ ${superficieTotalMin} m²`);
  }

  const frenteMin = parseNumericInput(sanitized.frenteMin);
  if (showsTerrainFilterField(sanitized.tipoInmuebleCode, "frenteMin") && frenteMin !== null) {
    parts.push(`Frente ≥ ${frenteMin} m`);
  }
  const fondoMin = parseNumericInput(sanitized.fondoMin);
  if (showsTerrainFilterField(sanitized.tipoInmuebleCode, "fondoMin") && fondoMin !== null) {
    parts.push(`Fondo ≥ ${fondoMin} m`);
  }
  if (showsTerrainFilterField(sanitized.tipoInmuebleCode, "tieneEscritura") && sanitized.tieneEscritura) {
    parts.push("Escritura");
  }
  if (
    showsTerrainFilterField(sanitized.tipoInmuebleCode, "tieneConstruccion") &&
    sanitized.tieneConstruccion
  ) {
    parts.push("Con construcción");
  }

  const precioMin = parsePrecioInput(sanitized.precioMin);
  const precioMax = parsePrecioInput(sanitized.precioMax);
  if (precioMin !== null && precioMax !== null) {
    parts.push(`${sanitized.codigoMoneda} ${precioMin}–${precioMax}`);
  } else if (precioMax !== null) {
    parts.push(`≤ ${sanitized.codigoMoneda} ${precioMax}`);
  } else if (precioMin !== null) {
    parts.push(`≥ ${sanitized.codigoMoneda} ${precioMin}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
