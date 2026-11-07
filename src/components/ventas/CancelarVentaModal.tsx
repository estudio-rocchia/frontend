"use client";

import { useRef, useState } from "react";
import { Ban } from "lucide-react";

import { ButtonDanger, ButtonOutline } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RocchiaDateField } from "@/components/ui/RocchiaDateField";
import { ApiError, cancelVenta } from "@/lib/api";
import type { VentaDetail } from "@/lib/api/types";
import { rentalApiErrorMessage } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

function fechaLocalHoy(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CancelarVentaModal({
  open,
  onClose,
  venta,
  subtitle,
  token,
  onCancelled,
}: {
  open: boolean;
  onClose: () => void;
  venta: VentaDetail;
  subtitle: string;
  token: string | null;
  onCancelled: () => void;
}) {
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"fecha" | null>(null);
  const fechaRef = useRef<HTMLDivElement>(null);
  const hoy = fechaLocalHoy();
  const fechaMinima = venta.fechaBoleto ?? undefined;

  async function confirm() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelVenta(token, venta.id, fecha, notas);
      onCancelled();
    } catch (err) {
      setConfirmar(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("La sesión venció. Volvé a entrar.");
      } else {
        setError(rentalApiErrorMessage(err, "No se pudo cancelar la venta"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Cancelar venta"
        subtitle={subtitle}
        footer={
          <>
            <ButtonOutline type="button" onClick={onClose} disabled={submitting}>
              Cancelar
            </ButtonOutline>
            <ButtonDanger
              type="button"
              className="gap-2"
              disabled={submitting}
              onClick={() => {
                if (!fecha) {
                  setInvalidField("fecha");
                  setError("Ingresá la fecha de cancelación.");
                  fechaRef.current?.querySelector("button")?.focus();
                  return;
                }
                if (fecha > hoy) {
                  setInvalidField("fecha");
                  setError("La fecha no puede ser futura.");
                  fechaRef.current?.querySelector("button")?.focus();
                  return;
                }
                if (fechaMinima && fecha < fechaMinima) {
                  setInvalidField("fecha");
                  setError(`La fecha debe ser posterior al boleto (${fechaMinima}).`);
                  fechaRef.current?.querySelector("button")?.focus();
                  return;
                }
                setInvalidField(null);
                setError(null);
                setConfirmar(true);
              }}
            >
              <Ban className="h-4 w-4" aria-hidden />
              Cancelar venta
            </ButtonDanger>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-sm text-text-primary">
          <p className="text-text-secondary">
            La operación queda archivada como cancelada. El inmueble puede volver al flujo de ventas.
          </p>
          {error ? (
            <p id="cancelar-venta-error" className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <RocchiaDateField
            ref={fechaRef}
            id="cancelar-venta-fecha"
            label="Fecha de cancelación"
            value={fecha}
            onChange={setFecha}
            invalid={invalidField === "fecha"}
            error={invalidField === "fecha" ? error ?? undefined : undefined}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-text-secondary">Nota</span>
            <textarea
              value={notas}
              maxLength={500}
              onChange={(event) => setNotas(event.target.value)}
              className={`${formInputClass} min-h-24`}
            />
          </label>
        </div>
      </Modal>
      <Modal
        open={confirmar}
        onClose={() => {
          if (!submitting) setConfirmar(false);
        }}
        title="¿Cancelar esta venta?"
        titleId="confirmar-cancelar-venta-titulo"
        maxWidthClass="max-w-md"
        footer={
          <>
            <ButtonOutline type="button" onClick={() => setConfirmar(false)} disabled={submitting}>
              Cancelar
            </ButtonOutline>
            <ButtonDanger type="button" disabled={submitting} onClick={() => void confirm()}>
              {submitting ? "Cancelando…" : "Cancelar venta"}
            </ButtonDanger>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-text-secondary">
          La venta queda cancelada y deja de figurar entre las operaciones activas. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  );
}
