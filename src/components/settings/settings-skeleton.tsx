import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Section : titre, texte, puis lignes (libellé + valeur) et boutons
function SectionSkeleton({ rows, buttons }: { rows: number; buttons: number }) {
  return (
    <div className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between gap-4">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: buttons }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-44" />
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Chargement des paramètres">
      <PageHeaderSkeleton withAction={false} />
      <div className="max-w-3xl space-y-6 p-5 sm:p-6">
        <SectionSkeleton rows={1} buttons={1} />
        <SectionSkeleton rows={2} buttons={1} />
        <SectionSkeleton rows={0} buttons={3} />
      </div>
    </div>
  );
}