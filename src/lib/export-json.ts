// Utilisable côté navigateur (le téléchargement n'a pas besoin du serveur)

export type ExportScope = "all" | "selected" | "filtered";
export type ExportMode = "original" | "wrapped";

// Métadonnées de la collecte, ajoutées à l'export enveloppé
export interface ExportMeta {
  actorId: string;
  actorName: string;
  runId: string;
  datasetId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  input: Record<string, unknown>; // paramètres utilisés : permet de refaire la même recherche plus tard
}

/**
 * - "original" : le tableau d'objets EXACTEMENT comme renvoyé par Apify.
 * - "wrapped"  : métadonnées + date d'export + nombre + résultats originaux.
 */
export function buildExport(
  items: unknown[],
  mode: ExportMode,
  meta: ExportMeta,
  now: Date = new Date()
): unknown {
  if (mode === "original") return items;
  return {
    actorId: meta.actorId,
    actorName: meta.actorName,
    runId: meta.runId,
    datasetId: meta.datasetId,
    startedAt: meta.startedAt,
    finishedAt: meta.finishedAt,
    input: meta.input,
    exportedAt: now.toISOString(),
    count: items.length,
    results: items,
  };
}

// "Google Maps – Hôtels" → "google-maps-hotels"
export function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "export"
  );
}

const SCOPE_LABEL: Record<ExportScope, string> = {
  all: "tous",
  selected: "selection",
  filtered: "filtres",
};

export function exportFilename(
  actorName: string,
  scope: ExportScope,
  mode: ExportMode,
  count: number,
  now: Date = new Date()
): string {
  const date = now.toISOString().slice(0, 10);
  const suffix = mode === "wrapped" ? "-meta" : "";
  return `actorhub-${slugify(actorName)}-${date}-${SCOPE_LABEL[scope]}-${count}${suffix}.json`;
}

/** Télécharge un JSON lisible (indenté) via un Blob et une URL temporaire, libérée ensuite. */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // libère la mémoire
}