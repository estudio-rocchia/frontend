"use client";

import { useCallback, useState } from "react";

import { type RentalRow } from "@/data/alquileres-rentals";
import { ApiError, fetchCatalog } from "@/lib/api";
import type { CatalogoItem } from "@/lib/api/types";

interface UseAlquileresCobrarOptions {
  token: string | null;
  showToast: (message: string) => void;
}

export function useAlquileresDrawer({ token, showToast }: UseAlquileresCobrarOptions) {
  const [mediosPago, setMediosPago] = useState<CatalogoItem[]>([]);
  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);
  const [cobrarRow, setCobrarRow] = useState<RentalRow | null>(null);

  const openCollectFromRow = useCallback(
    async (row: RentalRow) => {
      if (!token) return;
      if (mediosPago.length === 0) {
        try {
          const res = await fetchCatalog(token, "/catalogos/medios-pago");
          setMediosPago(res.items);
        } catch (err) {
          showToast(err instanceof ApiError ? err.message : "No se pudieron cargar los medios de pago");
          return;
        }
      }
      setCobrarRow(row);
      setCobrarModalOpen(true);
    },
    [token, mediosPago.length, showToast],
  );

  return {
    mediosPago,
    cobrarModalOpen,
    setCobrarModalOpen,
    cobrarRow,
    setCobrarRow,
    openCollectFromRow,
  };
}
