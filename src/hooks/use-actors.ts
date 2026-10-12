// src/hooks/use-actors.ts
"use client";

import { useSyncExternalStore } from "react";
import {
  getActorsSnapshot,
  getServerActorsSnapshot,
  saveActors,
  subscribeActors,
} from "@/lib/local-storage";
import type { ActorConfig } from "@/types/actor";

// Ce que le formulaire fournit ; le reste (id, date, état) est géré ici
export type ActorDraft = Pick<
  ActorConfig,
  "name" | "apifyId" | "category" | "description" | "input"
>;

// Abonnement vide : sert uniquement à distinguer serveur (false) et navigateur (true)
const noopSubscribe = () => () => {};

export function useActors() {
  // Les Actors viennent directement du stockage : plus de useState ni de useEffect
  const actors = useSyncExternalStore(
    subscribeActors,
    getActorsSnapshot,
    getServerActorsSnapshot
  );

  // ready = false pendant le rendu serveur et l'hydratation → affiche les skeletons
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  // saveActors écrit puis notifie : le composant se met à jour tout seul
  const add = (draft: ActorDraft) =>
    saveActors([
      ...actors,
      {
        ...draft,
        id: crypto.randomUUID(),
        enabled: true,
        createdAt: new Date().toISOString(),
      },
    ]);

  const update = (id: string, draft: ActorDraft) =>
    saveActors(actors.map((a) => (a.id === id ? { ...a, ...draft } : a)));

  const toggle = (id: string) =>
    saveActors(actors.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  const remove = (id: string) => saveActors(actors.filter((a) => a.id !== id));

  return { actors, ready, add, update, toggle, remove };
}