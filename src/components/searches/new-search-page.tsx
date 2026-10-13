"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { IconlyActivity } from "@/components/icons/iconly";
import { useActors } from "@/hooks/use-actors";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types/actor";
import { NewSearchSkeleton } from "./new-search-skeleton";
import { SearchForm } from "./search-form";

export function NewSearchPage() {
  const { actors, ready } = useActors();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!ready) return <NewSearchSkeleton />;

  // Seuls les Actors activés sont proposés ; par défaut le premier
  const enabled = actors.filter((a) => a.enabled);
  const actor = enabled.find((a) => a.id === selectedId) ?? enabled[0];

  return (
    <>
      <PageHeader title="Nouvelle recherche" description="Choisis un Actor, règle ses paramètres, lance la collecte" />
      {!actor ? (
        <div className="p-5 sm:p-6">
          <div className="grid place-items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
            <span className="grid size-12 place-items-center bg-black text-white">
              <IconlyActivity size={24} color="currentColor" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">
                {actors.length === 0 ? "Aucun Actor configuré" : "Tous tes Actors sont désactivés"}
              </p>
              <p className="text-sm text-muted-foreground">
                Configure ou active un Actor pour pouvoir lancer une recherche.
              </p>
            </div>
            <Button render={<Link href="/actors" />} className="h-10">Gérer mes Actors</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 p-5 sm:p-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium">1. Choisis un Actor</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {enabled.map((a) => (
                <button key={a.id} type="button" onClick={() => setSelectedId(a.id)}
                  aria-pressed={a.id === actor.id}
                  className={cn(
                    "border p-3 text-left transition-colors",
                    a.id === actor.id ? "border-primary bg-accent" : "border-border hover:bg-muted"
                  )}>
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{a.apifyId}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{CATEGORY_LABELS[a.category]}</p>
                </button>
              ))}
            </div>
          </section>
          <SearchForm key={actor.id} actor={actor} />
        </div>
      )}
    </>
  );
}