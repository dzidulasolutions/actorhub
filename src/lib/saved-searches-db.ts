// Sauvegarde locale (IndexedDB) : uniquement dans le navigateur, jamais envoyée à un serveur.
import type { SearchRecord } from "@/types/search";

const DB_NAME = "actorhub";
const DB_VERSION = 1;
const META = "searches"; // un petit enregistrement par recherche : sert à afficher la liste
const ITEMS = "items"; // les résultats volumineux, à part : chargés seulement à l'ouverture

// En-tête d'une recherche sauvegardée (tout sauf les résultats et l'erreur)
export type SavedSearchMeta = Omit<SearchRecord, "items" | "error"> & {
  count: number; // nombre de résultats sauvegardés
  savedAt: string; // ISO 8601
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("La sauvegarde n'est pas disponible dans ce navigateur"));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
        if (!db.objectStoreNames.contains(ITEMS)) db.createObjectStore(ITEMS); // clé = id de la recherche
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null; // permet un nouvel essai
        reject(new Error("Impossible d'ouvrir la sauvegarde du navigateur"));
      };
    });
  }
  return dbPromise;
}

const asPromise = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Erreur de lecture"));
  });

// Une transaction est validée seulement quand elle est COMPLÈTE (tout ou rien)
const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Erreur de sauvegarde"));
    tx.onabort = () => reject(tx.error ?? new Error("Sauvegarde annulée (espace insuffisant ?)"));
  });

export async function saveSearch(s: SearchRecord): Promise<SavedSearchMeta> {
  if (!s.items) throw new Error("Aucun résultat à sauvegarder");
  const meta: SavedSearchMeta = {
    id: s.id,
    actorName: s.actorName,
    apifyId: s.apifyId,
    input: s.input,
    maxItems: s.maxItems,
    status: s.status,
    datasetId: s.datasetId,
    startedAt: s.startedAt,
    finishedAt: s.finishedAt,
    usageUsd: s.usageUsd,
    total: s.total,
    count: s.items.length,
    savedAt: new Date().toISOString(),
  };
  const db = await openDb();
  const tx = db.transaction([META, ITEMS], "readwrite");
  tx.objectStore(META).put(meta);
  tx.objectStore(ITEMS).put(s.items, s.id);
  await done(tx);
  return meta;
}

export async function listSavedSearches(): Promise<SavedSearchMeta[]> {
  const db = await openDb();
  const all = (await asPromise(
    db.transaction(META, "readonly").objectStore(META).getAll()
  )) as SavedSearchMeta[];
  return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt)); // la plus récente en premier
}

export async function loadSavedItems(id: string): Promise<unknown[] | undefined> {
  const db = await openDb();
  return (await asPromise(db.transaction(ITEMS, "readonly").objectStore(ITEMS).get(id))) as
    | unknown[]
    | undefined;
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META, ITEMS], "readwrite");
  tx.objectStore(META).delete(id);
  tx.objectStore(ITEMS).delete(id);
  await done(tx);
}

// Efface toutes les sauvegardes d'un coup (en-têtes et résultats), tout ou rien
export async function clearSavedSearches(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META, ITEMS], "readwrite");
  tx.objectStore(META).clear();
  tx.objectStore(ITEMS).clear();
  await done(tx);
}