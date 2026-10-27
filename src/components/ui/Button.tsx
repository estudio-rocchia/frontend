import type { ButtonHTMLAttributes } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const base =
  `inline-flex items-center justify-center rounded-sm px-[18px] py-2.5 text-sm font-medium transition-colors ${interactiveFocusClass}`;

export function ButtonOutline({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${base} border border-border bg-bg-card text-text-primary ${className}`}
      {...props}
    />
  );
}

export function ButtonPrimary({
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} bg-primary font-semibold text-text-on-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
