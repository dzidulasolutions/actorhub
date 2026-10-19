export interface SentEntry {
  to: string;
  subject: string;
  company: string | null;
  sentAt: string; // ISO 8601
}

export const MAX_SENT = 500;

/** Lecture tolérante : des données corrompues donnent un journal vide. */
export function readSent(raw: string | null): SentEntry[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (e): e is SentEntry =>
          typeof e?.to === "string" && typeof e?.subject === "string" && typeof e?.sentAt === "string" &&
          (e.company === null || typeof e.company === "string")
      )
      .slice(0, MAX_SENT);
  } catch {
    return [];
  }
}

/** Ajoute un envoi en tête (le plus récent d'abord), en gardant au plus `max` entrées. */
export const addSentEntry = (list: SentEntry[], entry: SentEntry, max = MAX_SENT): SentEntry[] =>
  [entry, ...list].slice(0, max);

/** Dernier envoi à cette adresse (casse et espaces ignorés), ou null. */
export function findPreviousSend(list: SentEntry[], to: string): SentEntry | null {
  const target = to.trim().toLowerCase();
  if (!target) return null;
  return list.find((e) => e.to.trim().toLowerCase() === target) ?? null;
}