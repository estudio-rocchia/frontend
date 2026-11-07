"use client";

import { useCallback, useState } from "react";

import { breakUiCatalogMediosPago } from "@/data/alquileres-break-ui-fixtures";
import { type RentalRow } from "@/data/alquileres-rentals";
import { ApiError, fetchCatalog } from "@/lib/api";
import { useBreakUiMode } from "@/lib/alquileres/break-ui-mode";
import type { CatalogoItem } from "@/lib/api/types";

interface UseAlquileresCobrarOptions {
  token: string | null;
  showToast: (message: string) => void;
}

export function useAlquileresDrawer({ token, showToast }: UseAlquileresCobrarOptions) {
  const breakUi = useBreakUiMode();
  const [mediosPago, setMediosPago] = useState<CatalogoItem[]>([]);
  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);
  const [cobrarRow, setCobrarRow] = useState<RentalRow | null>(null);

  const openCollectFromRow = useCallback(
    async (row: RentalRow) => {
      if (!token) return;
      if (mediosPago.length === 0) {
        if (breakUi.active) {
          setMediosPago(breakUiCatalogMediosPago());
        } else {
          try {
            const res = await fetchCatalog(token, "/catalogos/medios-pago");
            setMediosPago(res.items);
          } catch (err) {
            showToast(err instanceof ApiError ? err.message : "No se pudieron cargar los medios de pago");
            return;
          }
        }
      }
      setCobrarRow(row);
      setCobrarModalOpen(true);
    },
    [token, mediosPago.length, showToast, breakUi.active],
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
