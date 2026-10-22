import { clearPacks, deletePack, listPacks, savePack, type PackMeta } from "@/lib/learn/learn-db";
import type { ResourcePack } from "@/lib/learn/schema";

// list === null : pas encore lue depuis IndexedDB
interface State {
  list: PackMeta[] | null;
  error: string | null;
}

const INIT: State = { list: null, error: null };
let state: State = INIT; // remplacé (jamais modifié) à chaque changement
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Erreur inconnue");

export const subscribePacks = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const getPacksSnapshot = () => state;
export const getServerPacksSnapshot = () => INIT;

let loading: Promise<void> | null = null;

/** Lit la liste depuis IndexedDB une seule fois. Un stockage indisponible laisse l'app utilisable. */
export function ensurePacksLoaded(): Promise<void> {
  if (state.list !== null) return Promise.resolve();
  if (!loading) {
    loading = listPacks()
      .then((list) => set({ list, error: null }))
      .catch((e) => set({ list: [], error: errMsg(e) }))
      .finally(() => {
        loading = null;
      });
  }
  return loading;
}

export async function importPack(pack: ResourcePack): Promise<PackMeta> {
  const meta = await savePack(pack);
  set({ list: [meta, ...(state.list ?? [])], error: null });
  return meta;
}

export async function removePack(id: string): Promise<void> {
  await deletePack(id);
  set({ list: (state.list ?? []).filter((m) => m.id !== id), error: null });
}

export async function clearAllPacks(): Promise<void> {
  await clearPacks();
  set({ list: [], error: null });
}