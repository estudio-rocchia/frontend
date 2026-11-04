"use client";

import { useEffect, useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, createTramiteVisa, fetchPersonas } from "@/lib/api";
import type { PersonaRecord } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

interface NuevoTramiteModalProps {
  open: boolean;
  token: string;
  onClose: () => void;
  onCreated: (tramiteId: number) => void;
  personaFija?: { id: number; nombre: string };
  grupoId?: number;
}

export function NuevoTramiteModal({
  open,
  token,
  onClose,
  onCreated,
  personaFija,
  grupoId,
}: NuevoTramiteModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonaRecord[]>([]);
  const [selected, setSelected] = useState<PersonaRecord | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
    onClose();
  }

  useEffect(() => {
    if (!open || personaFija || query.trim().length < 2) return;
    const handle = window.setTimeout(() => {
      setSearching(true);
      void fetchPersonas(token, { q: query.trim(), limit: 8, activo: true })
        .then((page) => setResults(page.items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [open, personaFija, query, token]);

  async function handleSubmit() {
    const personaId = personaFija?.id ?? selected?.id;
    if (!personaId) {
      setError("Elegí un solicitante");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createTramiteVisa(token, {
        personaId,
        grupoId: grupoId ?? null,
      });
      setQuery("");
      setResults([]);
      setSelected(null);
      onCreated(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el trámite");
    } finally {
      setSaving(false);
    }
  }

  const title = grupoId ? "Agregar integrante" : "Crear trámite";
  const subtitle = grupoId
    ? "La cotización del grupo se recalcula con la cantidad de personas."
    : "Un trámite por persona. Si viajan juntos, sumalos al mismo grupo.";

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex w-full justify-end gap-2">
          <ButtonOutline onClick={close} disabled={saving}>
            Cerrar
          </ButtonOutline>
          <ButtonPrimary onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Guardando…" : grupoId ? "Agregar" : "Crear trámite"}
          </ButtonPrimary>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {personaFija ? (
          <p className="text-sm text-text-primary">
            Solicitante: <span className="font-semibold">{personaFija.nombre}</span>
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Solicitante</span>
              <input
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setSelected(null);
                  if (value.trim().length < 2) setResults([]);
                }}
                placeholder="Nombre o documento"
                className={formInputClass}
              />
            </label>
            {selected ? (
              <p className="text-sm text-text-primary">
                Elegido: <span className="font-semibold">{personaDisplayName(selected)}</span>
                {selected.numeroDocumento ? ` · ${selected.numeroDocumento}` : ""}
              </p>
            ) : null}
            {searching ? <p className="text-xs text-text-secondary">Buscando…</p> : null}
            {!selected && results.length > 0 ? (
              <ul className="flex flex-col overflow-hidden rounded-sm border border-border">
                {results.map((persona) => (
                  <li key={persona.id} className="border-t border-border first:border-t-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-bg-page"
                      onClick={() => {
                        setSelected(persona);
                        setQuery(personaDisplayName(persona));
                        setResults([]);
                      }}
                    >
                      <span className="font-medium text-text-primary">{personaDisplayName(persona)}</span>
                      <span className="text-xs text-text-secondary">{persona.numeroDocumento ?? ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
