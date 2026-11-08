import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { pagePaddingClass, workspaceStackClass } from "@/lib/layout";

function WorkspaceLoadingFallback() {
  return (
    <div className={`${workspaceStackClass} ${pagePaddingClass}`}>
      <p className="text-sm font-medium text-text-secondary">Cargando módulo…</p>
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}

export function lazyWorkspace(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
) {
  return dynamic(
    () =>
      loader().then((mod) => ({
        default: mod[exportName] as ComponentType,
      })),
    { loading: () => <WorkspaceLoadingFallback /> },
  );
}
