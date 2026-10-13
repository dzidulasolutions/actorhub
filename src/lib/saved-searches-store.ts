import {
  deleteSavedSearch,
  listSavedSearches,
  loadSavedItems,
  saveSearch,
  type SavedSearchMeta,
} from "@/lib/saved-searches-db";
import { getSearchesSnapshot, hydrateSearch } from "@/lib/searches-store";
import type { SearchRecord } from "@/types/search";

// list === null : pas encore lue depuis IndexedDB
export interface SavedState {
  list: SavedSearchMeta[] | null;
  error: string | null;
}

const INIT: SavedState = { list: null, error: null };
let state: SavedState = INIT; // remplacé (jamais modifié) à chaque changement
const listeners = new Set<() => void>();

const set = (next: SavedState) => {
  state = next;
  listeners.forEach((l) => l());
};
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Erreur inconnue");

export const subscribeSaved = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const getSavedSnapshot = () => state;
export const getServerSavedSnapshot = () => INIT;

let loading: Promise<void> | null = null;

/** Lit la liste depuis IndexedDB une seule fois. */
export function ensureSavedLoaded(): Promise<void> {
  if (state.list !== null) return Promise.resolve();
  if (!loading) {
    loading = listSavedSearches()
      .then((list) => set({ list, error: null }))
      .catch((e) => set({ list: [], error: errMsg(e) })) // stockage indisponible : l'app reste utilisable
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

export async function saveCurrent(search: SearchRecord): Promise<void> {
  const meta = await saveSearch(search);
  set({ list: [meta, ...(state.list ?? []).filter((m) => m.id !== meta.id)], error: null });
}

export async function removeSaved(id: string): Promise<void> {
  await deleteSavedSearch(id);
  set({ list: (state.list ?? []).filter((m) => m.id !== id), error: null });
}

/** Recharge une sauvegarde en mémoire pour l'ouvrir dans la page de suivi, sans appeler Apify. */
export async function openSaved(id: string): Promise<void> {
  if (getSearchesSnapshot().some((s) => s.id === id)) return; // déjà en mémoire
  const meta = state.list?.find((m) => m.id === id);
  const items = await loadSavedItems(id);
  if (!meta || !items) throw new Error("Cette sauvegarde est introuvable");
  hydrateSearch({
    id: meta.id,
    actorName: meta.actorName,
    apifyId: meta.apifyId,
    input: meta.input,
    maxItems: meta.maxItems,
    status: meta.status,
    datasetId: meta.datasetId,
    startedAt: meta.startedAt,
    finishedAt: meta.finishedAt,
    usageUsd: meta.usageUsd,
    items,
    total: meta.total,
    error: null,
  });
}