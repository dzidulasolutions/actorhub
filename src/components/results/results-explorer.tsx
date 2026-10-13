// src/components/results/results-explorer.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconlySearch, IconlyDownload } from "@/components/icons/iconly";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeResults } from "@/lib/normalize-results";
import {
  countFilters,
  exploreResults,
  NO_FILTERS,
  paginate,
  SORT_LABELS,
  type Filters,
  type SortKey,
} from "@/lib/explore-results";
import { useExplorerState } from "@/hooks/use-explorer-state";
import { ResultCard } from "./result-card";
import { ExportPanel } from "./export-panel";
import type { ExportMeta } from "@/lib/export-json";



const PAGE_SIZE = 12;

const FILTER_LABELS: Record<keyof Filters, string> = {
  withEmail: "Avec email",
  withPhone: "Avec téléphone",
  withWebsite: "Avec site web",
  withSocial: "Avec réseau social",
};

export function ResultsExplorer({
  runId, items, total, meta,
}: {
  runId: string;
  items: unknown[];
  total: number | null;
  meta: ExportMeta;
}) {
  // Normalisation calculée une seule fois par jeu de résultats
  const results = useMemo(() => normalizeResults(items), [items]);
  const counts = useMemo(() => countFilters(results), [results]);

  // Recherche, filtres, tri, page et sélection : dans le store (survivent à la navigation)
  const [ui, setUi] = useExplorerState(runId);
  const { query, filters, sort, page, selected } = ui;
  const [exportOpen, setExportOpen] = useState(false);
  const filtered = useMemo(
    () => exploreResults(results, query, filters, sort),
    [results, query, filters, sort]
  );
  const view = paginate(filtered, page, PAGE_SIZE);

  const pageAllSelected = view.items.length > 0 && view.items.every((r) => selected.has(r.index));
  const hasActiveFilter = query.trim() !== "" || Object.values(filters).some(Boolean);

  const toggleOne = (index: number) =>
    setUi((s) => {
      const next = new Set(s.selected);
      if (!next.delete(index)) next.add(index);
      return { selected: next };
    });

  const togglePage = () =>
    setUi((s) => {
      const next = new Set(s.selected);
      view.items.forEach((r) => (pageAllSelected ? next.delete(r.index) : next.add(r.index)));
      return { selected: next };
    });

  const selectAllFiltered = () =>
    setUi((s) => ({ selected: new Set([...s.selected, ...filtered.map((r) => r.index)]) }));

  const resetFilters = () => setUi({ query: "", filters: NO_FILTERS, page: 1 });

  return (
    <div className="space-y-4">
      {/* Recherche + tri */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <IconlySearch size={18} color="currentColor" />
          </span>
          <Input
            value={query}
            onChange={(e) => setUi({ query: e.target.value, page: 1 })}
            placeholder="Rechercher dans les résultats…"
            aria-label="Rechercher dans les résultats"
            className="h-10 pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setUi({ sort: e.target.value as SortKey, page: 1 })}
          aria-label="Trier les résultats"
          className="h-10 border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>{SORT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* Filtres avec compteurs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as (keyof Filters)[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filters[key]}
            onClick={() => setUi((s) => ({ filters: { ...s.filters, [key]: !s.filters[key] }, page: 1 }))}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              filters[key] ? "border-primary bg-accent font-medium text-primary" : "border-border hover:bg-muted"
            )}
          >
            {FILTER_LABELS[key]} <span className="text-muted-foreground">({counts[key]})</span>
          </button>
        ))}
        {hasActiveFilter && (
          <button type="button" onClick={resetFilters} className="px-2 text-sm text-muted-foreground hover:text-foreground">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Compteur + sélection */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">

          <Button
            type="button"
            variant={exportOpen ? "outline" : "default"}
            onClick={() => setExportOpen((o) => !o)}
            aria-expanded={exportOpen}
            className="h-9 gap-2 px-4"
          >
            {exportOpen ? (
              <>
                <X className="size-4" /> Fermer l&apos;export
              </>
            ) : (
              <>
                <IconlyDownload size={18} color="currentColor" />
                {selected.size > 0 ? `Exporter (${selected.size})` : "Exporter"}
              </>
            )}
          </Button>

        <p className="text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          {filtered.length !== results.length && ` sur ${results.length}`}
          {total !== null && total > results.length && ` · ${results.length} chargés sur ${total} dans le dataset`}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {selected.size > 0 && (
            <span className="font-medium text-primary">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
          )}
          {view.items.length > 0 && (
            <button type="button" onClick={togglePage} className="hover:underline">
              {pageAllSelected ? "Désélectionner la page" : "Sélectionner la page"}
            </button>
          )}
          {filtered.length > view.items.length && (
            <button type="button" onClick={selectAllFiltered} className="hover:underline">
              Tout sélectionner ({filtered.length})
            </button>
          )}
          {selected.size > 0 && (
            <button type="button" onClick={() => setUi({ selected: new Set() })} className="text-muted-foreground hover:text-foreground">
              Tout désélectionner
            </button>
          )}
        </div>
      </div>
        {exportOpen && (
        <ExportPanel
          items={items}
          filteredIndexes={filtered.map((r) => r.index)}
          selected={selected}
          meta={meta}
        />
      )}

      {/* Grille */}
      {view.items.length === 0 ? (
        <div className="grid place-items-center gap-3 border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">Aucun résultat ne correspond</p>
          <p className="text-sm text-muted-foreground">Modifie ta recherche ou tes filtres.</p>
          <Button variant="outline" onClick={resetFilters} className="h-9">Réinitialiser</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {view.items.map((r) => (
            <ResultCard
              key={r.index}
              result={r}
              href={`/searches/${runId}/results/${r.index}`}
              selected={selected.has(r.index)}
              onToggle={() => toggleOne(r.index)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {view.pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="icon" disabled={view.page <= 1} onClick={() => setUi({ page: view.page - 1 })} aria-label="Page précédente">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {view.page} / {view.pageCount}</span>
          <Button variant="outline" size="icon" disabled={view.page >= view.pageCount} onClick={() => setUi({ page: view.page + 1 })} aria-label="Page suivante">
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}