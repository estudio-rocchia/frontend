export type PaginationPageItem = number | "ellipsis";

/** Rango 1-based de ítems visibles en la página actual. */
export function paginationResultRange(page: number, perPage: number, total: number) {
  if (total <= 0) {
    return { page: 1, from: 0, to: 0, totalPages: 0 };
  }
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);
  return { page: safePage, from, to, totalPages };
}

/**
 * Primera, última, actual y vecinas ±1; huecos como "ellipsis".
 * Con ≤5 páginas muestra todas sin puntos suspensivos.
 */
export function buildPaginationPageItems(
  currentPage: number,
  totalPages: number,
): PaginationPageItem[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pageSet = new Set<number>([
    1,
    totalPages,
    safePage,
    safePage - 1,
    safePage + 1,
  ]);

  const sorted = [...pageSet].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: PaginationPageItem[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const value = sorted[index];
  const prev = sorted[index - 1];
    if (index > 0 && prev !== undefined && value - prev > 1) {
      items.push("ellipsis");
    }
    items.push(value);
  }

  return items;
}
