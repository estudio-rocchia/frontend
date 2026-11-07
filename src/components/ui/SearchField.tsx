import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

export function SearchField({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label
      className={`flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-bg-page px-3 py-2 transition-colors focus-within:border-primary lg:max-w-md ${className}`}
    >
      <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
        {...props}
      />
    </label>
  );
}
