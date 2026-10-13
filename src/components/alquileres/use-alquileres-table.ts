"use client";

import { useCallback, useEffect, useState } from "react";

import type { RentalChipId, RentalRow } from "@/data/alquileres-rentals";
import { ApiError, fetchContratosTableSummary } from "@/lib/api";
import type { ContratoOperativaFilter, ContratoTableStats } from "@/lib/api/types";
import { useCursorPagination } from "@/lib/hooks/use-cursor-pagination";
import { mapContratoTableItemToRentalRow } from "@/lib/mappers/rentals";

export const ALQUILERES_PAGE_SIZE = 15;

export function useAlquileresTable(token: string | null, logout: () => void) {
  const [rows, setRows] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeChip, setActiveChip] = useState<RentalChipId>("todos");
  const [tableTotal, setTableTotal] = useState(0);
  const [tableStats, setTableStats] = useState<ContratoTableStats | null>(null);
  const {
    currentCursor,
    pageIndex,
    canGoPrev,
    canGoNext,
    reset: resetPagination,
    applyResponse,
    goNext,
    goPrev,
  } = useCursorPagination();

  const loadRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const contratosRes = await fetchContratosTableSummary(token, {
        estado: "active",
        limit: ALQUILERES_PAGE_SIZE,
        cursor: currentCursor,
        q: debouncedSearch.trim() || undefined,
        operativa: activeChip as ContratoOperativaFilter,
      });
      setRows(contratosRes.items.map((contrato) => mapContratoTableItemToRentalRow(contrato)));
      setTableTotal(contratosRes.total);
      setTableStats(contratosRes.stats);
      applyResponse(contratosRes.nextCursor);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Error al cargar alquileres");
    } finally {
      setLoading(false);
    }
  }, [token, logout, currentCursor, debouncedSearch, activeChip, applyResponse]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    resetPagination();
  }, [debouncedSearch, activeChip, resetPagination]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const stats = tableStats ?? {
    total: 0,
    aCobrar: 0,
    enMora: 0,
    ajustePendiente: 0,
    renovacionProxima: 0,
  };

  return {
    rows,
    loading,
    error,
    pageIndex,
    canGoPrev,
    canGoNext,
    goNext,
    goPrev,
    searchQuery,
    setSearchQuery,
    activeChip,
    setActiveChip,
    tableTotal,
    tableStats,
    stats,
    loadRows,
  };
}
