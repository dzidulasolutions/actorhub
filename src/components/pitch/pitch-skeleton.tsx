import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

function SectionSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <Skeleton className="h-4 w-36" />
      {children}
    </div>
  );
}

// Une ligne de case à cocher : case + texte
function CheckRowSkeleton({ width }: { width: string }) {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-4 shrink-0" />
      <Skeleton className="h-4" style={{ width }} />
    </div>
  );
}

export function PitchSkeleton() {
  return (
    <div role="status" aria-label="Chargement de la proposition">
      <PageHeaderSkeleton />
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Réglages : langue et ton */}
          <SectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </SectionSkeleton>
          {/* Services et observations */}
          <SectionSkeleton>
            <CheckRowSkeleton width="70%" />
            <CheckRowSkeleton width="55%" />
            <CheckRowSkeleton width="62%" />
            <Skeleton className="h-px w-full" />
            <CheckRowSkeleton width="80%" />
            <CheckRowSkeleton width="66%" />
          </SectionSkeleton>
          {/* Destinataire et objet */}
          <SectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </SectionSkeleton>
          {/* En-tête (aperçu) + texte */}
          <SectionSkeleton>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-80 w-full" />
          </SectionSkeleton>
        </div>
        {/* Actions + coordonnées de l'entreprise */}
        <div className="h-fit space-y-3 border border-border bg-card p-4">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}