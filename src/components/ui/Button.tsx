import type { ButtonHTMLAttributes } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const base =
  `rocchia-action inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${interactiveFocusClass}`;

export const buttonOutlineClass = `${base} rocchia-action-outline border border-border bg-bg-card text-text-primary shadow-xs disabled:border-border disabled:bg-bg-page/60 disabled:text-text-secondary disabled:shadow-none`;

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
      className={`${base} bg-button-primary font-semibold text-text-on-primary shadow-xs ${className}`}
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
      className={`${base} bg-button-danger font-semibold text-text-on-primary shadow-xs ${className}`}
      {...props}
    />
  );
}
