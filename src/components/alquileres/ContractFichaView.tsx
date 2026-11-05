"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, FileX2, Pencil } from "lucide-react";

import { ContractCobranzasSection } from "@/components/alquileres/ContractCobranzasSection";
import { ContractGarantesSection } from "@/components/alquileres/ContractGarantesSection";
import { ContractDepositoPlanSection } from "@/components/alquileres/ContractDepositoPlanSection";
import { ContractServiciosSection } from "@/components/alquileres/ContractServiciosSection";
import { useContractFicha } from "@/components/alquileres/use-contract-ficha";
import { ButtonDanger, ButtonOutline, ButtonPrimary } from "@/components/ui/Button";
import { FieldBlock } from "@/components/ui/FormLayout";
import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/auth-context";
import { downloadRescisionContrato } from "@/lib/api";
import { daysUntilDate, downloadBlob, formatDateDisplay, moneyClassName, rentalApiErrorMessage } from "@/lib/format";
import { pagePaddingClass } from "@/lib/layout";
import { canCollectRentFromCuotas } from "@/lib/mappers/cuotas";

const CobrarAlquilerModal = dynamic(
  () =>
    import("@/components/alquileres/CobrarAlquilerModal").then((mod) => ({
      default: mod.CobrarAlquilerModal,
    })),
  { ssr: false },
);

const RescindirContratoModal = dynamic(
  () =>
    import("@/components/alquileres/RescindirContratoModal").then((mod) => ({
      default: mod.RescindirContratoModal,
    })),
  { ssr: false },
);

const FinalizarContratoModal = dynamic(
  () =>
    import("@/components/alquileres/FinalizarContratoModal").then((mod) => ({
      default: mod.FinalizarContratoModal,
    })),
  { ssr: false },
);

