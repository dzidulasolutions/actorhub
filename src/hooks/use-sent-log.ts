"use client";

import { useSyncExternalStore } from "react";
import { addSentEntry, readSent, type SentEntry } from "@/lib/sent-log";

const KEY = "actorhub:sent-log";
const EMPTY: SentEntry[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// Même référence tant que les données n'ont pas changé (exigé par useSyncExternalStore)
let cache: { raw: string | null; value: SentEntry[] } | null = null;

function getSnapshot(): SentEntry[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    /* stockage indisponible */
  }
  if (cache && cache.raw === raw) return cache.value;
  cache = { raw, value: raw ? readSent(raw) : EMPTY };
  return cache.value;
}

/** Note un envoi dans le journal. Un stockage indisponible ne doit jamais faire échouer l'envoi déjà parti. */
export function recordSent(entry: SentEntry): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(addSentEntry(getSnapshot(), entry)));
  } catch {
    return;
  }
  notify();
}

export function clearSentLog(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* rien à effacer */
  }
  notify();
}

export function useSentLog(): SentEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}