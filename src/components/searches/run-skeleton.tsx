import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

export function RunSkeleton() {
  return (
    <div role="status" aria-label="Chargement de la recherche">
      <PageHeaderSkeleton />
      {/* Bandeau de 4 indicateurs : statut, durée, coût, résultats */}
      <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 lg:pl-4 lg:first:pl-0">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        {/* Étapes */}
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-1 items-center gap-3">
              <Skeleton className="size-8 shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        {/* Aperçu des résultats */}
        <div className="space-y-3 border border-border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}