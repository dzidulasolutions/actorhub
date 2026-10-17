import { MAX_NOTE_CHARS, pruneNotes, readNotes, type JobNotes } from "@/lib/job-notes";

const KEY = "actorhub:job-notes";
const EMPTY: JobNotes = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function subscribeNotes(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // modification faite dans un autre onglet
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// Cache : la même référence tant que les données n'ont pas changé (exigé par useSyncExternalStore)
let cache: { raw: string | null; value: JobNotes } | null = null;

export function getNotesSnapshot(): JobNotes {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* stockage indisponible */
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: raw ? readNotes(raw) : EMPTY };
  return cache.value;
}

export const getServerNotesSnapshot = (): JobNotes => EMPTY;

function write(notes: JobNotes): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(notes));
  } catch {
    return false; // stockage plein ou désactivé
  }
  notify();
  return true;
}

export function saveNote(key: string, text: string): boolean {
  const notes = { ...getNotesSnapshot() };
  notes[key] = { text: text.slice(0, MAX_NOTE_CHARS), updatedAt: new Date().toISOString() };
  return write(pruneNotes(notes));
}

export function deleteNote(key: string): boolean {
  const notes = { ...getNotesSnapshot() };
  delete notes[key];
  return write(notes);
}

export function clearNotes(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* rien à effacer */
  }
  notify();
}