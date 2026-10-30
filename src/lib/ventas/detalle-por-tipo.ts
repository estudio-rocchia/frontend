export type DetalleFilterField = "bedroomsMin" | "bathroomsMin" | "tieneCochera" | "tienePileta";

export type TerrainFilterField =
  | "superficieTotalMin"
  | "superficieTotalMax"
  | "hectareasMin"
  | "hectareasMax"
  | "frenteMin"
  | "fondoMin"
  | "tieneEscritura"
  | "tieneConstruccion";

export const M2_PER_HECTARE = 10_000;

export type DetalleEditorField =
  | "bedrooms"
  | "bathrooms"
  | "rooms"
  | "superficieCubiertaM2"
  | "tieneCochera"
  | "lugaresCochera"
  | "tienePileta"
  | "tieneParrilla"
  | "tieneDeposito"
  | "observacion";

export interface TipoDetalleProfile {
  sectionTitle: string;
  sectionHint?: string;
  filterFields: DetalleFilterField[];
  terrainFilterFields: TerrainFilterField[];
  editorFields: DetalleEditorField[];
  summaryFields: DetalleEditorField[];
}

export interface DetalleFilterValues {
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
}

const LOT_TERRAIN_FILTERS: TerrainFilterField[] = [
  "superficieTotalMin",
  "superficieTotalMax",
  "frenteMin",
  "fondoMin",
  "tieneEscritura",
  "tieneConstruccion",
];

const HECTARES_TERRAIN_FILTERS: TerrainFilterField[] = ["hectareasMin", "hectareasMax"];

export interface FilterPanelCopy {
  collapsedHint: string;
  detailSectionTitle: string | null;
  detailSectionDescription: string | null;
  terrainSectionTitle: string | null;
  terrainSectionDescription: string | null;
}

const DEFAULT_FILTER_COPY: FilterPanelCopy = {
  collapsedHint: "Elegí un tipo para ver filtros específicos",
  detailSectionTitle: "Características",
  detailSectionDescription: "Dormitorios, baños y equipamiento.",
  terrainSectionTitle: null,
  terrainSectionDescription: null,
};

const FILTER_PANEL_COPY: Record<string, FilterPanelCopy> = {
  lot: {
    collapsedHint: "Precio y medidas del lote",
    detailSectionTitle: null,
    detailSectionDescription: null,
    terrainSectionTitle: "Medidas del lote",
    terrainSectionDescription: "Superficie en m², frente, fondo y estado del terreno.",
  },
  hectares: {
    collapsedHint: "Precio y extensión en hectáreas",
    detailSectionTitle: null,
    detailSectionDescription: null,
    terrainSectionTitle: "Extensión del campo",
    terrainSectionDescription: "Cantidad de hectáreas (1 ha = 10.000 m² en la ficha).",
  },
  house: {
    collapsedHint: "Precio y características de la casa",
    detailSectionTitle: "Vivienda",
    detailSectionDescription: "Ambientes y equipamiento habituales en casas.",
    terrainSectionTitle: null,
    terrainSectionDescription: null,
  },
  apartment: {
    collapsedHint: "Precio y características del departamento",
    detailSectionTitle: "Departamento",
    detailSectionDescription: "Dormitorios, baños y amenities del edificio.",
    terrainSectionTitle: null,
    terrainSectionDescription: null,
  },
  duplex: {
    collapsedHint: "Precio y características del dúplex",
    detailSectionTitle: "Dúplex",
    detailSectionDescription: "Distribución y equipamiento de la unidad.",
    terrainSectionTitle: null,
    terrainSectionDescription: null,
  },
  commercial: {
    collapsedHint: "Precio y espacio comercial",
    detailSectionTitle: "Local comercial",
    detailSectionDescription: "Baños y distribución del local.",
    terrainSectionTitle: null,
    terrainSectionDescription: null,
  },
  warehouse: {
    collapsedHint: "Precio del galpón",
    detailSectionTitle: null,
    detailSectionDescription: null,
    terrainSectionTitle: null,
    terrainSectionDescription: null,
  },
  tower: {
    collapsedHint: "Precio y unidad en torre",
    detailSectionTitle: "Unidad en torre",
    detailSectionDescription: "Dormitorios, baños y cochera.",
    terrainSectionTitle: null,
    terrainSectionDescription: null,
  },
};

export function getFilterPanelCopy(tipoInmuebleCode: string): FilterPanelCopy {
  if (tipoInmuebleCode && FILTER_PANEL_COPY[tipoInmuebleCode]) {
    return FILTER_PANEL_COPY[tipoInmuebleCode];
  }
  return DEFAULT_FILTER_COPY;
}

export function hasDetailFilters(tipoInmuebleCode: string): boolean {
  if (!tipoInmuebleCode) return false;
  return getTipoDetalleProfile(tipoInmuebleCode).filterFields.length > 0;
}

export function hasTerrainFilters(tipoInmuebleCode: string): boolean {
  if (!tipoInmuebleCode) return false;
  return getTipoDetalleProfile(tipoInmuebleCode).terrainFilterFields.length > 0;
}

const RESIDENTIAL_PROFILE: TipoDetalleProfile = {
  sectionTitle: "Detalle edilicio",
  filterFields: ["bedroomsMin", "bathroomsMin", "tieneCochera", "tienePileta"],
  terrainFilterFields: [],
  editorFields: [
    "bedrooms",
    "bathrooms",
    "rooms",
    "superficieCubiertaM2",
    "tieneCochera",
    "lugaresCochera",
    "tienePileta",
    "tieneParrilla",
    "observacion",
  ],
  summaryFields: [
    "bedrooms",
    "bathrooms",
    "superficieCubiertaM2",
    "tieneCochera",
    "lugaresCochera",
    "tienePileta",
    "tieneParrilla",
  ],
};

