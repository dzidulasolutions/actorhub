import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Un champ : libellé + zone de saisie
function FieldSkeleton({ height = "h-10" }: { height?: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className={`${height} w-full`} />
    </div>
  );
}

function SectionSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 border border-border bg-card p-4 sm:p-5">
      <Skeleton className="h-4 w-36" />
      {children}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Chargement du profil">
      <PageHeaderSkeleton />
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <FieldSkeleton height="h-24" />
          </SectionSkeleton>
          <SectionSkeleton>
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </SectionSkeleton>
          <SectionSkeleton>
            <FieldSkeleton height="h-64" />
          </SectionSkeleton>
        </div>
        {/* Colonne latérale : liste de contrôle */}
        <div className="h-fit space-y-4 border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          ))}
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}