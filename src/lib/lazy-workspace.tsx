import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { pagePaddingClass } from "@/lib/layout";

function WorkspaceLoadingFallback() {
  return (
    <div className={`flex flex-col gap-6 ${pagePaddingClass}`}>
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}

export function lazyWorkspace<P extends object>(
  loader: () => Promise<{ [key: string]: ComponentType<P> }>,
  exportName: string,
) {
  return dynamic(
    () => loader().then((mod) => ({ default: mod[exportName] as ComponentType<P> })),
    { loading: () => <WorkspaceLoadingFallback /> },
  );
}
