import { cn } from "@/lib/utils";
import type { MatchLevel, MatchResult } from "@/lib/job-match";

const LEVELS: Record<MatchLevel, { label: string; bar: string; text: string }> = {
  fort: { label: "forte", bar: "bg-success", text: "text-success" },
  moyen: { label: "moyenne", bar: "bg-highlight", text: "text-foreground" },
  faible: { label: "faible", bar: "bg-muted-foreground/40", text: "text-muted-foreground" },
};

// Score sous forme de barre : valeur en pourcentage + niveau en toutes lettres (pas seulement une couleur)
export function MatchBar({ match }: { match: MatchResult }) {
  const level = LEVELS[match.level];
  return (
    <div
      className="space-y-1"
      role="meter"
      aria-label="Correspondance avec ton profil"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={match.score}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">Correspondance {level.label}</span>
        <span className={cn("font-semibold", level.text)}>{match.score} %</span>
      </div>
      <div className="h-1.5 w-full bg-muted">
        <div className={cn("h-full", level.bar)} style={{ width: `${match.score}%` }} />
      </div>
    </div>
  );
}