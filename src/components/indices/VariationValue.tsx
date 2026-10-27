export function VariationValue({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-text-secondary">—</span>;
  }
  const tone = value.startsWith("+")
    ? "text-success"
    : value.startsWith("-")
      ? "text-danger"
      : "text-text-primary";
  return <span className={`font-medium tabular-nums ${tone}`}>{value}</span>;
}
