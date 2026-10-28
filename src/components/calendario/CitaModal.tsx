"use client";

import { CitaCreateModal } from "@/components/calendario/CitaCreateModal";
import { CitaEditDrawer } from "@/components/calendario/CitaEditDrawer";
import type { CitaDetail } from "@/lib/api/types";

interface CitaModalProps {
  open: boolean;
  token: string;
  userId: number;
  dateKey: string;
  citas: CitaDetail[];
  cita?: CitaDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CitaModal({
  open,
  token,
  userId,
  dateKey,
  citas,
  cita,
  onClose,
  onSaved,
}: CitaModalProps) {
  if (cita) {
    return (
      <CitaEditDrawer
        open={open}
        token={token}
        userId={userId}
        dateKey={dateKey}
        citas={citas}
        cita={cita}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <CitaCreateModal
      open={open}
      token={token}
      userId={userId}
      dateKey={dateKey}
      citas={citas}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
