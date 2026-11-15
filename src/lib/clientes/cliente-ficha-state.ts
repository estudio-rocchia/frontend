export type ClienteFichaTabId = "resumen" | "inmobiliaria" | "juridico" | "visas" | "historial";

export function isClienteFichaTabId(value: string | null): value is ClienteFichaTabId {
  return (
    value === "resumen" ||
    value === "inmobiliaria" ||
    value === "juridico" ||
    value === "visas" ||
    value === "historial"
  );
}

export function buildClienteFichaHref(personaId: number, tab?: ClienteFichaTabId): string {
  const base = `/clientes/${personaId}`;
  if (!tab || tab === "resumen") return base;
  return `${base}?tab=${tab}`;
}

export function buildInmuebleFichaFromClienteHref(
  inmuebleId: number,
  clienteId: number,
  clienteTab: ClienteFichaTabId = "inmobiliaria",
): string {
  const params = new URLSearchParams();
  params.set("from", "cliente");
  params.set("clienteId", String(clienteId));
  if (clienteTab !== "resumen") {
    params.set("clienteTab", clienteTab);
  }
  return `/alquileres/inmueble/${inmuebleId}?${params.toString()}`;
}

export function parseClienteFichaReturn(
  searchParams: Pick<URLSearchParams, "get">,
): { clienteId: number; clienteTab: ClienteFichaTabId } | null {
  if (searchParams.get("from") !== "cliente") return null;
  const clienteId = Number(searchParams.get("clienteId"));
  if (!Number.isInteger(clienteId) || clienteId <= 0) return null;
  const tabParam = searchParams.get("clienteTab");
  const clienteTab = isClienteFichaTabId(tabParam) ? tabParam : "inmobiliaria";
  return { clienteId, clienteTab };
}
