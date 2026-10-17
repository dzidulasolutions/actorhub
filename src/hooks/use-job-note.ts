"use client";

import { useSyncExternalStore } from "react";
import { getNotesSnapshot, getServerNotesSnapshot, subscribeNotes } from "@/lib/job-notes-store";

export function useJobNotes() {
  return useSyncExternalStore(subscribeNotes, getNotesSnapshot, getServerNotesSnapshot);
}

export function useJobNote(key: string) {
  return useJobNotes()[key] ?? null;
}