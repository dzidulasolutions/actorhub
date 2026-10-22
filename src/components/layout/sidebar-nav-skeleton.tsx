import { Skeleton } from "@/components/ui/skeleton";

// Même structure que SidebarNav : 2 groupes (5 liens, puis 1 lien)
export function SidebarNavSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6" aria-hidden="true">
      {[7, 2].map((count, g) => (
        <div key={g} className="space-y-1">
          <Skeleton className="mx-3 mb-2 h-3 w-16" />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-4" style={{ width: `${60 + ((i * 17) % 40)}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}