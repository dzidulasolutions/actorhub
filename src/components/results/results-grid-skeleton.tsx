import { Skeleton } from "@/components/ui/skeleton";

// Reproduit ResultCard : image, titre, catégorie/note, adresse, bloc de contact
function CardSkeleton() {
  return (
    <div className="flex flex-col border border-border bg-card">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-4/5" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-3.5 w-3/4" />
        <div className="space-y-2 border-t border-border pt-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function ResultsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {/* Barre d'outils : recherche + tri */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 min-w-56 flex-1" />
        <Skeleton className="h-10 w-44" />
      </div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[28, 32, 24, 36].map((w, i) => (
          <Skeleton key={i} className="h-8" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}