// src/components/results/result-detail-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Bloc type "section" : titre + lignes de champs
function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4 border border-border p-4">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className="h-4" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
        </div>
      ))}
    </div>
  );
}

export function ResultDetailSkeleton() {
  return (
    <div role="status" aria-label="Chargement de la fiche">
      <PageHeaderSkeleton />
      <div className="space-y-6 p-5 sm:p-6">
        <Skeleton className="h-4 w-40" /> {/* lien de retour */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <SectionSkeleton rows={4} /> {/* contact */}
            <SectionSkeleton rows={4} /> {/* informations */}
            <div className="space-y-3 border border-border p-4">
              <Skeleton className="h-4 w-36" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr]">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="aspect-4/3 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}