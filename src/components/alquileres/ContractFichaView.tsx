"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ContractCobranzasSection } from "@/components/alquileres/ContractCobranzasSection";
import { ContractDepositoPlanSection } from "@/components/alquileres/ContractDepositoPlanSection";
import { ContractServiciosSection } from "@/components/alquileres/ContractServiciosSection";
import { useContractFicha } from "@/components/alquileres/use-contract-ficha";
import { ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { moneyClassName } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { canCollectRentFromCuotas } from "@/lib/mappers/cuotas";

const CobrarAlquilerModal = dynamic(
  () =>
    import("@/components/alquileres/CobrarAlquilerModal").then((mod) => ({
      default: mod.CobrarAlquilerModal,
    })),
  { ssr: false },
);

type FichaTab = "resumen" | "cobranzas" | "deposito" | "servicios";

const tabs: { id: FichaTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "cobranzas", label: "Cobranzas" },
  { id: "deposito", label: "Depósito" },
  { id: "servicios", label: "Servicios" },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{children}</h3>
  );
}

function contractInitials(code: string): string {
  const cleaned = code.replace(/^ALQ-/i, "").trim();
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function estadoVariant(estado: string): "success" | "warning" | "danger" {
  if (estado === "Activo") return "success";
  if (estado === "Rescindido") return "danger";
  return "warning";
}

export function ContractFichaView() {
  const router = useRouter();
  const params = useParams();
  const contratoId = Number(params.id);
  const validId = Number.isInteger(contratoId) && contratoId > 0;

  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);

  const {
    detail,
    contrato,
    servicios,
    periodos,
    planesDeposito,
    tiposServicio,
    mediosPago,
    cuotas,
    pagos,
    loading,
    serviciosLoading,
    submitting,
    error,
    success,
    handleCreateServicio,
    handleUpdateServicio,
    handleDeactivateServicio,
    handleImportSecheep,
    handleCreatePeriodo,
    handleCreatePlanDeposito,
    handleRegisterPago,
    handleDownloadRecibo,
    handleCobrarSuccess,
  } = useContractFicha({ contratoId, validId, token, logout });

  const contratoCode = contrato?.contratoCode ?? detail?.propertyCode ?? "—";
  const metaLine = useMemo(() => {
    if (!detail) return "";
    return [detail.tenant, detail.property, detail.contractStart !== "—" ? `desde ${detail.contractStart}` : null]
      .filter(Boolean)
      .join(" · ");
  }, [detail]);

  const canEdit = contrato?.estado === "active";
  const canCollect = canEdit && canCollectRentFromCuotas(cuotas);
  const cobrarSubtitle = detail ? `${detail.tenant} · ${detail.property}` : undefined;

  if (!validId || (error && !detail && !loading)) {
    return (
      <div className={`flex flex-col gap-4 ${pagePaddingClass}`}>
        <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
          {error ?? "Contrato no encontrado."}
        </p>
        <ButtonOutline onClick={() => router.push("/alquileres")}>Volver al listado</ButtonOutline>
      </div>
    );
  }

  if (loading || !detail) {
    return (
      <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
        <Skeleton className="h-4 w-32" />
        <PageHeaderSkeleton />
        <div className="rounded-md border border-border bg-bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <button
        type="button"
        onClick={() => router.push("/alquileres")}
        className="flex w-fit items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al listado
      </button>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => router.push("/alquileres")}
          className="rounded-t-sm px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Listado
        </button>
        <span className="rounded-t-sm border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary">
          Ficha de contrato
        </span>
      </div>

      <header className="flex flex-col gap-4 rounded-md border border-border bg-bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary"
            aria-hidden
          >
            {contractInitials(contratoCode)}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold text-primary">{contratoCode}</h1>
            {metaLine ? <p className="text-sm text-text-secondary">{metaLine}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={detail.estado} variant={estadoVariant(detail.estado)} />
              <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                {detail.adjustmentIndex}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col gap-1 sm:text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              Alquiler mensual
            </span>
            <span className={`text-[26px] font-bold leading-none text-primary ${moneyClassName}`}>
              {detail.previousAmount}
            </span>
          </div>
          {canCollect ? (
            <ButtonPrimary
              type="button"
              onClick={() => setCobrarModalOpen(true)}
              disabled={serviciosLoading || submitting}
            >
              Cobrar
            </ButtonPrimary>
          ) : null}
        </div>
      </header>

      <section className="rounded-md border border-border bg-bg-card">
        <div className="flex flex-wrap gap-2 border-b border-border px-5 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`ficha-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-sm px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6 p-5">
          {error ? (
            <p className="rounded-sm border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
          {success ? (
            <p className="rounded-sm border border-success bg-success-bg px-3 py-2 text-sm text-success">{success}</p>
          ) : null}

          {activeTab === "resumen" ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <SectionTitle>Identificación</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Código de propiedad" value={detail.propertyCode} />
                  <FieldBlock label="Propiedad" value={detail.property} />
                  <FieldBlock label="Inicio" value={detail.contractStart} />
                  <FieldBlock label="Fin" value={detail.contractEnd} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Partes</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Inquilino" value={detail.tenant} />
                  <FieldBlock label="Propietario" value={detail.owner} />
                  <FieldBlock label="Garantes" value={detail.guarantors} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Condiciones económicas</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Depósito de garantía" value={detail.depositAmount} />
                  <FieldBlock label="Índice de ajuste" value={detail.adjustmentIndex} />
                  <FieldBlock label="Frecuencia de ajuste" value={detail.adjustmentFrequency} />
                  <FieldBlock label="Día de vencimiento" value={detail.paymentDueDay} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Mora</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Recargo (%)" value={detail.surchargePercent} />
                  <FieldBlock label="Observaciones" value={detail.punitiveHint} />
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "cobranzas" ? (
            <ContractCobranzasSection
              cuotas={cuotas}
              pagos={pagos}
              mediosPago={mediosPago}
              loading={serviciosLoading}
              submitting={submitting}
              onDownloadRecibo={handleDownloadRecibo}
            />
          ) : null}

          {activeTab === "deposito" ? (
            contrato ? (
              <ContractDepositoPlanSection
                contrato={contrato}
                planes={planesDeposito}
                loading={serviciosLoading}
                submitting={submitting}
                canManage={canEdit}
                onCreatePlan={handleCreatePlanDeposito}
              />
            ) : (
              <p className="text-sm text-text-secondary">Cargando datos del depósito…</p>
            )
          ) : null}

          {activeTab === "servicios" ? (
            <ContractServiciosSection
              servicios={servicios}
              periodos={periodos}
              tiposServicio={tiposServicio}
              canEdit={canEdit}
              loading={serviciosLoading}
              submitting={submitting}
              onCreateServicio={handleCreateServicio}
              onUpdateServicio={handleUpdateServicio}
              onDeactivateServicio={handleDeactivateServicio}
              onCreatePeriodo={handleCreatePeriodo}
              onImportSecheep={handleImportSecheep}
              onRegisterPago={handleRegisterPago}
              mediosPago={mediosPago}
              canRegisterPago={canEdit}
            />
          ) : null}
        </div>
      </section>
      {cobrarModalOpen ? (
        <CobrarAlquilerModal
          open={cobrarModalOpen}
          onClose={() => setCobrarModalOpen(false)}
          contratoId={contratoId}
          token={token}
          subtitle={cobrarSubtitle}
          mediosPago={mediosPago}
          onSuccess={() => void handleCobrarSuccess()}
        />
      ) : null}
    </div>
  );
}
