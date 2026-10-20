import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Une entrée : titre + badges, destinataire, objet, date, statuts, note, actions
function EntrySkeleton() {
  return (
    <div className="space-y-3 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      <Skeleton className="h-3.5 w-56" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-48" />
      <div className="flex flex-wrap gap-2">
        {[28, 32, 24].map((w, i) => (
          <Skeleton key={i} className="h-8" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

export function TrackingSkeleton() {
  return (
    <div role="status" aria-label="Chargement du suivi">
      <PageHeaderSkeleton withAction={false} />
      {/* Bandeau de 4 statistiques */}
      <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 lg:pl-4 lg:first:pl-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {[24, 32, 32, 36, 28].map((w, i) => (
            <Skeleton key={i} className="h-8" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <EntrySkeleton />
        <EntrySkeleton />
        <EntrySkeleton />
      </div>
    </div>
  );
}