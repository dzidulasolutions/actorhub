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

export function LetterSkeleton() {
  return (
    <div role="status" aria-label="Chargement de la candidature">
      <PageHeaderSkeleton />
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Réglages : 2 groupes de choix + 2 cases */}
          <SectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-52" />
          </SectionSkeleton>
          {/* Destinataire et objet */}
          <SectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </SectionSkeleton>
          {/* En-tête (aperçu) + texte de la lettre */}
          <SectionSkeleton>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-80 w-full" />
          </SectionSkeleton>
        </div>
        {/* Actions */}
        <div className="h-fit space-y-3 border border-border bg-card p-4">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}