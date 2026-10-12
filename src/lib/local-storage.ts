import type { ActorConfig } from "@/types/actor";

const KEYS = {
  onboarded: "actorhub:onboarded",
  actors: "actorhub:actors",
} as const;

// Lecture/écriture protégées : SSR, navigation privée ou quota plein ne font pas planter l'app
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on ignore, l'app reste utilisable */
  }
}

export const isOnboarded = () => read<boolean>(KEYS.onboarded, false);
export const setOnboarded = () => write(KEYS.onboarded, true);

export const loadActors = () => read<ActorConfig[]>(KEYS.actors, []);
// ---------- Store des Actors (pour useSyncExternalStore) ----------
const EMPTY_ACTORS: ActorConfig[] = [];
const listeners = new Set<() => void>();

// Écrit dans le stockage PUIS prévient les composants abonnés
export function saveActors(actors: ActorConfig[]): void {
  write(KEYS.actors, actors);
  listeners.forEach((l) => l());
}

// React appelle ceci pour être notifié des changements
export function subscribeActors(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback); // modifications faites dans un autre onglet
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Cache : getSnapshot DOIT renvoyer la même référence tant que les données n'ont pas changé,
// sinon React croit que tout change à chaque rendu et boucle à l'infini.
let cache: { raw: string | null; value: ActorConfig[] } | null = null;

export function getActorsSnapshot(): ActorConfig[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEYS.actors);
  } catch {
    /* stockage indisponible */
  }
  if (cache && cache.raw === raw) return cache.value;

  let value = EMPTY_ACTORS;
  try {
    value = raw ? (JSON.parse(raw) as ActorConfig[]) : EMPTY_ACTORS;
  } catch {
    /* JSON corrompu : on repart d'une liste vide */
  }
  cache = { raw, value };
  return value;
}

// Valeur utilisée côté serveur (localStorage n'y existe pas)
export const getServerActorsSnapshot = (): ActorConfig[] => EMPTY_ACTORS;

export function addActor(actor: ActorConfig): void {
  saveActors([...loadActors(), actor]);
}