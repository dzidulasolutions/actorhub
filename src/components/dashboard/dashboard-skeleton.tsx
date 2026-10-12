import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/layout/page-header";

// Bandeau de 4 statistiques : pastille d'icône + libellé + valeur (style Preforge)
function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 lg:pl-4 lg:first:pl-0">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Une ligne "dernière recherche" : pastille, titre, badge de statut, sous-titre
function SearchRowSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" /> {/* badge statut */}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// Une carte Actor configuré : icône, nom, catégorie, interrupteur
function ActorRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-9 rounded-full" /> {/* switch */}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Chargement du tableau de bord">
      <PageHeaderSkeleton />
      <StatStripSkeleton />
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Colonne gauche : dernières recherches */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-9 w-44 rounded-lg" /> {/* champ de recherche */}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SearchRowSkeleton key={i} />
          ))}
        </section>
        {/* Colonne droite : Actors + raccourcis */}
        <section className="space-y-4">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <ActorRowSkeleton key={i} />
          ))}
        </section>
      </div>
    </div>
  );
}