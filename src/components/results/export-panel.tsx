"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconlyDownload } from "@/components/icons/iconly";
import { cn } from "@/lib/utils";
import {
  buildExport,
  downloadJson,
  exportFilename,
  type ExportMeta,
  type ExportMode,
  type ExportScope,
} from "@/lib/export-json";

// Petit groupe de choix carrés (le composant radio de shadcn est arrondi)
function Choice<T extends string>({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string; disabled?: boolean }[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={o.disabled}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              value === o.value ? "border-primary bg-accent" : "border-border hover:bg-muted"
            )}
          >
            <span className={cn("block font-medium", value === o.value && "text-primary")}>{o.label}</span>
            {o.hint && <span className="mt-0.5 block text-xs text-muted-foreground">{o.hint}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ExportPanel({
  items,
  filteredIndexes,
  selected,
  meta,
}: {
  items: unknown[]; // objets ORIGINAUX d'Apify
  filteredIndexes: number[]; // numéros des éléments visibles avec les filtres actuels
  selected: Set<number>;
  meta: ExportMeta;
}) {
  const [scope, setScope] = useState<ExportScope>("all");
  const [mode, setMode] = useState<ExportMode>("original");

  const indexes: Record<ExportScope, number[]> = {
    all: items.map((_, i) => i),
    selected: [...selected].filter((i) => i < items.length).sort((a, b) => a - b),
    filtered: filteredIndexes,
  };
  const count = indexes[scope].length;

  function handleDownload() {
    // On exporte items[i] et non la fiche normalisée : les champs d'origine sont conservés
    const picked = indexes[scope].map((i) => items[i]);
    downloadJson(buildExport(picked, mode, meta), exportFilename(meta.actorName, scope, mode, count));
  }

  return (
    <section className="space-y-5 border border-border bg-card p-4 sm:p-5">
      <Choice<ExportScope>
        legend="Quoi exporter ?"
        value={scope}
        onChange={setScope}
        options={[
          { value: "all", label: `Tous (${indexes.all.length})`, hint: "Toute la collecte" },
          { value: "selected", label: `Sélection (${indexes.selected.length})`, hint: "Cartes cochées", disabled: indexes.selected.length === 0 },
          { value: "filtered", label: `Filtrés (${indexes.filtered.length})`, hint: "Résultats actuellement affichés", disabled: indexes.filtered.length === 0 },
        ]}
      />
      <Choice<ExportMode>
        legend="Quel format ?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "original", label: "Données originales", hint: "Tableau d'objets tel que reçu d'Apify" },
          { value: "wrapped", label: "Avec métadonnées", hint: "Actor, date, paramètres, nombre + résultats" },
        ]}
      />
      <Button type="button" onClick={handleDownload} disabled={count === 0} className="h-10 gap-2">
        <IconlyDownload size={18} color="currentColor" />
        Télécharger {count} résultat{count > 1 ? "s" : ""}
      </Button>
    </section>
  );
}