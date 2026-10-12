import { abortRun, getDatasetItems, getRun, startRun } from "@/lib/api-client";
import { isFinal, type RunInfo } from "@/lib/run-status";
import type { ActorConfig } from "@/types/actor";
import type { SearchRecord } from "@/types/search";

// ---------- Store minimal compatible useSyncExternalStore ----------
const EMPTY: SearchRecord[] = [];
let searches: SearchRecord[] = EMPTY; // remplacé (jamais modifié) à chaque changement
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeSearches = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const getSearchesSnapshot = () => searches;
export const getServerSearchesSnapshot = () => EMPTY;

function patch(id: string, changes: Partial<SearchRecord>) {
  searches = searches.map((s) => (s.id === id ? { ...s, ...changes } : s));
  emit();
}

const fromRun = (r: RunInfo) => ({
  status: r.status,
  datasetId: r.datasetId,
  startedAt: r.startedAt,
  finishedAt: r.finishedAt,
  usageUsd: r.usageUsd,
});

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Erreur inconnue");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Actions ----------

/** Lance un run, l'ajoute à la session et démarre son suivi. Renvoie l'id du run. */
export async function startSearch(
  actor: ActorConfig,
  input: Record<string, unknown>,
  maxItems: number | null
): Promise<string> {
  const run = await startRun(actor.apifyId, input, maxItems ?? undefined); // lève une erreur si refusé
  searches = [
    {
      id: run.id,
      actorName: actor.name,
      apifyId: actor.apifyId,
      input,
      maxItems,
      ...fromRun(run),
      items: null,
      total: null,
      error: null,
    },
    ...searches,
  ];
  emit();
  void poll(run.id); // suivi en arrière-plan
  return run.id;
}

/** Demande l'arrêt ; le suivi en cours verra le statut "aborted" au prochain passage. */
export async function abortSearch(id: string): Promise<void> {
  patch(id, fromRun(await abortRun(id)));
}

/** Récupère les résultats du dataset (réutilisable pour "Réessayer"). */
export async function loadResults(id: string): Promise<void> {
  const s = searches.find((x) => x.id === id);
  if (!s?.datasetId) return patch(id, { items: [], total: 0 });
  try {
    // Limite : 1000 résultats par chargement (pagination complète à l'étape suivante)
    const r = await getDatasetItems(s.datasetId);
    patch(id, { items: r.items, total: r.total, error: null });
  } catch (e) {
    patch(id, { error: `Résultats non récupérés : ${errMsg(e)}` });
  }
}

// ---------- Suivi automatique ----------
const POLL_MIN_MS = 2_000;
const POLL_MAX_MS = 5_000;
const POLL_TIMEOUT_MS = 15 * 60_000; // on ne boucle jamais indéfiniment
const MAX_CONSECUTIVE_ERRORS = 5;

async function poll(id: string) {
  const t0 = Date.now();
  let delay = POLL_MIN_MS;
  let errors = 0;

  while (Date.now() - t0 < POLL_TIMEOUT_MS) {
    await sleep(delay);
    try {
      const run = await getRun(id);
      errors = 0;
      patch(id, fromRun(run));
      if (isFinal(run.status)) {
        await loadResults(id); // aussi pour "aborted" : les résultats partiels sont utiles
        return;
      }
    } catch (e) {
      // Erreurs réseau ou limitation de débit : on réessaie quelques fois avant d'abandonner
      if (++errors >= MAX_CONSECUTIVE_ERRORS) return patch(id, { error: errMsg(e) });
    }
    delay = Math.min(Math.round(delay * 1.25), POLL_MAX_MS); // espace progressivement les appels
  }
  patch(id, {
    error: "Suivi interrompu après 15 minutes. La collecte peut continuer sur Apify.",
  });
}