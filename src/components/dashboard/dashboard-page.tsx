// src/components/dashboard/dashboard-page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/searches/status-badge";
import { CATEGORY_ICONS } from "@/components/actors/actor-card";
import {
  IconlyActivity,
  IconlyDocument,
  IconlyPaper,
  IconlyPlus,
  IconlySearch,
} from "@/components/icons/iconly";
import { useActors } from "@/hooks/use-actors";
import { useSavedSearches } from "@/hooks/use-saved-searches";
import { useSearches } from "@/hooks/use-searches";
import { CATEGORY_LABELS } from "@/types/actor";
import { DashboardSkeleton } from "./dashboard-skeleton";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
const fmtDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : "—");
const countLabel = (n: number) => `${n} résultat${n > 1 ? "s" : ""}`;

// Résumé des paramètres sur une ligne (texte brut)
const inputSummary = (input: Record<string, unknown>) => {
  const s = JSON.stringify(input);
  return s.length > 90 ? `${s.slice(0, 90)}…` : s;
};

const MAX_RECENT = 5;
const MAX_ACTORS = 5;

export function DashboardPage() {
  const { actors, ready: actorsReady } = useActors();
  const { saved, ready: savedReady } = useSavedSearches();
  const searches = useSearches();

  // Les Actors (localStorage) et les sauvegardes (IndexedDB) ne sont lus qu'après l'affichage
  if (!actorsReady || !savedReady) return <DashboardSkeleton />;

  const enabled = actors.filter((a) => a.enabled);
  const totalResults = searches.reduce((sum, s) => sum + (s.items?.length ?? 0), 0);
  const savedCount = saved?.length ?? 0;
  const recent = searches.slice(0, MAX_RECENT); // le store garde déjà la plus récente en premier

  const stats = [
    {
      icon: IconlyActivity,
      label: "Actors configurés",
      value: actors.length,
      hint: actors.length > 0 ? `${enabled.length} activé${enabled.length > 1 ? "s" : ""}` : "Aucun pour l'instant",
    },
    { icon: IconlySearch, label: "Recherches", value: searches.length, hint: "cette session" },
    { icon: IconlyDocument, label: "Résultats", value: totalResults, hint: "cette session" },
    { icon: IconlyPaper, label: "Sauvegardées", value: savedCount, hint: "dans ce navigateur" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de ta session"
        actions={
          <Button render={<Link href="/searches/new" />} nativeButton={false} className="h-9 gap-2">
            <IconlyPlus size={18} color="currentColor" /> Nouvelle recherche
          </Button>
        }
      />

      {/* Bandeau de statistiques (même structure que le skeleton) */}
      <div className="grid grid-cols-2 gap-4 border-b border-border px-5 py-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {stats.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="flex items-center gap-3 lg:pl-4 lg:first:pl-0">
            <span className="grid size-10 shrink-0 place-items-center bg-black text-white">
              <Icon size={20} color="currentColor" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{label}</p>
              <p className="text-base font-semibold leading-tight">
                {value} <span className="text-xs font-normal text-muted-foreground">{hint}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* ===== Dernières recherches ===== */}
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Dernières recherches</h2>
            <Link href="/searches" className="text-sm text-primary hover:underline">Voir l&apos;historique</Link>
          </div>

          {recent.length === 0 ? (
            <div className="grid place-items-center gap-3 border border-dashed border-border px-6 py-12 text-center">
              <span className="grid size-12 place-items-center bg-black text-white">
                <IconlySearch size={24} color="currentColor" />
              </span>
              <div className="space-y-1">
                <p className="font-medium">Aucune recherche dans cette session</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {savedCount > 0
                    ? `Tu as ${savedCount} recherche${savedCount > 1 ? "s" : ""} sauvegardée${savedCount > 1 ? "s" : ""} : rouvre-la${savedCount > 1 ? "-les" : ""} depuis l'Historique sans dépenser de crédits.`
                    : "Lance une recherche pour voir apparaître ses résultats ici."}
                </p>
              </div>
              <Button
                render={<Link href={savedCount > 0 ? "/searches" : "/searches/new"} />}
                nativeButton={false}
                variant={savedCount > 0 ? "outline" : "default"}
                className="h-9"
              >
                {savedCount > 0 ? "Ouvrir l'historique" : "Nouvelle recherche"}
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/searches/${s.id}`}
                    className="flex items-center gap-3 border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-accent/40"
                  >
                    <span className="grid size-9 shrink-0 place-items-center bg-black text-white">
                      <IconlySearch size={18} color="currentColor" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-medium">{s.actorName}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{inputSummary(s.input)}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(s.startedAt)}
                        {s.items && ` · ${countLabel(s.items.length)}`}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ===== Mes Actors : raccourcis de lancement ===== */}
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Mes Actors</h2>
            <Link href="/actors" className="text-sm text-primary hover:underline">Gérer</Link>
          </div>

          {actors.length === 0 ? (
            <div className="space-y-3 border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Ajoute ton premier Actor pour pouvoir lancer une recherche.
              </p>
              <Button render={<Link href="/actors" />} nativeButton={false} className="h-9">
                Ajouter un Actor
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {actors.slice(0, MAX_ACTORS).map((a) => {
                const Icon = CATEGORY_ICONS[a.category];
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-3 border border-border bg-card p-3 ${a.enabled ? "" : "opacity-60"}`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center bg-black text-white">
                      <Icon size={18} color="currentColor" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.enabled ? CATEGORY_LABELS[a.category] : "Désactivé"}
                      </p>
                    </div>
                    {a.enabled && (
                      <Button
                        render={<Link href={`/searches/new?actor=${a.id}`} />}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                      >
                        Lancer
                      </Button>
                    )}
                  </li>
                );
              })}
              {actors.length > MAX_ACTORS && (
                <li className="text-center text-sm text-muted-foreground">
                  + {actors.length - MAX_ACTORS} autre{actors.length - MAX_ACTORS > 1 ? "s" : ""} Actor{actors.length - MAX_ACTORS > 1 ? "s" : ""}
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      <p className="px-5 pb-6 text-xs text-muted-foreground sm:px-6">
        Les compteurs « cette session » repartent à zéro quand tu recharges la page. Tes recherches
        sauvegardées restent dans l&apos;Historique.
      </p>
    </>
  );
}