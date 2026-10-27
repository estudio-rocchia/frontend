"use client";

export function DashboardAnimatedCount({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span key={value} className={`dashboard-count-pop inline-block tabular-nums ${className}`}>
      {value}
    </span>
  );
}
