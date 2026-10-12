"use client";

import { useEffect, useState } from "react";

// Horloge qui avance chaque seconde tant que `active` est vrai (durée d'un run en cours)
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}