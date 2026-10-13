"use client";

import { useSyncExternalStore } from "react";

// Horloge partagée : `tick` n'est mise à jour qu'APRÈS l'affichage (abonnement + intervalle),
// jamais pendant le rendu serveur, ce qui satisfait la règle de prérendu de Next.
let tick = 0;

function subscribeActive(callback: () => void) {
  tick = Date.now();
  const timer = setInterval(() => {
    tick = Date.now();
    callback();
  }, 1000);
  return () => clearInterval(timer);
}

const subscribeIdle = () => () => {};
const getSnapshot = () => tick;
const getServerSnapshot = () => 0;

// Avance chaque seconde tant que `active` est vrai (durée d'un run en cours)
export function useNow(active: boolean) {
  return useSyncExternalStore(active ? subscribeActive : subscribeIdle, getSnapshot, getServerSnapshot);
}