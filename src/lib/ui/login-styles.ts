export const loginFocusClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-login-accent";

export const loginLinkClass = `text-sm font-medium text-login-accent hover:text-login-accent-hover hover:underline ${loginFocusClass}`;

export function loginInputClass(invalid?: boolean) {
  return [
    "rounded-lg border bg-white px-4 py-3 text-[15px] text-text-primary outline-none",
    "placeholder:text-text-secondary/70 focus:border-login-accent",
    loginFocusClass,
    invalid ? "border-danger" : "border-[var(--login-input-border)]",
  ].join(" ");
}

export const loginSubmitClass = `inline-flex w-full items-center justify-center gap-2 rounded-lg bg-login-accent py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-login-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${loginFocusClass}`;

export const loginCardClass =
  "rounded-2xl bg-bg-card px-8 pt-16 pb-8 shadow-[var(--login-shadow-card)]";

export const loginTagline = "Rocchia · Estudio Jurídico e Inmobiliario";
