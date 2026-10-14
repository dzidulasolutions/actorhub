"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { IconlyDocument } from "@/components/icons/iconly";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { useSearches } from "@/hooks/use-searches";
import { metaFromSearch } from "@/lib/export-json";
import { openSaved } from "@/lib/saved-searches-store";
import { cn } from "@/lib/utils";
import { ResultsExplorer } from "./results-explorer";
import { ResultsGridSkeleton } from "./results-grid-skeleton";
import { ResultsPageSkeleton } from "./results-page-skeleton";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
const countLabel = (n: number) => `${n} résultat${n > 1 ? "s" : ""}`;

interface Option {
  id: string;
  actorName: string;
  startedAt: string | null;
  count: number;
  kind: "session" | "saved"; // session = en mémoire ; saved = sauvegarde du navigateur
}

export function ResultsPage() {
  const session = useSearches();
  const { saved, ready } = useSavedSearches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; text: string } | null>(null);

  // Collectes explorables : celles de la session dont les résultats sont arrivés,
  // puis les sauvegardes qui ne sont pas déjà en mémoire
  const sessionIds = new Set(session.map((s) => s.id));
  const options: Option[] = [
    ...session
      .filter((s) => s.items !== null)
      .map((s) => ({
        id: s.id,
        actorName: s.actorName,
        startedAt: s.startedAt,
        count: s.items!.length,
        kind: "session" as const,
      })),
    ...(saved ?? [])
      .filter((m) => !sessionIds.has(m.id))
      .map((m) => ({
        id: m.id,
        actorName: m.actorName,
        startedAt: m.startedAt,
        count: m.count,
        kind: "saved" as const,
      })),
  ];

  const current = options.find((o) => o.id === selectedId) ?? options[0];
  const search = current ? session.find((s) => s.id === current.id) : undefined;

  // Une sauvegarde choisie est rechargée en mémoire depuis IndexedDB : aucun appel à Apify
  const currentId = current?.id;
  const needsLoad = current?.kind === "saved" && !search;
  useEffect(() => {
    if (!currentId || !needsLoad) return;
    openSaved(currentId).catch((e) =>
      setError({ id: currentId, text: e instanceof Error ? e.message : "Ouverture impossible" })
    );
  }, [currentId, needsLoad]);

  if (!ready) return <ResultsPageSkeleton />;

  if (options.length === 0) {
    return (
      <>
        <PageHeader title="Résultats" description="Explore les résultats d'une collecte" />
        <div className="p-5 sm:p-6">
          <div className="grid place-items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
            <span className="grid size-12 place-items-center bg-black text-white">
              <IconlyDocument size={24} color="currentColor" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">Aucun résultat à afficher</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Lance une recherche, ou rouvre une recherche sauvegardée ou un fichier JSON depuis l&apos;Historique.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button render={<Link href="/searches/new" />} nativeButton={false} className="h-9">
                Nouvelle recherche
              </Button>
              <Button render={<Link href="/searches" />} nativeButton={false} variant="outline" className="h-9">
                Ouvrir l&apos;historique
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Résultats"
        description="Choisis une collecte pour explorer ses résultats"
        actions={
          current && (
            <Button
              render={<Link href={`/searches/${current.id}`} />}
              nativeButton={false}
              variant="outline"
              className="h-9"
            >
              Page de la recherche
            </Button>
          )
        }
      />

      <div className="space-y-6 p-5 sm:p-6">
        {/* Sélecteur de collecte */}
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Collectes disponibles">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={o.id === current?.id}
              onClick={() => setSelectedId(o.id)}
              className={cn(
                "w-60 shrink-0 space-y-1 border p-3 text-left transition-colors",
                o.id === current?.id ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"
              )}
            >
              <span className="block truncate font-medium">{o.actorName}</span>
              <span className="block text-xs text-muted-foreground">
                {countLabel(o.count)}
                {o.startedAt && ` · ${dateFormat.format(new Date(o.startedAt))}`}
              </span>
              <span
                className={cn(
                  "inline-block px-1.5 py-0.5 text-xs",
                  o.kind === "session" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {o.kind === "session" ? "Session" : "Sauvegardée"}
              </span>
            </button>
          ))}
        </div>

        {error && error.id === current?.id && (
          <p role="alert" className="border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.text}
          </p>
        )}

        {search?.items ? (
          <ResultsExplorer
            key={search.id}
            runId={search.id}
            items={search.items}
            total={search.total}
            meta={metaFromSearch(search)}
          />
        ) : error && error.id === current?.id ? null : (
          <ResultsGridSkeleton />
        )}
      </div>
    </>
  );
}