const TERRAIN_PROFILE: TipoDetalleProfile = {
  sectionTitle: "Detalle del terreno",
  sectionHint: "Superficie total, frente y fondo se cargan en los datos generales del inmueble.",
  filterFields: [],
  terrainFilterFields: LOT_TERRAIN_FILTERS,
  editorFields: ["superficieCubiertaM2", "observacion"],
  summaryFields: ["superficieCubiertaM2"],
};

const COMMERCIAL_PROFILE: TipoDetalleProfile = {
  sectionTitle: "Detalle comercial",
  filterFields: ["bathroomsMin"],
  terrainFilterFields: [],
  editorFields: ["rooms", "bathrooms", "superficieCubiertaM2", "tieneDeposito", "observacion"],
  summaryFields: ["rooms", "bathrooms", "superficieCubiertaM2", "tieneDeposito"],
};

const WAREHOUSE_PROFILE: TipoDetalleProfile = {
  sectionTitle: "Detalle del galpón",
  filterFields: [],
  terrainFilterFields: [],
  editorFields: ["superficieCubiertaM2", "tieneDeposito", "observacion"],
  summaryFields: ["superficieCubiertaM2", "tieneDeposito"],
};

const TOWER_PROFILE: TipoDetalleProfile = {
  sectionTitle: "Detalle de unidad",
  filterFields: ["bedroomsMin", "bathroomsMin", "tieneCochera"],
  terrainFilterFields: [],
  editorFields: [
    "bedrooms",
    "bathrooms",
    "superficieCubiertaM2",
    "tieneCochera",
    "lugaresCochera",
    "observacion",
  ],
  summaryFields: ["bedrooms", "bathrooms", "superficieCubiertaM2", "tieneCochera", "lugaresCochera"],
};

const PROFILES: Record<string, TipoDetalleProfile> = {
  lot: TERRAIN_PROFILE,
  hectares: {
    ...TERRAIN_PROFILE,
    sectionTitle: "Detalle del campo",
    sectionHint: "La superficie del campo se carga en m² en los datos generales (1 ha = 10.000 m²).",
    terrainFilterFields: HECTARES_TERRAIN_FILTERS,
  },
  house: RESIDENTIAL_PROFILE,
  apartment: RESIDENTIAL_PROFILE,
  duplex: RESIDENTIAL_PROFILE,
  commercial: COMMERCIAL_PROFILE,
  warehouse: WAREHOUSE_PROFILE,
  tower: TOWER_PROFILE,
};

export function getTipoDetalleProfile(tipoInmuebleCode: string | null | undefined): TipoDetalleProfile {
  if (tipoInmuebleCode && PROFILES[tipoInmuebleCode]) {
    return PROFILES[tipoInmuebleCode];
  }
  return RESIDENTIAL_PROFILE;
}

export function isTerrainTipo(tipoInmuebleCode: string): boolean {
  return tipoInmuebleCode === "lot" || tipoInmuebleCode === "hectares";
}

export function showsDetalleFilterField(
  tipoInmuebleCode: string,
  field: DetalleFilterField,
): boolean {
  if (!tipoInmuebleCode) return true;
  return getTipoDetalleProfile(tipoInmuebleCode).filterFields.includes(field);
}

export function showsTerrainFilterField(
  tipoInmuebleCode: string,
  field: TerrainFilterField,
): boolean {
  if (!tipoInmuebleCode) return false;
  return getTipoDetalleProfile(tipoInmuebleCode).terrainFilterFields.includes(field);
}

export function showsDetalleEditorField(
  tipoInmuebleCode: string | null | undefined,
  field: DetalleEditorField,
): boolean {
  return getTipoDetalleProfile(tipoInmuebleCode).editorFields.includes(field);
}

export function sanitizeDetalleFilterValues<T extends DetalleFilterValues>(filters: T): T {
  if (!filters.tipoInmuebleCode) {
    return {
      ...filters,
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
    };
  }
  const profile = getTipoDetalleProfile(filters.tipoInmuebleCode);
  return {
    ...filters,
    bedroomsMin: profile.filterFields.includes("bedroomsMin") ? filters.bedroomsMin : null,
    bathroomsMin: profile.filterFields.includes("bathroomsMin") ? filters.bathroomsMin : null,
    tieneCochera: profile.filterFields.includes("tieneCochera") ? filters.tieneCochera : false,
    tienePileta: profile.filterFields.includes("tienePileta") ? filters.tienePileta : false,
    superficieTotalMin: profile.terrainFilterFields.includes("superficieTotalMin")
      ? filters.superficieTotalMin
      : "",
    superficieTotalMax: profile.terrainFilterFields.includes("superficieTotalMax")
      ? filters.superficieTotalMax
      : "",
    hectareasMin: profile.terrainFilterFields.includes("hectareasMin") ? filters.hectareasMin : "",
    hectareasMax: profile.terrainFilterFields.includes("hectareasMax") ? filters.hectareasMax : "",
    frenteMin: profile.terrainFilterFields.includes("frenteMin") ? filters.frenteMin : "",
    fondoMin: profile.terrainFilterFields.includes("fondoMin") ? filters.fondoMin : "",
    tieneEscritura: profile.terrainFilterFields.includes("tieneEscritura")
      ? filters.tieneEscritura
      : false,
    tieneConstruccion: profile.terrainFilterFields.includes("tieneConstruccion")
      ? filters.tieneConstruccion
      : false,
  };
}
