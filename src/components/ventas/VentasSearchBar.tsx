"use client";

import { memo } from "react";

import { SearchField } from "@/components/ui/SearchField";

type VentasSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  showResultCount: boolean;
};

export const VentasSearchBar = memo(function VentasSearchBar({
  value,
  onChange,
  placeholder,
  resultCount,
  showResultCount,
}: VentasSearchBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <SearchField
        className="max-w-md flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar en ventas"
      />
      {showResultCount ? (
        <p className="text-[13px] text-text-secondary" aria-live="polite" aria-atomic="true">
          {resultCount === 1 ? "1 resultado" : `${resultCount} resultados`}
        </p>
      ) : null}
    </div>
  );
});
