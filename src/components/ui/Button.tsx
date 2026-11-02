import type { ButtonHTMLAttributes } from "react";

import { interactiveFocusClass } from "@/lib/ui/interactive-focus";

const base =
  `inline-flex min-h-11 items-center justify-center rounded-sm px-[18px] py-2.5 text-sm font-medium transition-colors ${interactiveFocusClass}`;

export const buttonOutlineClass = `${base} border border-border bg-bg-card text-text-primary`;

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
      className={`${base} bg-primary font-semibold text-text-on-primary hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
      className={`${base} bg-danger font-semibold text-text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
