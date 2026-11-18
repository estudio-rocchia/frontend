"use client";

import type { ReactNode } from "react";

import { ListTransitionShell } from "@/components/ui/ListTransitionShell";
import { LIST_TABLE_PLACEHOLDER_CLASS } from "@/lib/ui/use-list-refresh-transition";

export function ListTablePlaceholder({ className }: { className?: string }) {
  return <div className={className ?? LIST_TABLE_PLACEHOLDER_CLASS} aria-hidden />;
}

export function ListTableContent({
  isInitialLoad,
  loading,
  refreshing,
  listTransitionKey,
  initialSkeleton,
  children,
}: {
  isInitialLoad: boolean;
  loading: boolean;
  refreshing: boolean;
  listTransitionKey: string;
  initialSkeleton: ReactNode;
  children: ReactNode;
  /** @deprecated Recargas mantienen el listado visible; el placeholder ya no se usa. */
  placeholderClassName?: string;
}) {
  if (loading && isInitialLoad) return initialSkeleton;

  return (
    <ListTransitionShell transitionKey={listTransitionKey}>
      <div aria-busy={refreshing || loading}>{children}</div>
    </ListTransitionShell>
  );
}