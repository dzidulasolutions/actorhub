import type { NormalizedResult } from "../types/results";

export interface JobNote {
  text: string;
  updatedAt: string; // ISO 8601
}
export type JobNotes = Record<string, JobNote>;

export const MAX_NOTES = 200;
export const MAX_NOTE_CHARS = 20_000;

/**
 * Clé stable d'une offre : l'identifiant de la plateforme (donc la même après une réimportation,
 * contrairement à l'identifiant de la recherche), sinon son lien, sinon son titre et son entreprise.
 */
export function jobKey(r: NormalizedResult): string {
  const id = r.raw.id;
  if ((typeof id === "string" && id.trim() !== "") || typeof id === "number") return `${r.kind}:id:${id}`;
  if (r.url) return `${r.kind}:url:${r.url}`;
  return `${r.kind}:t:${(r.title ?? "").toLowerCase()}|${(r.tagline ?? "").toLowerCase()}`;
}

/** Lecture tolérante : des données corrompues donnent un carnet vide, pas une erreur. */
export function readNotes(raw: string | null): JobNotes {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    const out: JobNotes = {};
    for (const [key, v] of Object.entries(data)) {
      const note = v as Partial<JobNote> | null;
      if (note && typeof note.text === "string" && typeof note.updatedAt === "string") {
        out[key] = { text: note.text.slice(0, MAX_NOTE_CHARS), updatedAt: note.updatedAt };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Ne garde que les `max` notes les plus récentes. */
export function pruneNotes(notes: JobNotes, max = MAX_NOTES): JobNotes {
  const entries = Object.entries(notes);
  if (entries.length <= max) return notes;
  return Object.fromEntries(entries.sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt)).slice(0, max));
}