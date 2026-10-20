// src/components/letter/form-parts.tsx
import { cn } from "@/lib/utils";

// Choix carré à deux options (les composants radio de shadcn sont arrondis)
export function Segmented<T extends string>({
  legend, value, onChange, options,
}: {
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "border px-3 py-2.5 text-sm transition-colors",
              value === o.value ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}