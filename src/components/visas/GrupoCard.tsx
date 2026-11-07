"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type { IntegranteVisa } from "@/lib/api/types";
import { personaDisplayName } from "@/lib/format";
import { formInputClass, interactiveFocusClass } from "@/lib/ui/interactive-focus";
import { ESTADO_VISA_LABEL, formatUsd } from "@/lib/visas/labels";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function GrupoCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5"
      aria-hidden
    >
      <div className="h-4 w-20 animate-pulse rounded-sm bg-border" />
      <div className="h-12 animate-pulse rounded-md bg-bg-page" />
      <div className="h-12 animate-pulse rounded-md bg-bg-page" />
    </div>
  );
}

export function GrupoCard({
  integrantes,
  currentId,
  canEdit,
  cambiosTurno,
  notas,
  cambioUnitarioUsd,
  dirty,
  valid,
  saving,
  savedMessage,
  errorMessage,
  onCambiosTurno,
  onNotas,
  onSave,
  onDiscard,
  onAdd,
}: {
  integrantes: IntegranteVisa[];
  currentId: number;
  canEdit: boolean;
  cambiosTurno: string;
  notas: string;
  cambioUnitarioUsd: number;
  dirty: boolean;
  valid: boolean;
  saving: boolean;
  savedMessage: string | null;
  errorMessage: string | null;
  onCambiosTurno: (value: string) => void;
  onNotas: (value: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  onAdd: () => void;
}) {
  const countLabel = integrantes.length === 1 ? "1 persona" : `${integrantes.length} personas`;

  return (
    <section
      aria-labelledby="grupo-titulo"
      className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-4 shadow-[var(--shadow-card)] md:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="grupo-titulo" className="text-[15px] font-semibold text-text-primary">
          Grupo
        </h2>
        <p className="text-xs text-text-secondary">{countLabel}</p>
      </div>

      {integrantes.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-text-secondary">
          Este grupo no tiene integrantes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {integrantes.map((integrante) => {
            const current = integrante.id === currentId;
            const label = personaDisplayName(integrante.persona);
            const body = (
              <>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    current ? "bg-primary text-text-on-primary" : "bg-bg-cream text-text-secondary"
                  }`}
                  aria-hidden
                >
                  {initialsOf(label) || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary" title={label}>
                    {label}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {current ? "Este expediente" : ESTADO_VISA_LABEL[integrante.estado]}
                  </span>
                </span>
              </>
            );
            return (
              <li key={integrante.id}>
                {current ? (
                  <div className="flex items-center gap-2.5 rounded-md bg-primary-soft px-2.5 py-2" aria-current="true">
                    {body}
                  </div>
                ) : (
                  <Link
                    href={`/visas/${integrante.id}`}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-bg-page ${interactiveFocusClass}`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit ? (
        <ButtonOutline onClick={onAdd} className="w-full sm:w-auto">
          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
          Agregar integrante
        </ButtonOutline>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <label className="flex flex-col gap-1.5" htmlFor="cambios-turno">
          <span className="text-[11px] font-semibold text-text-secondary">Cambios de turno</span>
          <input
            id="cambios-turno"
            type="number"
            min={0}
            max={20}
            inputMode="numeric"
            value={cambiosTurno}
            disabled={!canEdit || saving}
            aria-invalid={!valid}
            aria-describedby="cambios-turno-ayuda"
            onChange={(event) => onCambiosTurno(event.target.value)}
            className={`${formInputClass} w-full disabled:opacity-60`}
          />
          <span id="cambios-turno-ayuda" className={`text-xs ${valid ? "text-text-secondary" : "text-danger"}`}>
            {valid ? `${formatUsd(cambioUnitarioUsd)} cada uno.` : "Tiene que ser un número de 0 a 20."}
          </span>
        </label>

        <label className="flex flex-col gap-1.5" htmlFor="nota-grupo">
          <span className="text-[11px] font-semibold text-text-secondary">Nota del grupo</span>
          <textarea
            id="nota-grupo"
            value={notas}
            disabled={!canEdit || saving}
            onChange={(event) => onNotas(event.target.value)}
            rows={3}
            placeholder="Solo si aplica a todo el grupo"
            className={`${formInputClass} w-full disabled:opacity-60`}
          />
        </label>

        <div aria-live="polite" className="flex flex-col gap-2">
          {errorMessage ? (
            <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs font-semibold text-danger">
              {errorMessage}
            </p>
          ) : null}
          {savedMessage && !dirty ? (
            <p role="status" className="rounded-sm bg-success-bg px-3 py-2 text-xs font-semibold text-success">
              {savedMessage}
            </p>
          ) : null}
          {canEdit && dirty ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonPrimary className="w-full sm:flex-1" onClick={onSave} disabled={saving || !valid}>
                {saving ? "Guardando…" : "Guardar grupo"}
              </ButtonPrimary>
              <ButtonOutline className="w-full sm:w-auto" onClick={onDiscard} disabled={saving}>
                Descartar
              </ButtonOutline>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
