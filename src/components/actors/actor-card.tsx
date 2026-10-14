import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  IconlyLocation2,
  IconlyUser,
  IconlySearch,
  IconlyActivity,
  IconlyEdit,
  IconlyTrash,
} from "@/components/icons/iconly";
import { CATEGORY_LABELS, type ActorConfig } from "@/types/actor";

// Une icône par catégorie (tirée de ton jeu Iconly)
export const CATEGORY_ICONS = {
  maps: IconlyLocation2,
  social: IconlyUser,
  web: IconlySearch,
  other: IconlyActivity,
} as const;

export function ActorCard({
  actor,
  onToggle,
  onEdit,
  onDelete,
}: {
  actor: ActorConfig;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = CATEGORY_ICONS[actor.category];

  return (
    <article
      className={cn(
        "flex flex-col gap-4 border border-border bg-card p-4 transition-opacity",
        !actor.enabled && "opacity-60" // un Actor désactivé est visuellement atténué
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center bg-black text-white">
          <Icon size={20} color="currentColor" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{actor.name}</h3>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {actor.apifyId}
          </p>
        </div>
        <Switch
          checked={actor.enabled}
          onCheckedChange={onToggle}
          aria-label={`${actor.enabled ? "Désactiver" : "Activer"} ${actor.name}`}
        />
      </div>

      {actor.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {actor.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <span className="bg-muted px-2 py-1 text-xs">
          {CATEGORY_LABELS[actor.category]}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            aria-label={`Modifier ${actor.name}`}
            className="grid size-8 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            <IconlyEdit size={18} color="currentColor" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Supprimer ${actor.name}`}
            className="grid size-8 place-items-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <IconlyTrash size={18} color="currentColor" />
          </button>
        </div>
      </div>
    </article>
  );
}