"use client";

import { useState } from "react";

import {
  PersonaSelectField,
  emptyNewPersonaField,
  isNewPersonaFieldValid,
  type PersonaFieldValue,
} from "@/components/alquileres/PersonaSelectField";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { ApiError, addVentaParte, removeVentaParte } from "@/lib/api";
import type { ParteVentaRol, VentaDetail } from "@/lib/api/types";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { VENTA_EMPTY_FIELD } from "@/lib/ventas/empty-field";
import { resolvePartePersona } from "@/lib/ventas/persona-resolve";

const ROLES: Array<{
  rol: ParteVentaRol;
  label: string;
  addLabel: string;
  changeLabel: string;
  emptyEditable: string;
  placeholder: string;
  allowMultiple: boolean;
  wide?: boolean;
}> = [
  {
    rol: "buyer",
    label: "Comprador",
    addLabel: "Agregar comprador",
    changeLabel: "Cambiar comprador",
    emptyEditable: "Agregá el comprador de la operación.",
    placeholder: "Nombre o apellido del comprador…",
    allowMultiple: false,
  },
  {
    rol: "seller",
    label: "Vendedor",
    addLabel: "Agregar vendedor",
    changeLabel: "Cambiar vendedor",
    emptyEditable: "Agregá el vendedor de la operación.",
    placeholder: "Nombre o apellido del vendedor…",
    allowMultiple: false,
  },
  {
    rol: "guarantor",
    label: "Garantes",
    addLabel: "Agregar garante",
    changeLabel: "Agregar garante",
    emptyEditable: "Todavía no hay garantes en esta venta.",
    placeholder: "Nombre, apellido o documento del garante…",
    allowMultiple: true,
    wide: true,
  },
];

function parteErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.message.includes("already participates")) {
      return "Esa persona ya está cargada en esta venta con el mismo rol.";
    }
    if (err.code === "FORBIDDEN") {
      return "No tenés permiso para modificar las partes de la venta.";
    }
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

function VentaParteRoleCard({
  venta,
  parteNombres,
  editable,
  token,
  rol,
  label,
  addLabel,
  changeLabel,
  emptyEditable,
  placeholder,
  allowMultiple,
  wide,
  onChanged,
}: {
  venta: VentaDetail;
  parteNombres: Record<number, string>;
  editable: boolean;
  token: string;
  rol: ParteVentaRol;
  label: string;
  addLabel: string;
  changeLabel: string;
  emptyEditable: string;
  placeholder: string;
  allowMultiple: boolean;
  wide?: boolean;
  onChanged: () => void;
}) {
  const partes = venta.partes.filter((parte) => parte.rol === rol);
  const replacesSingle = !allowMultiple && partes.length === 1;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PersonaFieldValue>(emptyNewPersonaField());
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const persona = await resolvePartePersona(token, draft);
      if (partes.some((parte) => parte.personaId === persona.id)) {
        setError("Esa persona ya está cargada en este rol.");
        return;
      }
      await addVentaParte(token, venta.id, { personaId: persona.id, rol });
      if (replacesSingle && partes[0]) {
        try {
          await removeVentaParte(token, venta.id, partes[0].id);
        } catch (err) {
          setAdding(false);
          setDraft(emptyNewPersonaField());
          setError(parteErrorMessage(err, "Se agregó la persona nueva, pero no se pudo quitar la anterior."));
          onChanged();
          return;
        }
      }
      setAdding(false);
      setDraft(emptyNewPersonaField());
      onChanged();
    } catch (err) {
      setError(parteErrorMessage(err, "No se pudo guardar la persona."));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(parteId: number) {
    setRemovingId(parteId);
    setError(null);
    try {
      await removeVentaParte(token, venta.id, parteId);
      onChanged();
    } catch (err) {
      setError(parteErrorMessage(err, "No se pudo quitar la persona."));
    } finally {
      setRemovingId(null);
    }
  }

  const actionLabel = replacesSingle ? changeLabel : addLabel;

  return (
    <div
      className={`flex flex-col gap-3 rounded-sm border border-border/70 bg-bg-card px-3 py-3 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">{label}</span>
        {editable && !adding ? (
          <button
            type="button"
            onClick={startAdding}
            className={`text-[13px] font-semibold text-primary ${interactiveFocusClass}`}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      {partes.length === 0 && !adding ? (
        <p className="text-[13px] text-text-secondary">
          {editable ? emptyEditable : VENTA_EMPTY_FIELD}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {partes.map((parte) => {
            const nombre = parteNombres[parte.personaId] ?? VENTA_EMPTY_FIELD;
            const removing = removingId === parte.id;
            return (
              <li
                key={parte.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-border/70 bg-bg-page px-3 py-2"
              >
                <span className="min-w-0 text-[13px] font-medium text-text-primary">{nombre}</span>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => void handleRemove(parte.id)}
                    disabled={removing || saving}
                    className={`shrink-0 text-[12px] font-semibold text-danger disabled:opacity-50 ${interactiveFocusClass}`}
                  >
                    {removing ? "Quitando..." : "Quitar"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-3 rounded-sm border border-dashed border-primary/40 bg-primary-soft/20 p-3">
          <PersonaSelectField
            label={label}
            value={draft}
            onChange={setDraft}
            token={token}
            searchId={`venta-parte-${rol}`}
            placeholder={placeholder}
          />
          <div className="flex flex-wrap gap-2">
            <ButtonPrimary type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
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

export function VentaPartesSection({
  venta,
  parteNombres,
  editable,
  token,
  onChanged,
}: {
  venta: VentaDetail;
  parteNombres: Record<number, string>;
  editable: boolean;
  token: string;
  onChanged: () => void;
}) {
  return (
    <>
      {ROLES.map((role) => (
        <VentaParteRoleCard
          key={role.rol}
          venta={venta}
          parteNombres={parteNombres}
          editable={editable}
          token={token}
          onChanged={onChanged}
          {...role}
        />
      ))}
    </>
  );
}
