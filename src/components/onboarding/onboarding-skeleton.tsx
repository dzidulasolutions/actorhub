import { Skeleton } from "@/components/ui/skeleton";

// Variante pour fond noir : tons blancs translucides
const onDark = "bg-white/10 before:via-white/10";

export function OnboardingSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="flex min-h-screen bg-card">
      {/* Panneau gauche : logo, 3 étapes, slogan */}
      <aside className="hidden w-105 shrink-0 flex-col justify-between bg-black p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <Skeleton className={`size-9 ${onDark}`} />
          <Skeleton className={`h-5 w-28 ${onDark}`} />
        </div>
        <div className="space-y-6">
          {[28, 36, 32].map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className={`size-8 ${onDark}`} />
              <Skeleton className={`h-4 ${onDark}`} style={{ width: `${w * 4}px` }} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className={`h-6 w-40 ${onDark}`} />
          <Skeleton className={`h-6 w-24 ${onDark}`} />
        </div>
      </aside>

      {/* Contenu : "Passer", étiquette, titre, texte, 3 lignes, bouton */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end px-6 pt-8 lg:px-12">
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center space-y-8 px-6 pb-12 lg:px-0">
          <div className="space-y-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="divide-y divide-border border border-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="size-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    </div>
  );
}