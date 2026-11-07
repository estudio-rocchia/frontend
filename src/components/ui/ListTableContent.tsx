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
  placeholderClassName,
}: {
  isInitialLoad: boolean;
  loading: boolean;
  refreshing: boolean;
  listTransitionKey: string;
  initialSkeleton: ReactNode;
  children: ReactNode;
  placeholderClassName?: string;
}) {
  if (loading && isInitialLoad) return initialSkeleton;
  if (refreshing) return <ListTablePlaceholder className={placeholderClassName} />;
  return <ListTransitionShell transitionKey={listTransitionKey}>{children}</ListTransitionShell>;
}
