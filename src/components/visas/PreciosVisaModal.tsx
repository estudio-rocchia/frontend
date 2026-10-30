"use client";

import { useEffect, useState } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, fetchTarifaVisa, updateTarifaVisa } from "@/lib/api";
import type { TarifaVisa } from "@/lib/api/types";
import { formInputClass } from "@/lib/ui/interactive-focus";

const GRUPOS: { title: string; fields: { key: keyof TarifaVisa; label: string; hint: string }[] }[] = [
  {
    title: "Estudio",
    fields: [
      { key: "honorarioIndividualUsd", label: "1 persona", hint: "USD por persona" },
      { key: "honorarioGrupoChicoUsd", label: "2 o 3 personas", hint: "USD por persona" },
      { key: "honorarioGrupoGrandeUsd", label: "4 o más", hint: "USD por persona" },
      { key: "cambioTurnoUsd", label: "Cambio de turno", hint: "USD por cada cambio o adelanto" },
    ],
  },
  {
    title: "Consulado",
    fields: [
      { key: "arancelConsularUsd", label: "Arancel", hint: "USD por persona. Lo cobra el consulado, no el estudio." },
    ],
  },
];

const FIELDS = GRUPOS.flatMap((grupo) => grupo.fields);

function emptyDraft(): Record<keyof TarifaVisa, string> {
  return {
    honorarioIndividualUsd: "",
    honorarioGrupoChicoUsd: "",
    honorarioGrupoGrandeUsd: "",
    arancelConsularUsd: "",
    cambioTurnoUsd: "",
  };
}

export function PreciosVisaModal({
  open,
  token,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    void fetchTarifaVisa(token)
      .then((tarifa) => {
        setDraft({
          honorarioIndividualUsd: String(tarifa.honorarioIndividualUsd),
          honorarioGrupoChicoUsd: String(tarifa.honorarioGrupoChicoUsd),
          honorarioGrupoGrandeUsd: String(tarifa.honorarioGrupoGrandeUsd),
          arancelConsularUsd: String(tarifa.arancelConsularUsd),
          cambioTurnoUsd: String(tarifa.cambioTurnoUsd),
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los precios");
      })
      .finally(() => setLoading(false));
  }, [open, token]);

  async function handleSubmit() {
    const body = {} as TarifaVisa;
    for (const field of FIELDS) {
      const value = Number(draft[field.key]);
      if (!Number.isInteger(value) || value < 0 || value > 9999) {
        setError(`${field.label} tiene que ser un entero entre 0 y 9999`);
        return;
      }
      body[field.key] = value;
    }
    setSaving(true);
    setError(null);
    try {
      await updateTarifaVisa(token, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los precios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Precios de visa"
      subtitle="Estos importes se aplican a los trámites que se abran después. Los que ya están abiertos conservan el precio con el que se crearon."
      footer={
        <div className="flex w-full justify-end gap-2">
          <ButtonOutline onClick={onClose} disabled={saving}>
            Cerrar
          </ButtonOutline>
          <ButtonPrimary onClick={() => void handleSubmit()} disabled={saving || loading}>
            {saving ? "Guardando…" : "Guardar precios"}
          </ButtonPrimary>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {loading ? <p className="text-sm text-text-secondary">Cargando precios…</p> : null}
        {GRUPOS.map((grupo) => (
          <section key={grupo.title} className="flex flex-col gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{grupo.title}</h3>
            {grupo.fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary">{field.label}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    step={1}
                    inputMode="numeric"
                    value={draft[field.key]}
                    disabled={loading || saving}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    className={formInputClass}
                  />
                  <span className="text-xs font-semibold text-text-secondary">USD</span>
                </span>
                <span className="text-xs text-text-secondary">{field.hint}</span>
              </label>
            ))}
          </section>
        ))}
      </div>
    </Modal>
  );
}
