"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, fetchTarifaVisa, updateTarifaVisa } from "@/lib/api";
import type {
  AlcanceConceptoTarifa,
  CategoriaConceptoTarifa,
  DestinoConceptoTarifa,
  TarifaVisa,
} from "@/lib/api/types";
import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

type PrecioFijo = Exclude<keyof TarifaVisa, "conceptos">;

const HONORARIOS: { key: PrecioFijo; label: string; hint: string }[] = [
  { key: "honorarioIndividualUsd", label: "Individual", hint: "1 persona" },
  { key: "honorarioGrupoChicoUsd", label: "Grupo chico", hint: "2 o 3 personas, por integrante" },
  { key: "honorarioGrupoGrandeUsd", label: "Grupo grande", hint: "4 o más personas, por integrante" },
];

const CAMBIO_TURNO = {
  key: "cambioTurnoUsd",
  label: "Cambio de turno",
  hint: "Cada vez que se mueve o se adelanta",
} as const;

const ARANCEL = {
  key: "arancelConsularUsd",
  label: "Arancel consular",
  hint: "Lo cobra el consulado. No queda en el estudio.",
} as const;

const FIELDS = [...HONORARIOS, CAMBIO_TURNO, ARANCEL];
const CONCEPTO_MAX = 12;
const TARIFF_GRID = "grid grid-cols-[minmax(0,1fr)_7.25rem_2.25rem] gap-3";

type ExtraDraft = {
  id: string;
  nombre: string;
  categoria: CategoriaConceptoTarifa;
  alcance: AlcanceConceptoTarifa;
  destino: DestinoConceptoTarifa;
  monto: string;
};

