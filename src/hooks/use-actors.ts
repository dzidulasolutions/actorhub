// src/hooks/use-actors.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { loadActors, saveActors } from "@/lib/local-storage";
import type { ActorConfig } from "@/types/actor";

// Ce que le formulaire fournit ; le reste (id, date, état) est géré ici
export type ActorDraft = Pick<
  ActorConfig,
  "name" | "apifyId" | "category" | "description" | "input"
>;

export function useActors() {
  const [actors, setActors] = useState<ActorConfig[]>([]);
  // ready = false tant que localStorage n'est pas lu (il n'existe pas côté serveur).
  // C'est ce qui déclenche l'affichage des skeletons.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setActors(loadActors());
    setReady(true);
  }, []);

  // Met à jour l'état ET le stockage en une seule opération
  const commit = useCallback((next: ActorConfig[]) => {
    setActors(next);
    saveActors(next);
  }, []);

  const add = (draft: ActorDraft) =>
    commit([
      ...actors,
      {
        ...draft,
        id: crypto.randomUUID(),
        enabled: true,
        createdAt: new Date().toISOString(),
      },
    ]);

  const update = (id: string, draft: ActorDraft) =>
    commit(actors.map((a) => (a.id === id ? { ...a, ...draft } : a)));

  const toggle = (id: string) =>
    commit(actors.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  const remove = (id: string) => commit(actors.filter((a) => a.id !== id));

  return { actors, ready, add, update, toggle, remove };
}