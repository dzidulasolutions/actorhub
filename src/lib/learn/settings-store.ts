import { readSettings } from "@/lib/learn/pack-utils";
import type { LearnSettings } from "@/lib/learn/schema";

const KEY = "actorhub:learn-settings";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function subscribeSettings(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // modification faite dans un autre onglet
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// Même référence tant que les données n'ont pas changé (exigé par useSyncExternalStore)
let cache: { raw: string | null; value: LearnSettings | null } | null = null;

export function getSettingsSnapshot(): LearnSettings | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* stockage indisponible */
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: readSettings(raw) };
  return cache.value;
}

export const getServerSettingsSnapshot = (): LearnSettings | null => null;

/** Renvoie false si le navigateur refuse d'écrire. */
export function saveLearnSettings(s: LearnSettings): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    return false;
  }
  notify();
  return true;
}

export function clearLearnSettings(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* rien à effacer */
  }
  notify();
}