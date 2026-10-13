import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Reproduit une ligne de recherche : nom + statut, id, paramètres, infos, actions
function RowSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-4 border border-border bg-card p-4">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="size-9" />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div role="status" aria-label="Chargement de l'historique">
            <PageHeaderSkeleton />
      <div className="space-y-8 p-5 sm:p-6">
        <section className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </section>
      </div>
    </div>
  );
}