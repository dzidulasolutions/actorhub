import { NO_FILTERS, type Filters, type SortKey } from "@/lib/explore-results";

// État de la grille de résultats, conservé PAR RUN, hors des composants :
// il survit à l'aller-retour vers la page de détail (en mémoire, perdu au rechargement).
export interface ExplorerState {
  query: string;
  filters: Filters;
  sort: SortKey;
  page: number;
  selected: Set<number>; // numéros d'éléments sélectionnés
}

export type ExplorerPatch =
  | Partial<ExplorerState>
  | ((current: ExplorerState) => Partial<ExplorerState>);

const DEFAULT: ExplorerState = {
  query: "",
  filters: NO_FILTERS,
  sort: "default",
  page: 1,
  selected: new Set(),
};

let states: Record<string, ExplorerState> = {}; // remplacé (jamais modifié) à chaque changement
const listeners = new Set<() => void>();

export const subscribeExplorer = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const getExplorerState = (runId: string) => states[runId] ?? DEFAULT;
export const getServerExplorerState = () => DEFAULT;

export function updateExplorer(runId: string, patch: ExplorerPatch) {
  const current = getExplorerState(runId);
  const change = typeof patch === "function" ? patch(current) : patch;
  states = { ...states, [runId]: { ...current, ...change } };
  listeners.forEach((l) => l());
}