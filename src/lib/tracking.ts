// Suivi des contacts : statuts, relances suggérées, texte de relance. 100 % local, sans IA.
import type { Profile } from "../types/profile";
import { detectOfferLanguage, formatLetterDate, type Language } from "./cover-letter";
import { jobKey } from "./job-notes";
import { normalizeResult } from "./normalize-results";
import type { ContactStatus, SentEntry } from "./sent-log";

export const FOLLOW_UP_AFTER_DAYS = 7;
export const MAX_FOLLOW_UPS = 2; // au-delà, l'app ne suggère plus de relancer
const DAY = 86_400_000;

/** Identifiant d'une entrée du journal (le journal n'a pas d'identifiant propre). */
export const entryKey = (e: SentEntry) => `${e.sentAt}|${e.to.toLowerCase()}`;
export const statusOf = (e: SentEntry): ContactStatus => e.status ?? "waiting";

function time(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/** Date du prochain rappel : 7 jours après le dernier contact (envoi ou relance). */
export function followUpDueAt(e: SentEntry): number | null {
  const sent = time(e.sentAt);
  if (sent === null) return null;
  return Math.max(sent, time(e.followedUpAt) ?? 0) + FOLLOW_UP_AFTER_DAYS * DAY;
}

export function needsFollowUp(e: SentEntry, now: number): boolean {
  if (statusOf(e) !== "waiting" || (e.followUps ?? 0) >= MAX_FOLLOW_UPS) return false;
  const due = followUpDueAt(e);
  return due !== null && now >= due;
}

export function daysSince(iso: string, now: number): number {
  const t = time(iso);
  return t === null ? 0 : Math.max(0, Math.floor((now - t) / DAY));
}

export type TrackingFilter = "all" | "waiting" | "due" | "replied" | "done";

export function summarize(list: SentEntry[], now: number) {
  const count = (s: ContactStatus) => list.filter((e) => statusOf(e) === s).length;
  return {
    total: list.length,
    waiting: count("waiting"),
    replied: count("replied"),
    done: count("done"),
    due: list.filter((e) => needsFollowUp(e, now)).length,
  };
}

export function filterEntries(list: SentEntry[], filter: TrackingFilter, now: number): SentEntry[] {
  if (filter === "all") return list;
  if (filter === "due") return list.filter((e) => needsFollowUp(e, now));
  return list.filter((e) => statusOf(e) === filter);
}

/** Les contacts à relancer d'abord, puis les plus récents. */
export function sortEntries(list: SentEntry[], now: number): SentEntry[] {
  return [...list].sort((a, b) => {
    const da = needsFollowUp(a, now) ? 0 : 1;
    const db = needsFollowUp(b, now) ? 0 : 1;
    return da !== db ? da - db : b.sentAt.localeCompare(a.sentAt);
  });
}

/** Texte court de relance, poli, sans rien affirmer d'autre que ce qui a été envoyé. */
export function generateFollowUp(profile: Profile, e: SentEntry, language: Language): string {
  const fr = language === "fr";
  const pitch = e.purpose === "pitch";
  const company = e.company?.trim() || null;
  const name = profile.fullName.trim();
  const date = formatLetterDate(new Date(e.sentAt), language);
  const last = (e.followUps ?? 0) >= 1; // deuxième relance : on annonce qu'on s'arrête là

  const what = fr
    ? pitch ? `ma proposition de services${company ? ` pour ${company}` : ""}` : `ma candidature${company ? ` chez ${company}` : ""}`
    : pitch ? `my services proposal${company ? ` for ${company}` : ""}` : `my application${company ? ` at ${company}` : ""}`;

  const opener = fr
    ? `Je me permets de revenir vers vous au sujet de ${what}, envoyée le ${date}.`
    : `I am following up on ${what}, sent on ${date}.`;

  const middle = fr
    ? pitch ? "Je reste disponible si vous souhaitez en discuter, et je comprends que vous soyez très sollicités." : "Je reste à votre disposition pour tout complément d'information ou pour un entretien."
    : pitch ? "I remain available if you would like to discuss it, and I understand you are very busy." : "I remain at your disposal for any further information or for an interview.";

  const closing = last
    ? fr
      ? "Ce sera mon dernier message à ce sujet : si ce n'est pas d'actualité, je vous remercie de votre attention et vous souhaite une bonne continuation."
      : "This will be my last message on the subject: if it is not relevant, thank you for your time and I wish you all the best."
    : fr
      ? pitch ? "Si ce n'est pas d'actualité, un simple « non merci » me suffira." : "Si le poste est déjà pourvu, merci de me le faire savoir."
      : pitch ? 'If this is not relevant, a simple "no thanks" will do.' : "If the position has already been filled, please let me know.";

  const signature = `${fr ? "Cordialement," : "Best regards,"}${name ? `\n${name}` : ""}`;
  return [fr ? "Bonjour," : "Hello,", opener, middle, closing, signature].join("\n\n");
}

/** Langue probable d'un objet d'email déjà envoyé (français par défaut). */
export const guessLanguage = (subject: string): Language => detectOfferLanguage(subject);

export interface ResolvedRef {
  runId: string;
  index: number;
}

/** Retrouve, parmi les recherches en mémoire, les fiches auxquelles se rapportent des envois. */
export function resolveRefs(
  searches: { id: string; items: unknown[] | null }[],
  refs: Set<string>
): Map<string, ResolvedRef> {
  const found = new Map<string, ResolvedRef>();
  if (refs.size === 0) return found;
  outer: for (const s of searches) {
    if (!s.items) continue;
    for (let i = 0; i < s.items.length; i++) {
      const key = jobKey(normalizeResult(s.items[i], i));
      if (refs.has(key) && !found.has(key)) {
        found.set(key, { runId: s.id, index: i });
        if (found.size === refs.size) break outer; // tout est trouvé : inutile de continuer
      }
    }
  }
  return found;
}