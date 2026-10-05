import { pagePaddingClass } from "@/lib/layout";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className={`flex flex-col gap-2 ${pagePaddingClass}`}>
      <h1 className="text-[22px] font-bold text-text-primary">{title}</h1>
      <p className="text-sm text-text-secondary">
        Pantalla en construcción — diseño en{" "}
        <code className="text-primary">untitled.pen</code>.
      </p>
    </div>
  );
}
