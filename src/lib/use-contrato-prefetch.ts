"use client";

import { useCallback, useRef } from "react";

import { fetchContrato, fetchInmuebleFicha } from "@/lib/api";
import type { ContratoDetail } from "@/lib/api/types";

type PrefetchEntry = {
  detail: ContratoDetail;
  propietarios: Array<{
    personaId: number;
    nombre?: string | null;
    apellido?: string | null;
    razonSocial?: string | null;
  }>;
};

const cache = new Map<number, Promise<PrefetchEntry>>();

export function useContratoPrefetch(token: string | null) {
  const inflight = useRef(cache);

  const prefetch = useCallback(
    (contratoId: number) => {
      if (!token || inflight.current.has(contratoId)) return;

      const promise = fetchContrato(token, contratoId).then(async (detail) => {
        let propietarios: PrefetchEntry["propietarios"] = [];
        if (detail.inmueble?.id) {
          try {
            const ficha = await fetchInmuebleFicha(token, detail.inmueble.id);
            propietarios = ficha.propietarios;
          } catch {
            // staff may lack owner detail permission
          }
        }
        return { detail, propietarios };
      });

      inflight.current.set(contratoId, promise);
    },
    [token],
  );

  const consume = useCallback(async (contratoId: number): Promise<PrefetchEntry | null> => {
    const pending = inflight.current.get(contratoId);
    if (!pending) return null;
    try {
      return await pending;
    } catch {
      inflight.current.delete(contratoId);
      return null;
    }
  }, []);

  const invalidate = useCallback((contratoId?: number) => {
    if (contratoId === undefined) {
      inflight.current.clear();
      return;
    }
    inflight.current.delete(contratoId);
  }, []);

  return { prefetch, consume, invalidate };
}
