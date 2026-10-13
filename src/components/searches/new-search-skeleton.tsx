import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

export function NewSearchSkeleton() {
  return (
    <div role="status" aria-label="Chargement de la recherche">
      <PageHeaderSkeleton withAction={false} />
      <div className="space-y-6 p-5 sm:p-6">
        {/* Choix de l'Actor */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border border-border p-3">
                <Skeleton className="size-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Formulaire + récapitulatif */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-11 w-40" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="space-y-4 border border-border p-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            ))}
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}