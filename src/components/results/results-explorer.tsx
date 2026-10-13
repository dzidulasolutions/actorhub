"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconlySearch } from "@/components/icons/iconly";
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
import { ResultCard } from "./result-card";

const PAGE_SIZE = 12;

const FILTER_LABELS: Record<keyof Filters, string> = {
  withEmail: "Avec email",
  withPhone: "Avec téléphone",
  withWebsite: "Avec site web",
  withSocial: "Avec réseau social",
};

export function ResultsExplorer({ items, total }: { items: unknown[]; total: number | null }) {
  // Normalisation calculée une seule fois par jeu de résultats
  const results = useMemo(() => normalizeResults(items), [items]);
  const counts = useMemo(() => countFilters(results), [results]);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>("default");
  const [page, setPage] = useState(1);
  // Sélection par numéro d'élément : elle survit aux changements de filtre, de tri et de page
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const filtered = useMemo(
    () => exploreResults(results, query, filters, sort),
    [results, query, filters, sort]
  );
  const view = paginate(filtered, page, PAGE_SIZE);

  const pageAllSelected = view.items.length > 0 && view.items.every((r) => selected.has(r.index));
  const hasActiveFilter = query.trim() !== "" || Object.values(filters).some(Boolean);

  const toggleOne = (index: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      view.items.forEach((r) => (pageAllSelected ? next.delete(r.index) : next.add(r.index)));
      return next;
    });

  const selectAllFiltered = () => setSelected((prev) => new Set([...prev, ...filtered.map((r) => r.index)]));

  const resetFilters = () => {
    setQuery("");
    setFilters(NO_FILTERS);
    setPage(1);
  };

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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher dans les résultats…"
            aria-label="Rechercher dans les résultats"
            className="h-10 pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
            setPage(1);
          }}
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
            onClick={() => {
              setFilters((f) => ({ ...f, [key]: !f[key] }));
              setPage(1);
            }}
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
            <button type="button" onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground">
              Tout désélectionner
            </button>
          )}
        </div>
      </div>

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
            <ResultCard key={r.index} result={r} selected={selected.has(r.index)} onToggle={() => toggleOne(r.index)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {view.pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="icon" disabled={view.page <= 1} onClick={() => setPage(view.page - 1)} aria-label="Page précédente">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {view.page} / {view.pageCount}</span>
          <Button variant="outline" size="icon" disabled={view.page >= view.pageCount} onClick={() => setPage(view.page + 1)} aria-label="Page suivante">
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}