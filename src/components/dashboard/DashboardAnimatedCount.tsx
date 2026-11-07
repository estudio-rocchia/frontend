"use client";

export function DashboardAnimatedCount({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return <span className={`inline-block tabular-nums ${className}`}>{value}</span>;
}
