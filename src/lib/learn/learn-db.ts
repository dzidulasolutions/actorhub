// Stockage des packs (IndexedDB) : jamais envoyé à un serveur. Les en-têtes sont séparés du contenu
// pour afficher la liste sans charger les transcriptions.
import { packStats, type PackStats } from "@/lib/learn/pack-utils";
import type { ResourcePack } from "@/lib/learn/schema";

const DB_NAME = "actorhub-learn";
const DB_VERSION = 1;
const META = "packMeta";
const DATA = "packData";

export interface PackMeta {
  id: string;
  name: string;
  language: string;
  importedAt: string; // ISO 8601
  stats: PackStats;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Le stockage n'est pas disponible dans ce navigateur"));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
        if (!db.objectStoreNames.contains(DATA)) db.createObjectStore(DATA);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(new Error("Impossible d'ouvrir le stockage du navigateur"));
      };
    });
  }
  return dbPromise;
}

const asPromise = <T,>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Erreur de lecture"));
  });

// Une transaction n'est validée que complète (tout ou rien)
const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Erreur d'enregistrement"));
    tx.onabort = () => reject(tx.error ?? new Error("Enregistrement annulé (espace insuffisant ?)"));
  });

export async function savePack(pack: ResourcePack): Promise<PackMeta> {
  const meta: PackMeta = {
    id: `pack-${crypto.randomUUID().slice(0, 8)}`,
    name: pack.name,
    language: pack.language,
    importedAt: new Date().toISOString(),
    stats: packStats(pack),
  };
  const db = await openDb();
  const tx = db.transaction([META, DATA], "readwrite");
  tx.objectStore(META).put(meta);
  tx.objectStore(DATA).put(pack, meta.id);
  await done(tx);
  return meta;
}

export async function listPacks(): Promise<PackMeta[]> {
  const db = await openDb();
  const all = (await asPromise(db.transaction(META, "readonly").objectStore(META).getAll())) as PackMeta[];
  return all.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function loadPack(id: string): Promise<ResourcePack | undefined> {
  const db = await openDb();
  return (await asPromise(db.transaction(DATA, "readonly").objectStore(DATA).get(id))) as ResourcePack | undefined;
}

export async function deletePack(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META, DATA], "readwrite");
  tx.objectStore(META).delete(id);
  tx.objectStore(DATA).delete(id);
  await done(tx);
}

export async function clearPacks(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META, DATA], "readwrite");
  tx.objectStore(META).clear();
  tx.objectStore(DATA).clear();
  await done(tx);
}