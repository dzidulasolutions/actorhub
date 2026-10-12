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
export const saveActors = (actors: ActorConfig[]) => write(KEYS.actors, actors);

export function addActor(actor: ActorConfig): void {
  saveActors([...loadActors(), actor]);
}