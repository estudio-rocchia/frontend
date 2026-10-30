export const loginFocusClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-login-accent";

export const loginLinkClass = `text-sm font-medium text-login-accent hover:text-login-accent-hover hover:underline ${loginFocusClass}`;

export function loginInputClass(
  invalid?: boolean,
  { leadingIcon = false, trailingAction = false }: { leadingIcon?: boolean; trailingAction?: boolean } = {},
) {
  return [
    "w-full rounded-lg border bg-white py-3 text-[15px] text-text-primary outline-none transition-colors",
    leadingIcon ? "pl-11" : "pl-4",
    trailingAction ? "pr-11" : "pr-4",
    "placeholder:text-text-secondary/70 focus:border-login-accent",
    "disabled:cursor-not-allowed disabled:bg-bg-page disabled:text-text-secondary",
    loginFocusClass,
    invalid ? "border-danger" : "border-[var(--login-input-border)]",
  ].join(" ");
}

export const loginInputIconClass =
  "pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-text-secondary";

export const loginSubmitClass = `inline-flex w-full items-center justify-center gap-2 rounded-lg bg-login-accent py-3.5 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-login-accent-hover enabled:active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 ${loginFocusClass}`;

export const loginCardClass =
  "rounded-2xl bg-bg-card px-6 pt-16 pb-7 shadow-[var(--login-shadow-card)] sm:px-8 sm:pb-8";

export const loginTagline = "Acceso exclusivo para el equipo de Rocchia";
