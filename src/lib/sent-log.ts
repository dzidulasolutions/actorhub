export type SentPurpose = "application" | "pitch";
export type ContactStatus = "waiting" | "replied" | "done";

export interface SentEntry {
  to: string;
  subject: string;
  company: string | null;
  sentAt: string; // ISO 8601
  ref?: string | null; // clé de la fiche (offre ou entreprise) à laquelle l'envoi se rapporte
  purpose?: SentPurpose; // absent sur les anciens envois : ce sont des candidatures
  status?: ContactStatus; // absent = en attente
  note?: string; // note libre
  followUps?: number; // nombre de relances déjà faites
  followedUpAt?: string | null; // date de la dernière relance
}

export const MAX_SENT = 500;
export const MAX_NOTE = 500;
const STATUSES = new Set<string>(["waiting", "replied", "done"]);

/** Lecture tolérante : des données corrompues donnent un journal vide, et les anciens envois restent lisibles. */
export function readSent(raw: string | null): SentEntry[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const out: SentEntry[] = [];
    for (const e of data) {
      if (typeof e?.to !== "string" || typeof e?.subject !== "string" || typeof e?.sentAt !== "string") continue;
      if (e.company !== null && typeof e.company !== "string") continue;
      out.push({
        to: e.to,
        subject: e.subject,
        company: e.company,
        sentAt: e.sentAt,
        ref: typeof e.ref === "string" ? e.ref : null,
        purpose: e.purpose === "pitch" || e.purpose === "application" ? e.purpose : undefined,
        status: STATUSES.has(e.status) ? e.status : undefined,
        note: typeof e.note === "string" ? e.note.slice(0, MAX_NOTE) : undefined,
        followUps: Number.isInteger(e.followUps) && e.followUps >= 0 && e.followUps <= 10 ? e.followUps : undefined,
        followedUpAt: typeof e.followedUpAt === "string" ? e.followedUpAt : null,
      });
      if (out.length >= MAX_SENT) break;
    }
    return out;
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

/** Dernier envoi rattaché à cette fiche, ou null. */
export const findSendByRef = (list: SentEntry[], ref: string): SentEntry | null =>
  list.find((e) => e.ref === ref) ?? null;

/** Pour chaque fiche contactée, la nature de son envoi le plus récent. */
export function sentPurposeByRef(list: SentEntry[]): Map<string, SentPurpose> {
  const map = new Map<string, SentPurpose>();
  for (const e of list) if (e.ref && !map.has(e.ref)) map.set(e.ref, e.purpose ?? "application");
  return map;
}