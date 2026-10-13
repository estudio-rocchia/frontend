type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-border/70 ${className}`}
      aria-hidden
    />
  );
}

export function KpiSkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-md border border-border bg-bg-card p-4"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-bg-card">
      <div className="border-b border-border px-5 py-4">
        <Skeleton className="mb-2 h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-4 ${colIndex === 0 ? "w-40" : colIndex === columns - 1 ? "w-20" : "flex-1"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}
