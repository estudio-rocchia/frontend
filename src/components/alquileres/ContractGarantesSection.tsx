"use client";

import { useEffect, useState } from "react";

import {
  PersonaSelectField,
  emptyNewPersonaField,
  isNewPersonaFieldValid,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ApiError, addContratoGarante, removeContratoGarante } from "@/lib/api";
import type { ContratoDetail } from "@/lib/api/types";
import { resolveTenantPersona } from "@/lib/alquileres/persona-resolve";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { fetchParteNombres } from "@/lib/ventas/partes";

function garanteErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.message.includes("already a guarantor")) {
      return "Esa persona ya es garante de este contrato.";
    }
    if (err.code === "FORBIDDEN") {
      return "No tenés permiso para modificar los garantes.";
    }
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function ContractGarantesSection({
  contrato,
  editable,
  token,
  onChanged,
}: {
  contrato: ContratoDetail;
  editable: boolean;
  token: string;
  onChanged: () => void;
}) {
  const [nombres, setNombres] = useState<Record<number, string>>({});
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PersonaFieldValue>(emptyNewPersonaField());
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const idsKey = contrato.garantes.map((garante) => garante.personaId).join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",").map(Number) : [];
    if (ids.length === 0) {
      setNombres({});
      return;
    }
    let cancelled = false;
    void fetchParteNombres(token, ids).then((next) => {
      if (!cancelled) setNombres(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token, idsKey]);

  function startAdding() {
    setDraft(emptyNewPersonaField());
    setError(null);
    setAdding(true);
  }

  function cancelAdding() {
    setAdding(false);
    setDraft(emptyNewPersonaField());
    setError(null);
  }

  async function handleSave() {
    if (!isNewPersonaFieldValid(draft)) {
      setError("Elegí una persona o cargá el nombre.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const persona = await resolveTenantPersona(token, draft);
      if (persona.id === contrato.inquilinoId) {
        setError("El inquilino no puede ser garante del mismo contrato.");
        return;
      }
      if (contrato.garantes.some((garante) => garante.personaId === persona.id)) {
        setError("Esa persona ya es garante de este contrato.");
        return;
      }
      await addContratoGarante(token, contrato.id, { personaId: persona.id });
      setAdding(false);
      setDraft(emptyNewPersonaField());
      onChanged();
    } catch (err) {
      setError(garanteErrorMessage(err, "No se pudo agregar el garante."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(personaId: number) {
    setRemovingId(personaId);
    setError(null);
    try {
      await removeContratoGarante(token, contrato.id, personaId);
      onChanged();
    } catch (err) {
      setError(garanteErrorMessage(err, "No se pudo quitar el garante."));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Garantes</span>
        {editable && !adding ? (
          <button
            type="button"
            onClick={startAdding}
            className={`rocchia-action text-[13px] font-semibold text-primary ${interactiveFocusClass}`}
          >
            Agregar garante
          </button>
        ) : null}
      </div>

      {contrato.garantes.length === 0 && !adding ? (
        <p className="text-[13px] text-text-secondary">
          {editable ? "Todavía no hay garantes en este contrato." : "Sin garantes."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {contrato.garantes.map((garante) => {
            const removing = removingId === garante.personaId;
            return (
              <li
                key={garante.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-border bg-bg-page px-3 py-2"
              >
                <span className="min-w-0 text-[13px] font-medium text-text-primary">
                  {nombres[garante.personaId] ?? "Cargando…"}
                </span>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => void handleRemove(garante.personaId)}
                    disabled={removing || saving}
                    className={`rocchia-action shrink-0 text-[12px] font-semibold text-danger disabled:opacity-50 ${interactiveFocusClass}`}
                  >
                    {removing ? "Quitando…" : "Quitar"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-3 rounded-[21px] border border-dashed border-primary/40 bg-primary-soft/20 p-3">
          <PersonaSelectField
            label="Garante"
            value={draft}
            onChange={setDraft}
            token={token}
            searchId={`contrato-garante-${contrato.id}`}
            placeholder="Nombre o apellido del garante…"
          />
          <div className="flex flex-wrap gap-2">
            <ButtonPrimary type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </ButtonPrimary>
            <ButtonOutline type="button" onClick={cancelAdding} disabled={saving}>
              Cancelar
            </ButtonOutline>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
