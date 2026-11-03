export const kpiTones = [
  {
    wash: "bg-[#e6f3f2]",
    edge: "border-[#b7d9d6]",
    bar: "bg-primary",
    dot: "bg-primary",
  },
  {
    wash: "bg-[#dff6f2]",
    edge: "border-[#9ed9cf]",
    bar: "bg-[#45B3A6]",
    dot: "bg-[#45B3A6]",
  },
  {
    wash: "bg-[#fde4fd]",
    edge: "border-[#f0b0f0]",
    bar: "bg-[#e07edf]",
    dot: "bg-[#e07edf]",
  },
  {
    wash: "bg-[#dff7f8]",
    edge: "border-[#8ee4ea]",
    bar: "bg-[#00C2CB]",
    dot: "bg-[#00C2CB]",
  },
  {
    wash: "bg-[#e4f1ef]",
    edge: "border-[#9ec9c4]",
    bar: "bg-[#0b555a]",
    dot: "bg-[#0b555a]",
  },
] as const;

export type KpiTone = (typeof kpiTones)[number];

export function kpiTone(index: number): KpiTone {
  return kpiTones[index % kpiTones.length];
}
