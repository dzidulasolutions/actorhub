"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import {
  ensurePacksLoaded, getPacksSnapshot, getServerPacksSnapshot, subscribePacks,
} from "@/lib/learn/learn-store";
import {
  getServerSettingsSnapshot, getSettingsSnapshot, subscribeSettings,
} from "@/lib/learn/settings-store";

export function useLearnPacks() {
  const state = useSyncExternalStore(subscribePacks, getPacksSnapshot, getServerPacksSnapshot);
  useEffect(() => {
    void ensurePacksLoaded(); // lecture d'IndexedDB, une seule fois pour toute l'app
  }, []);
  return { packs: state.list, error: state.error, ready: state.list !== null };
}

export function useLearnSettings() {
  const settings = useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getServerSettingsSnapshot);
  const ready = useIsClient(); // false pendant le rendu serveur : on affiche alors le skeleton
  return { settings, ready };
}