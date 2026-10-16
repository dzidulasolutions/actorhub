"use client";

import { useSyncExternalStore } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { getProfileSnapshot, getServerProfileSnapshot, subscribeProfile } from "@/lib/profile-store";

export function useProfile() {
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getServerProfileSnapshot);
  const ready = useIsClient(); // false pendant le rendu serveur : on affiche alors le skeleton
  return { profile, ready };
}