"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureSavedLoaded,
  getSavedSnapshot,
  getServerSavedSnapshot,
  subscribeSaved,
} from "@/lib/saved-searches-store";

export function useSavedSearches() {
  const state = useSyncExternalStore(subscribeSaved, getSavedSnapshot, getServerSavedSnapshot);
  // Déclenche la lecture d'IndexedDB (une seule fois pour toute l'app)
  useEffect(() => {
    void ensureSavedLoaded();
  }, []);
  return { saved: state.list, error: state.error, ready: state.list !== null };
}