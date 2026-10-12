import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Reproduit ActorCard : pastille, nom + id, switch / description / pied avec badge et 2 actions
function ActorCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-9" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-6 w-24" />
        <div className="flex gap-1">
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>
    </div>
  );
}

export function ActorsSkeleton() {
  return (
    <div role="status" aria-label="Chargement des Actors">
      <PageHeaderSkeleton />
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ActorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}