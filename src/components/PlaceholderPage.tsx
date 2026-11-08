import { pagePaddingClass, workspaceStackClass } from "@/lib/layout";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className={`${workspaceStackClass} ${pagePaddingClass}`}>
      <header className="glass-card p-5">
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Pantalla en construcción — seguimos incorporando funciones al panel Rocchia.
        </p>
      </header>
    </div>
  );
}
