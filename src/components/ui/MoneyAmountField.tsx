"use client";

import { useRef } from "react";

import { caretAfterSignificant, formatAmountTyping } from "@/lib/format";
import { formInputClass } from "@/lib/ui/interactive-focus";

type MoneyAmountFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
};

export function MoneyAmountField({ label, value, onChange, placeholder, id }: MoneyAmountFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const raw = event.target.value;
          const caret = event.target.selectionStart ?? raw.length;
          const significantBefore = raw.slice(0, caret).replace(/[^\d,]/g, "").length;
          const formatted = formatAmountTyping(raw);
          onChange(formatted);
          requestAnimationFrame(() => {
            const node = inputRef.current;
            if (!node) return;
            const next = caretAfterSignificant(formatted, significantBefore);
            node.setSelectionRange(next, next);
          });
        }}
        className={`${formInputClass} tabular-nums`}
      />
    </label>
  );
}
