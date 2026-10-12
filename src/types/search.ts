import type { RunStatus } from "@/lib/run-status";

// Une recherche = un run Apify lancé pendant la session (en mémoire, pas en localStorage)
export interface SearchRecord {
  id: string; // identifiant du run Apify
  actorName: string;
  apifyId: string;
  input: Record<string, unknown>;
  maxItems: number | null;
  status: RunStatus;
  datasetId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  usageUsd: number | null;
  items: unknown[] | null; // null = pas encore chargés ; objets ORIGINAUX d'Apify
  total: number | null; // total dans le dataset (peut dépasser items.length)
  error: string | null;
}