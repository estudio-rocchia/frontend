"use client";

import { memo } from "react";

import { Pagination } from "@/components/ui/Pagination";
import { VENTAS_CATALOG_PAGE_SIZE } from "@/lib/ventas/catalog-page";

type VentasCatalogPaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export const VentasCatalogPagination = memo(function VentasCatalogPagination({
  page,
  total,
  pageSize = VENTAS_CATALOG_PAGE_SIZE,
  loading = false,
  onPageChange,
}: VentasCatalogPaginationProps) {
  if (total === 0) {
    return (
      <Pagination
        page={1}
        total={0}
        perPage={pageSize}
        onChange={onPageChange}
        disabled={loading}
        resultLabel="resultados"
        className="px-5 py-4"
      />
    );
  }

  if (total <= pageSize) return null;

  return (
    <Pagination
      page={page}
      total={total}
      perPage={pageSize}
      onChange={onPageChange}
      disabled={loading}
      resultLabel="resultados"
      className="px-5 py-4"
    />
  );
});
