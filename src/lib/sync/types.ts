export const SYNC_SCOPES = [
  "dashboard",
  "contratos",
  "ventas",
  "clientes",
  "calendario",
  "catalogo",
] as const;

export type SyncScope = (typeof SYNC_SCOPES)[number];

export type SyncStatusResponse = {
  scopes: Partial<Record<SyncScope, { v: number }>>;
};
