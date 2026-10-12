import { Skeleton } from "@/components/ui/skeleton";

// En-tête commun à toutes les pages : titre, description, actions à droite
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// Même hauteur et même structure que le vrai en-tête : pas de saut de mise en page
export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-64 max-w-[60vw]" />
      </div>
      {withAction && <Skeleton className="h-9 w-40" />}
    </div>
  );
}