function emptyDraft(): Record<PrecioFijo, string> {
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
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [adding, setAdding] = useState<CategoriaConceptoTarifa | null>(null);
  const [addNombre, setAddNombre] = useState("");
  const [addMonto, setAddMonto] = useState("");
  const [addAlcance, setAddAlcance] = useState<AlcanceConceptoTarifa>("persona");
  const [addDestino, setAddDestino] = useState<DestinoConceptoTarifa>("estudio");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchKey = open ? token : "";
  const [seenKey, setSeenKey] = useState(fetchKey);

  if (fetchKey !== seenKey) {
    setSeenKey(fetchKey);
    if (fetchKey) {
      setError(null);
      setLoading(true);
      setExtras([]);
      setAdding(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchTarifaVisa(token)
      .then((tarifa) => {
        if (cancelled) return;
        setDraft({
          honorarioIndividualUsd: String(tarifa.honorarioIndividualUsd),
          honorarioGrupoChicoUsd: String(tarifa.honorarioGrupoChicoUsd),
          honorarioGrupoGrandeUsd: String(tarifa.honorarioGrupoGrandeUsd),
          arancelConsularUsd: String(tarifa.arancelConsularUsd),
          cambioTurnoUsd: String(tarifa.cambioTurnoUsd),
        });
        setExtras(
          (tarifa.conceptos ?? []).map((item) => ({
            id: item.id,
            nombre: item.nombre,
            categoria: item.categoria,
            alcance: item.alcance,
            destino: item.destino,
            monto: String(item.montoUsd),
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los precios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  function empezar(categoria: CategoriaConceptoTarifa) {
    setAdding(categoria);
    setAddNombre("");
    setAddMonto("");
    setAddAlcance("persona");
    setAddDestino("estudio");
    setError(null);
  }

  function confirmarExtra() {
    if (!adding) return;
    const nombre = addNombre.trim().replace(/\s+/g, " ");
    const monto = Number(addMonto);
    if (nombre.length < 2 || nombre.length > 40) {
      setError("El nombre tiene que tener entre 2 y 40 caracteres");
      return;
    }
    if (extras.some((item) => item.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) {
      setError("Ya hay un precio con ese nombre");
      return;
    }
    if (!Number.isInteger(monto) || monto < 0 || monto > 9999) {
      setError("El importe tiene que ser un entero entre 0 y 9999");
      return;
    }
    const destino = adding === "honorario" ? "estudio" : addDestino;
    const alcance = adding === "honorario" || destino === "consulado" ? "persona" : addAlcance;
    setExtras((current) => [
      ...current,
      { id: crypto.randomUUID(), nombre, categoria: adding, alcance, destino, monto: String(monto) },
    ]);
    setAdding(null);
    setError(null);
  }

  async function handleSubmit() {
    if (adding) {
      setError("Confirmá o cancelá el precio que estás cargando");
      return;
    }
    const precios = {} as Record<PrecioFijo, number>;
    for (const field of FIELDS) {
      const value = Number(draft[field.key]);
      if (!Number.isInteger(value) || value < 0 || value > 9999) {
        setError(`${field.label} tiene que ser un entero entre 0 y 9999`);
        return;
      }
      precios[field.key] = value;
    }
    const body: TarifaVisa = {
      ...precios,
      conceptos: extras.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        alcance: item.alcance,
        destino: item.destino,
        montoUsd: Number(item.monto),
      })),
    };
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

  const busy = loading || saving;
  const puedeAgregar = extras.length < CONCEPTO_MAX && !busy;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Precios de visa"
      subtitle="Aplican a los trámites que se abran después. Los ya abiertos conservan el precio de ese momento."
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex w-full justify-end gap-2">
          <ButtonOutline onClick={onClose} disabled={saving}>
            Cerrar
          </ButtonOutline>
          <ButtonPrimary onClick={() => void handleSubmit()} disabled={busy}>
            {saving ? "Guardando…" : "Guardar precios"}
          </ButtonPrimary>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
        {loading ? <p className="text-sm text-text-secondary">Cargando tarifa…</p> : null}

        <TariffSection
          id="precios-honorarios"
          title="Honorarios"
          note="Por persona, según cuántas viajan juntas."
        >
          {HONORARIOS.map((field) => (
            <TariffRow
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={draft[field.key]}
              disabled={busy}
              onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
            />
          ))}
          {extras
            .filter((item) => item.categoria === "honorario")
            .map((item) => (
              <TariffRow
                key={item.id}
                label={item.nombre}
                value={item.monto}
                disabled={busy}
                onChange={(value) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, monto: value } : extra)),
                  )
                }
                onRemove={() => setExtras((current) => current.filter((extra) => extra.id !== item.id))}
              />
            ))}
          {adding === "honorario" ? (
            <NuevoPrecio
              categoria="honorario"
              nombre={addNombre}
              monto={addMonto}
              alcance={addAlcance}
              destino={addDestino}
              disabled={busy}
              onNombre={setAddNombre}
              onMonto={setAddMonto}
              onAlcance={setAddAlcance}
              onDestino={setAddDestino}
              onConfirm={confirmarExtra}
              onCancel={() => setAdding(null)}
            />
          ) : (
            <AddRow
              label="Agregar honorario"
              disabled={!puedeAgregar}
              onClick={() => empezar("honorario")}
            />
          )}
        </TariffSection>

        <TariffSection id="precios-otros" title="Otros importes" note="Se suman aparte del honorario.">
          <TariffRow
            label={CAMBIO_TURNO.label}
            hint={CAMBIO_TURNO.hint}
            value={draft.cambioTurnoUsd}
            disabled={busy}
            onChange={(value) => setDraft((current) => ({ ...current, cambioTurnoUsd: value }))}
          />
          <TariffRow
            label={ARANCEL.label}
            hint={ARANCEL.hint}
            value={draft.arancelConsularUsd}
            disabled={busy}
            onChange={(value) => setDraft((current) => ({ ...current, arancelConsularUsd: value }))}
          />
          {extras
            .filter((item) => item.categoria === "otro")
            .map((item) => (
              <TariffRow
                key={item.id}
                label={item.nombre}
                value={item.monto}
                disabled={busy}
                onChange={(value) =>
                  setExtras((current) =>
                    current.map((extra) => (extra.id === item.id ? { ...extra, monto: value } : extra)),
                  )
                }
                onRemove={() => setExtras((current) => current.filter((extra) => extra.id !== item.id))}
              />
            ))}
          {adding === "otro" ? (
            <NuevoPrecio
              categoria="otro"
              nombre={addNombre}
              monto={addMonto}
              alcance={addAlcance}
              destino={addDestino}
              disabled={busy}
              onNombre={setAddNombre}
              onMonto={setAddMonto}
              onAlcance={setAddAlcance}
              onDestino={setAddDestino}
              onConfirm={confirmarExtra}
              onCancel={() => setAdding(null)}
            />
          ) : (
            <AddRow
              label="Agregar importe"
              disabled={!puedeAgregar}
              onClick={() => empezar("otro")}
            />
          )}
        </TariffSection>
      </div>
    </Modal>
  );
}

function TariffSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-md border border-border">
      <header className="border-b border-border bg-bg-page px-4 py-3">
        <div className={`${TARIFF_GRID} items-baseline`}>
          <div className="min-w-0">
            <h3 id={id} className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">{note}</p>
          </div>
          <span className="text-right text-[11px] font-semibold uppercase tracking-wide text-text-secondary">USD</span>
          <span aria-hidden />
        </div>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function TariffRow({
  label,
  hint,
  value,
  disabled,
  onChange,
  onRemove,
}: {
  label: string;
  hint?: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onRemove?: () => void;
}) {
  const inputId = `tarifa-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={`${TARIFF_GRID} items-center px-4 py-3`}>
      <div className="min-w-0">
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs leading-snug text-text-secondary">{hint}</p> : null}
      </div>
      <AmountField id={inputId} label={label} value={value} disabled={disabled} onChange={onChange} />
      {onRemove ? (
        <button
          type="button"
          aria-label={`Quitar ${label}`}
          onClick={onRemove}
          disabled={disabled}
          className={`flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-danger-bg hover:text-danger disabled:opacity-60 ${interactiveFocusClass}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <span className="h-9 w-9" aria-hidden />
      )}
    </div>
  );
}

