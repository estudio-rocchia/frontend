import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section className={`rocchia-panel overflow-hidden ${className}`}>
      {accent ? <div className="rocchia-panel-accent" aria-hidden /> : null}
      {children}
    </section>
  );
}
