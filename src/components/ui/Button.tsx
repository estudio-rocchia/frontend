import type { ButtonHTMLAttributes } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const base =
  `rocchia-action inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed ${interactiveFocusClass}`;

export const buttonOutlineClass = `${base} border border-border bg-bg-card text-text-primary hover:bg-bg-page disabled:border-border disabled:bg-bg-page/60 disabled:text-text-secondary`;

export function ButtonOutline({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${buttonOutlineClass} ${className}`}
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
      className={`${base} bg-primary font-semibold text-text-on-primary hover:bg-primary-dark ${className}`}
      {...props}
    />
  );
}

export function ButtonDanger({
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} bg-danger font-semibold text-text-on-primary hover:opacity-90 ${className}`}
      {...props}
    />
  );
}
