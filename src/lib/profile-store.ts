import { readProfile } from "@/lib/profile-schema";
import { EMPTY_PROFILE, type Profile } from "@/types/profile";

const KEY = "actorhub:profile";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function subscribeProfile(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // modification faite dans un autre onglet
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// Cache : getSnapshot doit renvoyer la même référence tant que les données n'ont pas changé
let cache: { raw: string | null; value: Profile } | null = null;

export function getProfileSnapshot(): Profile {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* stockage indisponible */
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: readProfile(raw) };
  return cache.value;
}

export const getServerProfileSnapshot = (): Profile => EMPTY_PROFILE;

/** Renvoie false si le navigateur refuse d'écrire (stockage plein ou désactivé). */
export function saveProfile(profile: Profile): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    return false;
  }
  notify();
  return true;
}

export function clearProfile(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* rien à effacer */
  }
  notify();
}