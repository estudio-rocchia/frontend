"use client";

import type { Key } from "react";
import { Select, SelectItem } from "@/components/base/select/select";

export type EnumSelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export function EnumSelect<T extends string>({
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
  invalid = false,
}: {
  label?: string;
  value: T | "";
  onChange: (value: T | "") => void;
  options: EnumSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  allowEmpty?: boolean;
  emptyLabel?: string;
  invalid?: boolean;
}) {
  const selectedKey: Key | null = value === "" ? (allowEmpty ? "" : null) : value;

  return (
    <Select
      label={label}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (key == null) return;
        onChange(key === "" ? "" : (String(key) as T));
      }}
      isDisabled={disabled}
      isInvalid={invalid}
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
          id={option.value}
          textValue={option.label}
          isDisabled={option.disabled}
        >
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
