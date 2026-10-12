import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Coque de l'onboarding : panneau noir à gauche (étapes), contenu à droite.
 * Sur mobile : le panneau disparaît, remplacé par une barre de progression.
 */
export function OnboardingShell({
  step,
  steps,
  onSkip,
  children,
}: {
  step: number;
  steps: readonly string[];
  onSkip: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-card">
      {/* ===== Panneau gauche (desktop) ===== */}
      <aside className="hidden w-105 shrink-0 flex-col justify-between bg-black p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center bg-highlight font-display text-lg text-black">
            A
          </div>
          <span className="font-display text-xl tracking-wide">ActorHub</span>
        </div>

        <ol className="space-y-6">
          {steps.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className="flex items-center gap-4"
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center border text-sm font-medium transition-colors",
                    done && "border-white bg-white text-black",
                    active && "border-highlight bg-highlight text-black",
                    !done && !active && "border-white/25 text-white/40"
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    active ? "text-white" : "text-white/45"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="font-display text-2xl leading-snug text-white/90">
          Collect. Explore.
          <br />
          <span className="text-highlight">Export.</span>
        </p>
      </aside>

      {/* ===== Contenu ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre de progression mobile : un segment par étape */}
        <div className="flex gap-1.5 p-4 lg:hidden" aria-hidden="true">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn("h-1 flex-1", i <= step ? "bg-highlight" : "bg-border")}
            />
          ))}
        </div>

        <div className="flex justify-end px-6 pt-4 lg:px-12 lg:pt-8">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Passer
          </button>
        </div>

        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-12 lg:px-0">
          {/* key={step} relance l'animation d'entrée à chaque étape */}
          <div
            key={step}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}