// src/components/searches/save-button.tsx
"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { saveCurrent } from "@/lib/saved-searches-store";
import type { SearchRecord } from "@/types/search";

export function SaveButton({ search }: { search: SearchRecord }) {
  const { saved, ready } = useSavedSearches();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSaved = saved?.some((m) => m.id === search.id) ?? false;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveCurrent(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  }

  if (isSaved) {
    return (
      <span className="inline-flex h-9 items-center gap-2 border border-success/30 bg-success/10 px-3 text-sm font-medium text-success">
        <Check className="size-4" /> Sauvegardée
      </span>
    );
  }

  return (
    <>
      {error && <span role="alert" className="max-w-56 text-xs text-destructive">{error}</span>}
      <Button
        type="button"
        variant="outline"
        onClick={handleSave}
        disabled={saving || !ready}
        className="h-9 gap-2"
      >
        <Save className="size-4" />
        {saving ? "Sauvegarde…" : "Sauvegarder"}
      </Button>
    </>
  );
}