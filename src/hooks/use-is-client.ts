"use client";

import { useSyncExternalStore } from "react";

// false pendant le rendu serveur/hydratation, true ensuite → permet d'afficher les skeletons
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}