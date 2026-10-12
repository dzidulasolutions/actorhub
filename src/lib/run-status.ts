
export type RunStatus = "pending" | "running" | "succeeded" | "failed" | "aborted";

// Infos d'un run renvoyées au navigateur : volontairement minimales
export interface RunInfo {
  id: string;
  status: RunStatus;
  rawStatus: string; // statut Apify d'origine, utile pour déboguer
  datasetId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  usageUsd: number | null; // coût du run, quand Apify le fournit
}

// Traduit les statuts Apify (READY, RUNNING, SUCCEEDED, FAILED, TIMING-OUT,
// TIMED-OUT, ABORTING, ABORTED) vers ceux de l'interface
export function mapApifyStatus(raw: string): RunStatus {
  switch (raw) {
    case "READY":
      return "pending";
    case "RUNNING":
    case "TIMING-OUT": // arrêt pour dépassement imminent : pas encore terminé
    case "ABORTING": // arrêt en cours : pas encore terminé
      return "running";
    case "SUCCEEDED":
      return "succeeded";
    case "ABORTED":
      return "aborted";
    default:
      return "failed"; // FAILED, TIMED-OUT et tout statut inconnu
  }
}

// Un run terminé ne changera plus : on arrête d'interroger Apify
export const isFinal = (s: RunStatus) =>
  s === "succeeded" || s === "failed" || s === "aborted";