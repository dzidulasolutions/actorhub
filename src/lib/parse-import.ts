// src/lib/parse-import.ts
// Lecture d'un export ActorHub (ou d'un tableau JSON brut). Tout se passe dans le navigateur.
import { z } from "zod";
import type { SearchRecord } from "@/types/search";

export const MAX_IMPORT_BYTES = 25 * 1024 * 1024; // 25 Mo
export const MAX_IMPORT_ITEMS = 20_000;

export type ImportResult =
  | { ok: true; record: SearchRecord }
  | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const isoDate = (v: unknown) => {
  const s = str(v);
  return s && !Number.isNaN(Date.parse(s)) ? s : null;
};

// Structure minimale d'un export enveloppé : une liste "results" (ou "items", format de notre route dataset)
const envelopeSchema = z.object({
  results: z.array(z.unknown()).optional(),
  items: z.array(z.unknown()).optional(),
});

const baseName = (filename: string) => filename.replace(/\.json$/i, "").slice(0, 60) || "Import";
const defaultId = () => `import-${crypto.randomUUID().slice(0, 8)}`;

/**
 * Accepte :
 *  - un tableau d'objets (export « données originales »),
 *  - un objet { results: [...] } (export « avec métadonnées »).
 * Les métadonnées invalides sont ignorées au lieu de faire échouer l'import.
 * Les objets des résultats ne sont jamais modifiés.
 */
export function parseExport(
  text: string,
  filename: string,
  newId: () => string = defaultId
): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Ce fichier n'est pas un JSON valide" };
  }

  let items: unknown[] | undefined;
  let meta: Record<string, unknown> = {};

  if (Array.isArray(data)) {
    items = data;
  } else if (isRecord(data)) {
    const parsed = envelopeSchema.safeParse(data);
    items = parsed.success ? (parsed.data.results ?? parsed.data.items) : undefined;
    meta = data;
  }

  if (!items) {
    return {
      ok: false,
      error: "Format non reconnu : le fichier doit être un tableau de résultats ou un export contenant « results »",
    };
  }
  if (items.length === 0) return { ok: false, error: "Le fichier ne contient aucun résultat" };
  if (items.length > MAX_IMPORT_ITEMS) {
    return { ok: false, error: `Trop de résultats (${MAX_IMPORT_ITEMS} maximum par fichier)` };
  }

  return {
    ok: true,
    record: {
      id: newId(), // toujours un nouvel identifiant : pas de collision avec une recherche existante
      actorName: str(meta.actorName) ?? baseName(filename),
      apifyId: str(meta.actorId) ?? "fichier-importe",
      input: isRecord(meta.input) ? meta.input : {},
      maxItems: null,
      status: "succeeded",
      datasetId: null, // pas de dataset Apify : rien à recharger
      startedAt: isoDate(meta.startedAt) ?? isoDate(meta.exportedAt),
      finishedAt: isoDate(meta.finishedAt),
      usageUsd: null,
      items,
      total: items.length,
      error: null,
    },
  };
}