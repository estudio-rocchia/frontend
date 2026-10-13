"use client";

import { useCallback, useRef } from "react";

import {
  fetchInquilinosContext,
  fetchPersona,
  fetchPropietarioPersonaIds,
} from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { buildClientesContext, type ClientesContext } from "@/lib/mappers/clientes";

type PrefetchEntry = {
  persona: PersonaRecord;
  context: ClientesContext;
};

const cache = new Map<number, Promise<PrefetchEntry>>();

export function useClientePrefetch(token: string | null) {
  const inflight = useRef(cache);

  const prefetch = useCallback(
    (personaId: number) => {
      if (!token || inflight.current.has(personaId)) return;

      const promise = Promise.all([
        fetchPersona(token, personaId),
        fetchInquilinosContext(token),
        fetchPropietarioPersonaIds(token),
      ]).then(([persona, inquilinosRes, propietarioIdsRes]) => ({
        persona,
        context: buildClientesContext(inquilinosRes, propietarioIdsRes.personaIds),
      }));

      inflight.current.set(personaId, promise);
    },
    [token],
  );

  const consume = useCallback(async (personaId: number): Promise<PrefetchEntry | null> => {
    const pending = inflight.current.get(personaId);
    if (!pending) return null;
    try {
      return await pending;
    } catch {
      inflight.current.delete(personaId);
      return null;
    }
  }, []);

  return { prefetch, consume };
}
