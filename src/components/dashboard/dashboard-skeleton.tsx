// src/components/dashboard/dashboard-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Bandeau de 4 statistiques : pastille d'icône + libellé + valeur
function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 lg:pl-4 lg:first:pl-0">
          <Skeleton className="size-10 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Une ligne « dernière recherche » : pastille, nom, paramètres, date, badge de statut
function SearchRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border border-border bg-card p-4">
      <Skeleton className="size-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

// Une ligne Actor : pastille, nom + catégorie, bouton « Lancer »
function ActorRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border border-border bg-card p-3">
      <Skeleton className="size-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Chargement du tableau de bord">
      <PageHeaderSkeleton />
      <StatStripSkeleton />
      <div className="grid gap-8 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SearchRowSkeleton key={i} />
          ))}
        </section>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <ActorRowSkeleton key={i} />
          ))}
        </section>
      </div>
    </div>
  );
}