function AddRow({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <div className="px-4 py-2.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-40 ${interactiveFocusClass}`}
      >
        {label}
      </button>
    </div>
  );
}

function NuevoPrecio({
  categoria,
  nombre,
  monto,
  alcance,
  destino,
  disabled,
  onNombre,
  onMonto,
  onAlcance,
  onDestino,
  onConfirm,
  onCancel,
}: {
  categoria: CategoriaConceptoTarifa;
  nombre: string;
  monto: string;
  alcance: AlcanceConceptoTarifa;
  destino: DestinoConceptoTarifa;
  disabled: boolean;
  onNombre: (value: string) => void;
  onMonto: (value: string) => void;
  onAlcance: (value: AlcanceConceptoTarifa) => void;
  onDestino: (value: DestinoConceptoTarifa) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const consulado = destino === "consulado";

  return (
    <div className="flex flex-col gap-3 bg-bg-page px-4 py-3">
      <div className={`${TARIFF_GRID} items-end`}>
        <label className="flex min-w-0 flex-col gap-1" htmlFor="nuevo-precio-nombre">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Nombre</span>
          <input
            id="nuevo-precio-nombre"
            value={nombre}
            maxLength={40}
            disabled={disabled}
            onChange={(event) => onNombre(event.target.value)}
            className={`h-9 w-full rounded-sm border border-border bg-bg-card px-2.5 text-sm text-text-primary focus:border-primary disabled:opacity-60 ${interactiveFocusClass}`}
          />
        </label>
        <AmountField id="nuevo-precio-monto" label="Importe" value={monto} disabled={disabled} onChange={onMonto} />
        <span className="h-9 w-9" aria-hidden />
      </div>

      {categoria === "otro" ? (
        <div className="flex flex-col gap-2">
          <ChoiceRow label="Se cuenta">
            <Choice
              label="Por persona"
              selected={alcance === "persona" || consulado}
              disabled={disabled}
              onClick={() => onAlcance("persona")}
            />
            <Choice
              label="Una vez"
              selected={alcance === "grupo" && !consulado}
              disabled={disabled || consulado}
              onClick={() => onAlcance("grupo")}
            />
          </ChoiceRow>
          <ChoiceRow label="Lo cobra">
            <Choice
              label="El estudio"
              selected={destino === "estudio"}
              disabled={disabled}
              onClick={() => onDestino("estudio")}
            />
            <Choice
              label="El consulado"
              selected={destino === "consulado"}
              disabled={disabled}
              onClick={() => onDestino("consulado")}
            />
          </ChoiceRow>
          {consulado ? (
            <p className="text-xs text-text-secondary">El consulado se cobra por persona, en la ficha de cada una.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className={`text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-60 ${interactiveFocusClass}`}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-60 ${interactiveFocusClass}`}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

function ChoiceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

function Choice({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 rounded-sm border px-2.5 text-xs font-semibold disabled:opacity-40 ${
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-bg-card text-text-secondary"
      } ${interactiveFocusClass}`}
    >
      {label}
    </button>
  );
}

function AmountField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[11px] font-medium text-text-secondary">
        USD
      </span>
      <input
        id={id}
        type="number"
        min={0}
        max={9999}
        step={1}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        aria-label={`${label} en dólares`}
        onChange={(event) => onChange(event.target.value)}
        className={`h-9 w-full rounded-sm border border-border bg-bg-card pr-2.5 pl-10 text-right text-sm font-medium tabular-nums text-text-primary focus:border-primary disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${interactiveFocusClass}`}
      />
    </div>
  );
}
