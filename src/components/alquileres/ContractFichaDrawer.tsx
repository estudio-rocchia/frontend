"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { DrawerPanel } from "@/components/ui/DrawerPanel";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import type {
  AdjustmentIndex,
  ContractDetail,
} from "@/data/alquileres-contract-details";

export type DrawerIntent =
  | "ficha"
  | "recibo"
  | "ajuste"
  | "notificar"
  | "escalar";

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-sm bg-bg-page px-3.5 py-3">
      <span className="text-[11px] font-semibold text-text-secondary">
        {label}
      </span>
      <span className="text-[13px] text-text-primary">{value}</span>
    </div>
  );
}

export function ContractFichaDrawer({
  open,
  detail,
  intent,
  onClose,
  onEmitReceipt,
}: {
  open: boolean;
  detail: ContractDetail | null;
  intent: DrawerIntent;
  onClose: () => void;
  onEmitReceipt: () => void;
}) {
  const [index, setIndex] = useState<AdjustmentIndex>("IPC");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    if (!detail) return;
    setIndex(detail.adjustmentIndex);
    setNewAmount(detail.calculatedNewAmount);
  }, [detail]);

  if (!detail) return null;

  const highlightAdjustment = intent === "ajuste" || intent === "recibo";

  const banner =
    intent === "notificar" ? (
      <p className="rounded-sm border border-warning bg-warning-bg px-3 py-2 text-xs font-medium text-warning">
        Recordatorio de mora enviado al inquilino (simulación UI).
      </p>
    ) : intent === "escalar" ? (
      <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-xs font-medium text-danger">
        Caso marcado para escalamiento jurídico (simulación UI).
      </p>
    ) : null;

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Ficha de contrato"
      subtitle={detail.drawerRef}
      banner={banner}
      footer={
        <>
          <ButtonOutline onClick={onClose}>Cancelar</ButtonOutline>
          <ButtonPrimary
            id="emitir-recibo-pdf"
            onClick={() => {
              onEmitReceipt();
            }}
          >
            Emitir recibo PDF
          </ButtonPrimary>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <FieldBlock label="Propiedad" value={detail.property} />
          <FieldBlock label="Inquilino" value={detail.tenant} />
          <FieldBlock label="Propietario" value={detail.owner} />
          <FieldBlock label="Garantes" value={detail.guarantors} />
        </div>

        <div
          className={`flex flex-col gap-2.5 ${highlightAdjustment ? "rounded-md ring-2 ring-primary/30 ring-offset-2 ring-offset-bg-card" : ""}`}
        >
          <p className="text-[13px] font-semibold text-text-primary">
            Índice de ajuste
          </p>
          <div className="flex flex-wrap gap-2">
            {(["ICL", "IPC", "CAC"] as const).map((chip) => {
              const active = index === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setIndex(chip)}
                  className={`rounded-full border border-border px-4 py-2 text-[13px] font-semibold ${
                    active
                      ? "bg-primary text-text-on-primary"
                      : "bg-bg-page text-text-secondary"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md bg-primary-soft p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-text-secondary">Monto anterior</p>
            <p className="text-xl font-bold text-text-primary">
              {detail.previousAmount}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
          <ButtonOutline
            type="button"
            onClick={() => setNewAmount(detail.calculatedNewAmount)}
          >
            Calcular
          </ButtonOutline>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[11px] text-text-secondary">Monto nuevo</p>
            <p className="text-xl font-bold text-primary">{newAmount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <p className="text-[13px] font-semibold text-text-primary">
            Mora e intereses punitorios
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-secondary">
                Días desde día 10
              </label>
              <div className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary">
                {detail.daysSince10}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-secondary">
                Recargo configurable (%)
              </label>
              <div className="rounded-sm border border-border bg-bg-page px-3 py-2.5 text-[13px] text-text-primary">
                {detail.surchargePercent}
              </div>
            </div>
          </div>
          <p className="text-xs text-text-secondary">{detail.punitiveHint}</p>
        </div>
      </div>
    </DrawerPanel>
  );
}
