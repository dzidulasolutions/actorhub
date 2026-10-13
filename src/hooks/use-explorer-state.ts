"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getExplorerState,
  getServerExplorerState,
  subscribeExplorer,
  updateExplorer,
  type ExplorerPatch,
} from "@/lib/explorer-state";

export function useExplorerState(runId: string) {
  const state = useSyncExternalStore(
    subscribeExplorer,
    () => getExplorerState(runId),
    getServerExplorerState
  );
  const update = useCallback((patch: ExplorerPatch) => updateExplorer(runId, patch), [runId]);
  return [state, update] as const;
}