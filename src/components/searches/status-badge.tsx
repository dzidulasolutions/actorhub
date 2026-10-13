// src/components/searches/status-badge.tsx
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/run-status";

const CONFIG: Record<RunStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-muted text-muted-foreground" },
  running: { label: "En cours", className: "bg-accent text-primary" },
  succeeded: { label: "Terminée", className: "bg-success/10 text-success" },
  failed: { label: "Échouée", className: "bg-destructive/10 text-destructive" },
  aborted: { label: "Interrompue", className: "bg-highlight/15 text-black" },
};

export const statusLabel = (s: RunStatus) => CONFIG[s].label;

export function StatusBadge({ status }: { status: RunStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium", className)}>
      <span className="size-1.5 bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}