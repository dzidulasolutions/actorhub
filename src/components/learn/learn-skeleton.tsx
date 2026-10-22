import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

function SectionSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      {children}
    </div>
  );
}

// Vue d'ensemble : une carte de pack (nom, 5 statistiques, 6 niveaux, actions) et le résumé du programme
export function LearnSkeleton() {
  return (
    <div role="status" aria-label="Chargement de l'espace d'apprentissage">
      <PageHeaderSkeleton />
      <div className="max-w-4xl space-y-6 p-5 sm:p-6">
        <SectionSkeleton>
          <div className="space-y-4 border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-8" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-52" />
          </div>
        </SectionSkeleton>
        <SectionSkeleton>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-9 w-44" />
        </SectionSkeleton>
      </div>
    </div>
  );
}

// Formulaire de réglages : sections de choix
export function SetupSkeleton() {
  return (
    <div role="status" aria-label="Chargement des réglages">
      <PageHeaderSkeleton />
      <div className="max-w-3xl space-y-6 p-5 sm:p-6">
        <SectionSkeleton>
          <div className="grid gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </SectionSkeleton>
        <SectionSkeleton>
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </SectionSkeleton>
        <SectionSkeleton>
          <div className="grid gap-2 sm:grid-cols-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </SectionSkeleton>
      </div>
    </div>
  );
}