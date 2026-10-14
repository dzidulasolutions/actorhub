import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";
import { ResultsGridSkeleton } from "./results-grid-skeleton";

export function ResultsPageSkeleton() {
  return (
    <div role="status" aria-label="Chargement des résultats">
      <PageHeaderSkeleton />
      <div className="space-y-6 p-5 sm:p-6">
        {/* Sélecteur de collecte : 3 pastilles (nom, infos, étiquette) */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-60 shrink-0 space-y-2 border border-border p-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
        <ResultsGridSkeleton />
      </div>
    </div>
  );
}