const EditContractModal = dynamic(
  () =>
    import("@/components/alquileres/EditContractModal").then((mod) => ({
      default: mod.EditContractModal,
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
  return <h3 className="text-[13px] font-medium text-text-secondary">{children}</h3>;
}

function estadoVariant(estado: string): "success" | "warning" | "danger" {
  if (estado === "Activo") return "success";
  if (estado === "Rescindido") return "danger";
  return "warning";
}

function tabFromQuery(value: string | null): FichaTab | null {
  if (value === "resumen" || value === "cobranzas" || value === "deposito" || value === "servicios") {
    return value;
  }
  return null;
}

export function ContractFichaView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const contratoId = Number(params.id);
  const validId = Number.isInteger(contratoId) && contratoId > 0;

  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<FichaTab>("resumen");
  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [rescindirModalOpen, setRescindirModalOpen] = useState(false);
  const [rescisionError, setRescisionError] = useState<string | null>(null);

  useEffect(() => {
    const tab = tabFromQuery(searchParams.get("tab"));
    if (tab) setActiveTab(tab);
  }, [searchParams]);

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
    serviciosFocusPanel,
    clearServiciosFocusPanel,
    handleCreateServicio,
    handleUpdateServicio,
    handleDeactivateServicio,
    handleConsultarAgua,
    handleConsultarSameep,
    handleConsultarSecheep,
    handleImportSecheep,
    handleCreatePeriodo,
    handleCreatePlanDeposito,
    handleRegisterPago,
    handleDownloadRecibo,
    handleCobrarSuccess,
    handleUpdateContrato,
    reloadFicha,
  } = useContractFicha({ contratoId, validId, token, logout });

  const contratoCode = contrato?.contratoCode ?? detail?.propertyCode ?? "—";
  const metaLine = useMemo(() => {
    if (!detail) return "";
    return [
      detail.tenant,
      detail.property,
      detail.propertyLocation !== "—" ? detail.propertyLocation : null,
      detail.contractStart !== "—" ? `desde ${detail.contractStart}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [detail]);

  const canEdit = contrato?.estado === "active";
  const canFinish = Boolean(canEdit && contrato && daysUntilDate(contrato.fechaFin) <= 30);
  const canCollect = canEdit && contrato && canCollectRentFromCuotas(cuotas, contrato);
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

      <header className="flex flex-col gap-4 border border-border bg-bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-normal tracking-tight text-text-primary">{contratoCode}</h1>
            {metaLine ? <p className="text-sm text-text-secondary">{metaLine}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={detail.estado} variant={estadoVariant(detail.estado)} />
              <span className="rounded-full bg-bg-page px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                {detail.adjustmentIndex}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end sm:text-right">
            <span className="text-[13px] text-text-secondary">Alquiler mensual</span>
            <span className={`text-[30px] font-medium leading-none text-text-primary ${moneyClassName}`}>
              {detail.previousAmount}
            </span>
        </div>
        </div>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <ButtonOutline
                type="button"
                className="gap-2"
                onClick={() => setEditModalOpen(true)}
                disabled={submitting}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Editar datos
              </ButtonOutline>
              {canCollect ? (
                <ButtonPrimary
                  type="button"
                  className="gap-2"
                  onClick={() => setCobrarModalOpen(true)}
                  disabled={serviciosLoading || submitting}
                >
                  <Banknote className="h-4 w-4" aria-hidden />
                  Cobrar alquiler
                </ButtonPrimary>
              ) : null}
              {canFinish ? (
                <ButtonOutline
                  type="button"
                  data-testid="ficha-finalizar"
                  onClick={() => setFinishModalOpen(true)}
                  disabled={submitting}
                >
                  Finalizar
                </ButtonOutline>
              ) : null}
              <ButtonDanger
                type="button"
                className="gap-2"
                data-testid="ficha-rescindir"
                onClick={() => setRescindirModalOpen(true)}
                disabled={submitting}
              >
                <FileX2 className="h-4 w-4" aria-hidden />
                Rescindir contrato
              </ButtonDanger>
            </div>
          ) : null}
      </header>

      <section className="rounded-md border border-border bg-bg-card">
        <div className="flex flex-wrap gap-2 border-b border-border px-5 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`ficha-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`dashboard-press px-3 py-2 text-[13px] ${
                activeTab === tab.id
                  ? "border-b border-primary text-text-primary"
                  : "border-b border-transparent text-text-secondary hover:text-text-primary"
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
              {contrato?.rescisionDocumentoId ? (
                <div className="flex flex-col gap-3">
                  <SectionTitle>Rescisión</SectionTitle>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldBlock
                      label="Fecha"
                      value={contrato.rescisionEn ? formatDateDisplay(contrato.rescisionEn) : "—"}
                    />
                    <FieldBlock label="Nota" value={contrato.rescisionNotas?.trim() || "—"} />
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    {rescisionError ? (
                      <p className="text-sm text-danger">{rescisionError}</p>
                    ) : null}
                    <ButtonOutline
                      type="button"
                      onClick={() => {
                        if (!token || !contrato) return;
                        setRescisionError(null);
                        void downloadRescisionContrato(token, contrato.id)
                          .then(({ blob, filename }) => downloadBlob(blob, filename ?? "rescision"))
                          .catch((err) => {
                            setRescisionError(rentalApiErrorMessage(err, "No se pudo abrir el documento"));
                          });
                      }}
                    >
                      Descargar documento
                    </ButtonOutline>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <SectionTitle>Identificación</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Código de propiedad" value={detail.propertyCode} />
                  <FieldBlock label="Propiedad" value={detail.property} />
                  <div className="sm:col-span-2">
                    <FieldBlock label="Ubicación" value={detail.propertyLocation} />
                  </div>
                  <FieldBlock label="Inicio" value={detail.contractStart} />
                  <FieldBlock label="Fin" value={detail.contractEnd} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Partes</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label="Inquilino" value={detail.tenant} />
                  <FieldBlock label="Propietario" value={detail.owner} />
                  {contrato && token ? (
                    <ContractGarantesSection
                      contrato={contrato}
                      editable={canEdit}
                      token={token}
                      onChanged={() => void reloadFicha()}
                    />
                  ) : null}
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
              contrato={contrato}
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
              onConsultarSecheep={handleConsultarSecheep}
              onConsultarAgua={handleConsultarAgua}
              onConsultarSameep={handleConsultarSameep}
              onRegisterPago={handleRegisterPago}
              mediosPago={mediosPago}
              canRegisterPago={canEdit}
              focusPanel={serviciosFocusPanel}
              onFocusPanelConsumed={clearServiciosFocusPanel}
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
      {rescindirModalOpen && contrato ? (
        <RescindirContratoModal
          open
          contratoId={contrato.id}
          subtitle={`${detail.tenant} · ${detail.property}`}
          fechaInicio={contrato.fechaInicio}
          token={token}
          onClose={() => setRescindirModalOpen(false)}
          onRescinded={() => {
            setRescindirModalOpen(false);
            void reloadFicha("Contrato rescindido.");
          }}
        />
      ) : null}
      {finishModalOpen && contrato ? (
        <FinalizarContratoModal
          open
          contratoId={contrato.id}
          subtitle={`${detail.tenant} · ${detail.property}`}
          token={token}
          onClose={() => setFinishModalOpen(false)}
          onFinished={() => {
            setFinishModalOpen(false);
            void reloadFicha("Contrato finalizado. No se creó uno nuevo.");
          }}
        />
      ) : null}
      {editModalOpen ? (
        <EditContractModal
          open={editModalOpen}
          contrato={contrato}
          token={token}
          submitting={submitting}
          onClose={() => setEditModalOpen(false)}
          onSubmit={(form) => {
            void handleUpdateContrato(form).then((ok) => {
              if (ok) setEditModalOpen(false);
            });
          }}
        />
      ) : null}
    </div>
  );
}
