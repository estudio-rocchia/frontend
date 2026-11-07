"use client";

import type { Key } from "react";
import { Select, SelectItem } from "@/components/base/select/select";

export type NumericSelectOption = {
  value: number;
  label: string;
  disabled?: boolean;
};

export function NumericSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  disabled,
  className,
  size = "md",
  allowEmpty = false,
  emptyLabel = "—",
}: {
  label?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  options: NumericSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const hasValue = value != null && Number.isFinite(value);
  const selectedKey: Key | null = hasValue ? String(value) : allowEmpty ? "" : null;

  return (
    <Select
      label={label}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (key == null) return;
        if (key === "") {
          onChange(null);
          return;
        }
        onChange(Number(key));
      }}
      isDisabled={disabled}
      placeholder={placeholder}
      className={className}
      size={size}
    >
      {allowEmpty ? (
        <SelectItem id="" textValue={emptyLabel}>
          {emptyLabel}
        </SelectItem>
      ) : null}
      {options.map((option) => (
        <SelectItem
          key={option.value}
          id={String(option.value)}
          textValue={option.label}
          isDisabled={option.disabled}
        >
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
