"use client";

import { useSyncExternalStore } from "react";
import {
  getSearchesSnapshot,
  getServerSearchesSnapshot,
  subscribeSearches,
} from "@/lib/searches-store";

export function useSearches() {
  return useSyncExternalStore(subscribeSearches, getSearchesSnapshot, getServerSearchesSnapshot);
}

export function useSearch(id: string) {
  return useSearches().find((s) => s.id === id) ?? null;
}